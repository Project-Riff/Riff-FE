import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { GoogleGenAI } from "@google/genai";
import { probeVideo } from "./ffmpeg";
import { getJob, patchJob, pushJobLog } from "./job-store";
import { ensureJobDirs } from "./local-paths";

function runCommand(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    });

    let stderr = "";
    let stdout = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `${command} 실행 실패 (code=${code})\nstdout:\n${stdout}\nstderr:\n${stderr}`,
        ),
      );
    });
  });
}

function escapePathForFfmpeg(p: string) {
  return p
    .replace(/\\/g, "/")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/,/g, "\\,");
}

function escapeTextForFfmpeg(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "'\\''")
    .replace(/:/g, "\\:")
    .replace(/%/g, "\\%");
}

function sanitizeMenuName(raw: string) {
  const cleaned = raw
    .replace(/[\\/:*?"<>|\r\n\t]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, 40);
}

export async function generateThumbnail(jobId: string): Promise<string> {
  const paths = ensureJobDirs(jobId);
  const tempDir = path.join(paths.jobRoot, "thumbnail_temp");

  try {
    console.log(`[Thumbnail] Starting thumbnail generation for job=${jobId}`);
    const job = await getJob(jobId);
    if (!job) throw new Error("Job not found");

    // 1. 사용할 비디오 경로 결정 (clean body video 우선)
    const videoPath = fs.existsSync(paths.bodyPath)
      ? paths.bodyPath
      : fs.existsSync(paths.finalPath)
      ? paths.finalPath
      : job.sourcePath;

    if (!videoPath || !fs.existsSync(videoPath)) {
      throw new Error("No video file found for thumbnail extraction.");
    }

    await patchJob(jobId, {
      stage: "rendering",
      progress: 98,
      message: "썸네일 프레임 추출 중...",
    });

    // 2. 5개의 후보 프레임 추출 (전체 구간 균등 분할)
    const meta = await probeVideo(videoPath);
    const duration = meta.duration;

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const timestamps = [
      0.1 * duration,
      0.3 * duration,
      0.5 * duration,
      0.7 * duration,
      0.9 * duration,
    ];
    const framePaths: string[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const ts = timestamps[i];
      const framePath = path.join(tempDir, `frame_${i}.jpg`);
      await runCommand("ffmpeg", [
        "-y",
        "-ss",
        String(ts.toFixed(3)),
        "-i",
        videoPath,
        "-vframes",
        "1",
        framePath,
      ]);
      framePaths.push(framePath);
    }

    await patchJob(jobId, {
      stage: "rendering",
      progress: 99,
      message: "Gemini 썸네일 분석 중...",
    });

    // 3. Gemini API 연동하여 최적 프레임 및 제목 생성
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY가 없습니다.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // 이미지를 base64 generative part로 변환
    const parts = framePaths
      .map((fp, idx) => {
        const data = fs.readFileSync(fp).toString("base64");
        return [
          { text: `Image Index ${idx}:` },
          { inlineData: { data, mimeType: "image/jpeg" } },
        ];
      })
      .flat();

    const userTitle = job.storeInfo?.thumbnailTitle || "";
    let userTitleLine1 = "";
    let userTitleLine2 = "";

    // 사용자가 입력한 제목에 구분자(줄바꿈, |, /)가 있으면 파싱해서 적용
    if (userTitle.trim()) {
      const splitTokens = userTitle.split(/\r?\n|\||\//).map((t) => t.trim()).filter(Boolean);
      if (splitTokens.length >= 2) {
        userTitleLine1 = splitTokens[0];
        userTitleLine2 = splitTokens.slice(1).join(" ");
      } else if (splitTokens.length === 1) {
        userTitleLine1 = splitTokens[0];
      }
    }

    const promptText = `
You are analyzing 5 candidate frames extracted from a restaurant shortform video.
Your task is to:
1. For EACH of the 5 frames (index 0-4), detect the main food/dish (or hero subject if no food) and provide a tight crop bounding box [ymin, xmin, ymax, xmax] (normalized between 0.0 and 1.0) so the subject fills the 9:16 thumbnail. Return one crop per frame.
2. Pick preferred_index (0-4): the frame that would be the most appealing thumbnail. This is just a default suggestion — the user will see all 5 and choose.
3. Generate or format the title for the thumbnail (the SAME title applies to all 5 candidates):
   - User-provided title context: "${userTitle}"
   - Pre-parsed Line 1: "${userTitleLine1}"
   - Pre-parsed Line 2: "${userTitleLine2}"
   - Address: "${job.storeInfo?.address || ""}"
   - Subtitle: "${job.storeInfo?.subtitle || ""}"
   - Narration: "${job.analysis?.narration || ""}"

   Rules:
   - If User-provided title context is present:
     * If Pre-parsed Line 1 and Pre-parsed Line 2 are both extracted, keep them exactly as is (just clean them).
     * If only Line 1 exists, split it into two logical, aesthetically pleasing lines.
   - If User-provided title context is empty, generate a catchy, high-impact Korean title for the thumbnail consisting of two lines:
     * title_line1: A catchy hook/description (e.g. "커피 맛 미쳤다", "진짜 분위기 미친", "10년 단골인", "줄서서 먹는"). MUST be under 11 characters.
     * title_line2: The name of the food/menu. If a notable secondary or signature dessert/side is highlighted alongside a main drink/dish, prefix it with "+" (e.g. "+단호박 크림뷔렐레", "+티라미수"). For solo main dishes, no prefix needed ("참치회", "북경오리", "베이커리 카페"). MUST be under 10 characters total.

Return the result strictly conforming to the requested JSON schema.
`;

    const cropBoxSchema = {
      type: "OBJECT",
      properties: {
        ymin: {
          type: "NUMBER",
          description: "Top coordinate of the crop box, float from 0 to 1.",
        },
        xmin: {
          type: "NUMBER",
          description: "Left coordinate of the crop box, float from 0 to 1.",
        },
        ymax: {
          type: "NUMBER",
          description: "Bottom coordinate of the crop box, float from 0 to 1.",
        },
        xmax: {
          type: "NUMBER",
          description: "Right coordinate of the crop box, float from 0 to 1.",
        },
      },
      required: ["ymin", "xmin", "ymax", "xmax"],
    };

    const schema = {
      type: "OBJECT",
      properties: {
        preferred_index: {
          type: "INTEGER",
          description:
            "Default suggestion: index (0-4) of the most appealing thumbnail candidate.",
        },
        crops: {
          type: "ARRAY",
          description:
            "Crop boxes for each of the 5 frames, in order index 0 to 4.",
          items: {
            type: "OBJECT",
            properties: {
              index: {
                type: "INTEGER",
                description: "Frame index (0-4).",
              },
              crop_box: cropBoxSchema,
            },
            required: ["index", "crop_box"],
          },
        },
        title_line1: {
          type: "STRING",
          description:
            "A catchy short description or hook for the first line of the title (max 15 chars).",
        },
        title_line2: {
          type: "STRING",
          description:
            "The name of the food or main dish for the second line of the title (max 12 chars).",
        },
      },
      required: [
        "preferred_index",
        "crops",
        "title_line1",
        "title_line2",
      ],
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [...parts, { text: promptText }],
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    type CropBox = { ymin: number; xmin: number; ymax: number; xmax: number };

    let result: {
      preferred_index: number;
      crops: Array<{ index: number; crop_box: CropBox }>;
      title_line1: string;
      title_line2: string;
    };

    const defaultCropBox: CropBox = {
      ymin: 0.1,
      xmin: 0.1,
      ymax: 0.9,
      xmax: 0.9,
    };

    try {
      const responseText = response.text || "{}";
      result = JSON.parse(responseText);
      console.log("[Thumbnail] Gemini analysis result:", result);
    } catch (e) {
      console.error(
        "[Thumbnail] Failed to parse Gemini response, using fallback:",
        e,
      );
      result = {
        preferred_index: 2,
        crops: timestamps.map((_, idx) => ({
          index: idx,
          crop_box: defaultCropBox,
        })),
        title_line1: userTitleLine1 || "추천 맛집",
        title_line2: userTitleLine2 || "인기 플레이스",
      };
    }

    // 4. 각 프레임마다 썸네일 후보 5개 생성 (자르기, 색상조정, 선명도, 텍스트 렌더링)
    const W = 1080;
    const H = 1920;

    const fontPath = path.join(
      process.cwd(),
      "public",
      "fonts",
      "Pretendard-SemiBold.otf",
    );
    const escapedFontPath = escapePathForFfmpeg(fontPath);
    const escapedLine1 = escapeTextForFfmpeg(result.title_line1);
    const escapedLine2 = escapeTextForFfmpeg(result.title_line2);

    const cropByIndex = new Map<number, CropBox>();
    for (const entry of result.crops || []) {
      if (
        typeof entry?.index === "number" &&
        entry.crop_box &&
        typeof entry.crop_box.ymin === "number"
      ) {
        cropByIndex.set(entry.index, entry.crop_box);
      }
    }

    const candidates = await Promise.all(
      framePaths.map(async (framePath, idx) => {
        const box = cropByIndex.get(idx) ?? defaultCropBox;

        const ymin = Math.max(0, Math.min(1, box.ymin));
        const xmin = Math.max(0, Math.min(1, box.xmin));
        const ymax = Math.max(ymin + 0.1, Math.min(1, box.ymax));
        const xmax = Math.max(xmin + 0.1, Math.min(1, box.xmax));

        const crop_w = Math.round((xmax - xmin) * W);
        const crop_h = Math.round((ymax - ymin) * H);
        const crop_x = Math.round(xmin * W);
        const crop_y = Math.round(ymin * H);

        // 색감은 자연스럽게 유지하면서 선명도 강화. 텍스트는 좌측 정렬·하단 배치.
        const filterString = [
          `crop=${crop_w}:${crop_h}:${crop_x}:${crop_y}`,
          `scale=1080:1920:force_original_aspect_ratio=increase`,
          `crop=1080:1920`,
          `eq=brightness=0.08:contrast=1.25:saturation=1.3`,
          `unsharp=5:5:1.3:5:5:0.0`,
          `drawtext=fontfile='${escapedFontPath}':text='${escapedLine1}':fontcolor=white:fontsize=88:x=60:y=1300:borderw=5:bordercolor=black:shadowcolor=black@0.35:shadowx=2:shadowy=2`,
          `drawtext=fontfile='${escapedFontPath}':text='${escapedLine2}':fontcolor=white:fontsize=100:x=60:y=1430:borderw=5:bordercolor=black:shadowcolor=black@0.35:shadowx=2:shadowy=2`,
        ].join(",");

        const outPath = path.join(paths.publicDir, `thumbnail_${idx}.jpg`);
        const outUrl = `/riff-jobs/${jobId}/thumbnail_${idx}.jpg`;

        await runCommand("ffmpeg", [
          "-y",
          "-i",
          framePath,
          "-vf",
          filterString,
          "-q:v",
          "2",
          outPath,
        ]);

        return { index: idx, url: outUrl, path: outPath };
      }),
    );

    const preferredIndex =
      typeof result.preferred_index === "number" &&
      result.preferred_index >= 0 &&
      result.preferred_index < candidates.length
        ? result.preferred_index
        : 0;

    const preferred = candidates[preferredIndex] ?? candidates[0];

    console.log(
      `[Thumbnail] Generated ${candidates.length} candidates, preferred=${preferredIndex}`,
    );

    // 5. Job 정보 업데이트
    const menuName = sanitizeMenuName(result.title_line2 || "");

    await patchJob(jobId, {
      artifacts: {
        thumbnailPath: preferred.path,
        thumbnailUrl: preferred.url,
        thumbnailCandidates: candidates,
        thumbnailPreferredIndex: preferredIndex,
        menuName: menuName || undefined,
      },
    });

    await pushJobLog(jobId, "done", 100, "썸네일 후보 생성 완료");

    return preferred.url;
  } catch (error) {
    console.error("[Thumbnail] Error generating thumbnail:", error);
    await pushJobLog(
      jobId,
      "done",
      100,
      `썸네일 생성 실패: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    throw error;
  } finally {
    // 6. 임시 디렉토리 클린업
    try {
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
          fs.unlinkSync(path.join(tempDir, file));
        }
        fs.rmdirSync(tempDir);
      }
    } catch (err) {
      console.error("[Thumbnail] Failed to clean up temp files:", err);
    }
  }
}
