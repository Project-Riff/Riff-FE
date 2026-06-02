import fs from "fs";
import { getJob, patchJob, pushJobLog } from "./job-store";
import { ensureJobDirs } from "./local-paths";
import {
  probeVideo,
  detectStableSceneChunks,
  cutSegments,
  normalizeClipsForTimeline,
  concatClips,
  muxVideoWithAudioAndSubtitles,
} from "./ffmpeg";
import {
  analyzeCutsWithGemini,
  deriveRegionTitle,
  regenerateScriptWithGemini,
} from "./gemini";
import { makeTtsWav, measureSubtitleTimings, probeAudioDuration } from "./macos-tts";
import { renderRemotionOverlay } from "./remotion";
import { buildSfxCues } from "./sfx";
import { writeSrtFile } from "./srt";
import { generateInstagramCaption } from "./instagram-caption";
import { generateThumbnail } from "./thumbnail";
import { AnalysisResult, ResumeFrom } from "./types";

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function readJsonFile<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

function shouldSkipAnalysis(resumeFrom?: ResumeFrom) {
  return (
    resumeFrom === "analysis" ||
    resumeFrom === "script" ||
    resumeFrom === "title" ||
    resumeFrom === "subtitle-only" ||
    resumeFrom === "subtitle" ||
    resumeFrom === "tts" ||
    resumeFrom === "body"
  );
}

function shouldSkipSubtitle(resumeFrom?: ResumeFrom) {
  return (
    resumeFrom === "subtitle" ||
    resumeFrom === "tts" ||
    resumeFrom === "body"
  );
}

function shouldSkipTts(resumeFrom?: ResumeFrom) {
  return (
    resumeFrom === "tts" ||
    resumeFrom === "body" ||
    resumeFrom === "title" ||
    resumeFrom === "subtitle-only"
  );
}

function shouldSkipBody(resumeFrom?: ResumeFrom) {
  return (
    resumeFrom === "script" ||
    resumeFrom === "body" ||
    resumeFrom === "title" ||
    resumeFrom === "subtitle-only"
  );
}

function scaleSubtitleTimingsToDuration(
  subtitles: AnalysisResult["subtitles"],
  targetDuration: number,
) {
  if (!subtitles || subtitles.length === 0) {
    return subtitles;
  }

  const sourceDuration = subtitles[subtitles.length - 1]?.end ?? 0;

  if (!Number.isFinite(sourceDuration) || sourceDuration <= 0) {
    return subtitles;
  }

  const ratio = targetDuration / sourceDuration;
  const scaled = subtitles.map((item) => {
    const rawDuration = Math.max(0, item.end - item.start);
    const scaledDuration = Number((rawDuration * ratio).toFixed(3));

    return {
      ...item,
      start: 0,
      end: scaledDuration,
    };
  });

  let cursor = 0;

  return scaled
    .map((item, index) => {
      const isLast = index === scaled.length - 1;
      const duration = Math.max(0, item.end - item.start);
      const start =
        index === 0
          ? 0
          : Number(cursor.toFixed(3));
      const end = isLast
        ? Number(targetDuration.toFixed(3))
        : Number((start + duration).toFixed(3));

      cursor = end;

      return {
        ...item,
        start,
        end,
      };
    })
    .map((item, index, arr) => ({
      ...item,
      end:
        index === arr.length - 1
          ? item.end
          : Number(Math.min(item.end, arr[index + 1].start).toFixed(3)),
    }));
}

function clearGeneratedArtifacts(paths: ReturnType<typeof ensureJobDirs>) {
  const filesToDelete = [
    paths.sceneChunksPath,
    paths.analysisPath,
    paths.subtitlePath,
    paths.ttsPath,
    paths.bodyPath,
    paths.overlayPath,
    paths.overlaySourcePath,
    paths.bodyPath.replace(/\.mp4$/, "_padded.mp4"),
    paths.finalPath,
  ];

  for (const filePath of filesToDelete) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  if (fs.existsSync(paths.clipsDir)) {
    for (const fileName of fs.readdirSync(paths.clipsDir)) {
      const clipPath = `${paths.clipsDir}/${fileName}`;

      if (fs.existsSync(clipPath)) {
        fs.unlinkSync(clipPath);
      }
    }
  }
}

function assertFileExists(filePath: string, label: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} 파일이 없습니다: ${filePath}`);
  }
}

function assertAnalysis(analysis: AnalysisResult) {
  if (!analysis.segments || analysis.segments.length === 0) {
    throw new Error("Gemini 분석 결과에 segments가 없습니다.");
  }

  if (!analysis.subtitles || analysis.subtitles.length === 0) {
    throw new Error("Gemini 분석 결과에 subtitles가 없습니다.");
  }
}

function createAnalysisSkeleton(
  segments: AnalysisResult["segments"],
  storeInfo?: { address?: string; subtitle?: string },
): AnalysisResult {
  return {
    title: "맛집 숏폼",
    heroTitle: storeInfo?.address?.trim()
      ? deriveRegionTitle(storeInfo.address)
      : "맛집",
    heroSubtitle: storeInfo?.subtitle?.trim() || "",
    mood: "energetic",
    narration: "",
    bgmTags: ["food", "shortform", "instagram"],
    segments,
    subtitles: [],
  };
}

export async function runRealPipeline(jobId: string) {
  try {
    console.log(`[Pipeline] start job=${jobId}`);

    const job = await getJob(jobId);

    if (!job) throw new Error("job not found");

    if (
      !job.sourcePath &&
      job.resumeFrom !== "body" &&
      job.resumeFrom !== "script" &&
      job.resumeFrom !== "title" &&
      job.resumeFrom !== "subtitle-only"
    ) {
      throw new Error("sourcePath가 없습니다.");
    }

    const paths = ensureJobDirs(jobId);
    const resumeFrom = job.resumeFrom ?? "full";
    const subtitlePath = job.artifacts?.subtitlePath ?? paths.subtitlePath;

    if (resumeFrom === "full") {
      clearGeneratedArtifacts(paths);
      console.log("[Pipeline] full mode artifact reset done");
    }

    let sourceMeta: Awaited<ReturnType<typeof probeVideo>> | undefined;
    let sceneChunks: Awaited<ReturnType<typeof detectStableSceneChunks>> = [];

    if (
      resumeFrom !== "body" &&
      resumeFrom !== "script" &&
      resumeFrom !== "title" &&
      resumeFrom !== "subtitle-only"
    ) {
      await patchJob(jobId, {
        stage: "probing",
        progress: 8,
        message: "영상 정보 확인",
        error: undefined,
      });

      await pushJobLog(jobId, "probing", 10, "영상 정보 확인");

      if (!job.sourcePath) {
        throw new Error("sourcePath가 없습니다.");
      }

      sourceMeta = await probeVideo(job.sourcePath);

      await patchJob(jobId, {
        stage: "probing",
        progress: 12,
        message: `길이 ${sourceMeta.duration.toFixed(1)}초 확인`,
        error: undefined,
      });

      await pushJobLog(
        jobId,
        "probing",
        15,
        `길이 ${sourceMeta.duration.toFixed(1)}초 확인`,
      );

      await patchJob(jobId, {
        stage: "probing",
        progress: 16,
        message: "안정 구간(scene chunk) 분석 중",
        error: undefined,
      });

      await pushJobLog(jobId, "probing", 18, "안정 구간(scene chunk) 분석 중");

      sceneChunks = await detectStableSceneChunks(job.sourcePath);

      fs.writeFileSync(
        paths.sceneChunksPath,
        JSON.stringify(sceneChunks, null, 2),
        "utf-8",
      );

      await patchJob(jobId, {
        stage: "probing",
        progress: 22,
        message: `안정 구간 ${sceneChunks.length}개 추출`,
        artifacts: {
          sceneChunksPath: paths.sceneChunksPath,
        },
        error: undefined,
      });

      await pushJobLog(
        jobId,
        "probing",
        22,
        `안정 구간 ${sceneChunks.length}개 추출`,
      );
    }

    let analysis: AnalysisResult;
    let regeneratedAnalysis = false;

    const existingAnalysisPath =
      job.artifacts?.analysisPath && fs.existsSync(job.artifacts.analysisPath)
        ? job.artifacts.analysisPath
        : fs.existsSync(paths.analysisPath)
          ? paths.analysisPath
          : undefined;

    if (shouldSkipAnalysis(resumeFrom)) {
      if (!existingAnalysisPath) {
        throw new Error(
          `resumeFrom=${resumeFrom} 이지만 analysis.json이 없습니다.`,
        );
      }

      await patchJob(jobId, {
        stage: "analyzing",
        progress: 28,
        message: "기존 분석 결과 불러오는 중",
        error: undefined,
      });

      await pushJobLog(jobId, "analyzing", 28, "기존 분석 결과 불러오는 중");

      analysis = readJsonFile<AnalysisResult>(existingAnalysisPath);
    } else {
      if (!job.sourcePath) {
        throw new Error("Gemini 분석을 위해 sourcePath가 필요합니다.");
      }

      await patchJob(jobId, {
        stage: "analyzing",
        progress: 28,
        message: "Gemini 전체 영상 업로드 및 분석 시작",
        error: undefined,
      });

      await pushJobLog(
        jobId,
        "analyzing",
        28,
        "Gemini 전체 영상 업로드 및 분석 시작",
      );

      const segments = await analyzeCutsWithGemini(
        job.sourcePath,
        job.storeInfo,
        jobId,
        sourceMeta?.duration,
        sceneChunks,
      );
      analysis = createAnalysisSkeleton(segments, job.storeInfo);
      regeneratedAnalysis = true;

      fs.writeFileSync(
        paths.analysisPath,
        JSON.stringify(analysis, null, 2),
        "utf-8",
      );

      console.log(`[Pipeline] analysis 저장 완료 path=${paths.analysisPath}`);
    }

    await patchJob(jobId, {
      stage: "analyzing",
      progress: 46,
      message: "컷 분석 완료",
      analysis,
      artifacts: {
        analysisPath: paths.analysisPath,
      },
      error: undefined,
    });

    await pushJobLog(jobId, "analyzing", 46, "컷 분석 완료");

    let clipPaths =
      regeneratedAnalysis
        ? []
        : job.artifacts?.clipPaths && job.artifacts.clipPaths.length > 0
          ? job.artifacts.clipPaths.filter((clipPath) =>
              fs.existsSync(clipPath),
            )
          : [];

    if (
      resumeFrom !== "body" &&
      resumeFrom !== "script" &&
      resumeFrom !== "title" &&
      resumeFrom !== "subtitle-only"
    ) {
      await patchJob(jobId, {
        stage: "cutting",
        progress: 58,
        message: "Gemini 분석 구간 컷팅 중",
        analysis,
        artifacts: {
          analysisPath: paths.analysisPath,
          subtitlePath,
        },
        error: undefined,
      });

      await pushJobLog(jobId, "cutting", 58, "Gemini 분석 구간 컷팅 중");

      if (!job.sourcePath) {
        throw new Error("clip 생성에는 sourcePath가 필요합니다.");
      }

      if (resumeFrom === "full" || clipPaths.length === 0) {
        const rawClipPaths = await cutSegments(
          job.sourcePath,
          analysis.segments,
          paths.clipsDir,
        );

        console.log("[Pipeline] raw clip 생성 완료", rawClipPaths);

        clipPaths = await normalizeClipsForTimeline(rawClipPaths, paths.clipsDir);

        console.log("[Pipeline] 20초 기준 clip 정규화 완료", clipPaths);
      }
    }

    if (
      clipPaths.length === 0 &&
      resumeFrom !== "body" &&
      resumeFrom !== "script" &&
      resumeFrom !== "title" &&
      resumeFrom !== "subtitle-only"
    ) {
      throw new Error("사용 가능한 clipPaths가 없습니다.");
    }

    if (!shouldSkipBody(resumeFrom) || !fs.existsSync(paths.bodyPath)) {
      await concatClips(clipPaths, paths.bodyPath);
      console.log(`[Pipeline] body 생성 완료 path=${paths.bodyPath}`);
    } else {
      assertFileExists(paths.bodyPath, "body");
      console.log(`[Pipeline] body 재사용 path=${paths.bodyPath}`);
    }

    const bodyMeta = await probeVideo(paths.bodyPath);

    fs.copyFileSync(paths.bodyPath, paths.overlaySourcePath);

    console.log(`[Pipeline] body duration=${bodyMeta.duration.toFixed(2)}s`);
    await patchJob(jobId, {
      stage: "cutting",
      progress: 66,
      message: "body 영상 준비 완료",
      analysis,
      artifacts: {
        analysisPath: paths.analysisPath,
        clipPaths,
        bodyPath: paths.bodyPath,
      },
      error: undefined,
    });

    await pushJobLog(jobId, "cutting", 66, "body 영상 준비 완료");

    const ttsDeadline = Math.max(0.5, Number((bodyMeta.duration - 0.5).toFixed(3)));

    if (resumeFrom === "full" || resumeFrom === "script") {
      await patchJob(jobId, {
        stage: "analyzing",
        progress: 72,
        message: "선택된 컷 기준으로 문구 생성 중",
        analysis,
        artifacts: {
          analysisPath: paths.analysisPath,
          clipPaths,
          bodyPath: paths.bodyPath,
        },
        error: undefined,
      });

      await pushJobLog(jobId, "analyzing", 72, "선택된 컷 기준으로 문구 생성 중");

      analysis = await regenerateScriptWithGemini(analysis.segments, job.storeInfo);

      fs.writeFileSync(
        paths.analysisPath,
        JSON.stringify(analysis, null, 2),
        "utf-8",
      );

      console.log(`[Pipeline] body 이후 script 생성 완료 path=${paths.analysisPath}`);
    }

    if (resumeFrom === "title" && job.storeInfo?.address?.trim()) {
      analysis.heroTitle = deriveRegionTitle(job.storeInfo.address);
      fs.writeFileSync(
        paths.analysisPath,
        JSON.stringify(analysis, null, 2),
        "utf-8",
      );
      console.log(`[Pipeline] title-only analysis 갱신 완료 path=${paths.analysisPath}`);
    }

    if (resumeFrom === "subtitle-only" && job.storeInfo?.subtitle?.trim()) {
      analysis.heroSubtitle = job.storeInfo.subtitle.trim();
      fs.writeFileSync(
        paths.analysisPath,
        JSON.stringify(analysis, null, 2),
        "utf-8",
      );
      console.log(`[Pipeline] subtitle-only analysis 갱신 완료 path=${paths.analysisPath}`);
    }

    assertAnalysis(analysis);

    if (!shouldSkipSubtitle(resumeFrom)) {
      writeSrtFile(analysis.subtitles, subtitlePath);
      console.log(`[Pipeline] subtitle 저장 완료 path=${subtitlePath}`);
    } else {
      assertFileExists(subtitlePath, "subtitle");
      console.log(`[Pipeline] subtitle 재사용 path=${subtitlePath}`);
    }

    await patchJob(jobId, {
      stage: "tts",
      progress: 82,
      message: "TTS 생성 중",
      analysis,
      artifacts: {
        analysisPath: paths.analysisPath,
        clipPaths,
        bodyPath: paths.bodyPath,
        subtitlePath,
      },
      error: undefined,
    });

    await pushJobLog(jobId, "tts", 82, "TTS 생성 중");

    if (!shouldSkipTts(resumeFrom) || !fs.existsSync(paths.ttsPath)) {
      let measuredSubtitles = analysis.subtitles;

      if (analysis.subtitles?.length) {
        measuredSubtitles = await measureSubtitleTimings(
          analysis.subtitles,
          analysis.narration,
        );
      }

      await makeTtsWav(analysis.narration, paths.ttsPath, ttsDeadline);

      if (measuredSubtitles?.length) {
        const ttsDuration = await probeAudioDuration(paths.ttsPath);
        analysis.subtitles = scaleSubtitleTimingsToDuration(
          measuredSubtitles,
          ttsDuration,
        );
        writeSrtFile(analysis.subtitles, subtitlePath);
        fs.writeFileSync(
          paths.analysisPath,
          JSON.stringify(analysis, null, 2),
          "utf-8",
        );
      }

      console.log(`[Pipeline] TTS 생성 완료 path=${paths.ttsPath}`);
    } else {
      assertFileExists(paths.ttsPath, "TTS");
      console.log(`[Pipeline] TTS 재사용 path=${paths.ttsPath}`);
    }

    await patchJob(jobId, {
      stage: "tts",
      progress: 88,
      message: "TTS 및 자막 동기화 완료",
      analysis,
      artifacts: {
        analysisPath: paths.analysisPath,
        clipPaths,
        bodyPath: paths.bodyPath,
        subtitlePath,
        ttsPath: paths.ttsPath,
      },
      error: undefined,
    });

    await pushJobLog(jobId, "tts", 88, "TTS 및 자막 동기화 완료");

    await patchJob(jobId, {
      stage: "rendering",
      progress: 92,
      message: "20초 영상 합성 중",
      analysis,
      artifacts: {
        analysisPath: paths.analysisPath,
        clipPaths,
        ttsPath: paths.ttsPath,
        subtitlePath,
      },
      error: undefined,
    });

    await pushJobLog(jobId, "rendering", 92, "20초 영상 합성 중");

    await patchJob(jobId, {
      stage: "rendering",
      progress: 96,
      message: "디자인 오버레이 렌더링",
      analysis,
      artifacts: {
        analysisPath: paths.analysisPath,
        clipPaths,
        ttsPath: paths.ttsPath,
        subtitlePath,
        bodyPath: paths.bodyPath,
      },
      error: undefined,
    });

    await pushJobLog(jobId, "rendering", 96, "디자인 오버레이 렌더링");

    const overlayTitle =
      analysis.heroTitle?.trim() || analysis.title || "맛집 숏폼";
    const overlaySubtitle =
      job.storeInfo?.subtitle?.trim() ||
      analysis.heroSubtitle?.trim() ||
      undefined;

    await renderRemotionOverlay(
      {
        videoSrc: paths.overlaySourceUrl,
        heroTitle: overlayTitle,
        heroSubtitle: overlaySubtitle,
        infoSubtitles: analysis.subtitles,
        durationInFrames: Math.ceil(bodyMeta.duration * 60),
      },
      paths.overlayPath,
    );

    await patchJob(jobId, {
      stage: "rendering",
      progress: 98,
      message: "음성 및 자막 합성",
      analysis,
      artifacts: {
        analysisPath: paths.analysisPath,
        clipPaths,
        ttsPath: paths.ttsPath,
        subtitlePath,
        bodyPath: paths.bodyPath,
        overlayPath: paths.overlayPath,
      },
      error: undefined,
    });

    await pushJobLog(jobId, "rendering", 98, "음성 및 자막 합성");

    const sfxResult = buildSfxCues(analysis.segments);
    const sfxCues = sfxResult.cues;

    if (sfxResult.diagnostics.length > 0) {
      await pushJobLog(
        jobId,
        "rendering",
        97,
        `효과음 매칭 ${sfxResult.diagnostics
          .map(
            (item) =>
              `${item.presetId} <- ${item.shotType}(${item.matchedKeyword})`,
          )
          .join(", ")}`,
      );
    } else {
      await pushJobLog(jobId, "rendering", 97, "효과음 매칭 없음");
    }

    await patchJob(jobId, {
      artifacts: {
        sfxDiagnostics: sfxResult.diagnostics,
      },
    });

    await muxVideoWithAudioAndSubtitles(
      paths.overlayPath,
      paths.ttsPath,
      undefined,
      paths.finalPath,
      sfxCues,
    );

    const finalMeta = await probeVideo(paths.finalPath);

    console.log(
      `[Pipeline] final 생성 완료 path=${paths.finalPath}, duration=${finalMeta.duration.toFixed(2)}s`,
    );

    await patchJob(jobId, {
      stage: "rendering",
      progress: 99,
      message: "썸네일 및 게시물 패키징",
      analysis,
      artifacts: {
        analysisPath: paths.analysisPath,
        clipPaths,
        ttsPath: paths.ttsPath,
        subtitlePath,
        bodyPath: paths.bodyPath,
        overlayPath: paths.overlayPath,
        finalPath: paths.finalPath,
        finalUrl: paths.finalUrl,
      },
      error: undefined,
    });

    await pushJobLog(jobId, "rendering", 99, "썸네일 및 게시물 패키징");

    try {
      await generateThumbnail(jobId);
    } catch (thumbnailError) {
      console.error("[Pipeline] thumbnail generation failed:", thumbnailError);
    }

    try {
      await generateInstagramCaption(jobId);
    } catch (captionError) {
      console.error("[Pipeline] instagram caption generation failed:", captionError);
    }

    await patchJob(jobId, {
      stage: "done",
      progress: 100,
      message: `완료 (${finalMeta.duration.toFixed(1)}초)`,
      analysis,
      artifacts: {
        analysisPath: paths.analysisPath,
        clipPaths,
        ttsPath: paths.ttsPath,
        subtitlePath,
        bodyPath: paths.bodyPath,
        overlayPath: paths.overlayPath,
        finalPath: paths.finalPath,
        finalUrl: paths.finalUrl,
      },
      error: undefined,
    });

    await pushJobLog(
      jobId,
      "done",
      100,
      `완료 (${finalMeta.duration.toFixed(1)}초)`,
    );
  } catch (error) {
    const message = errorMessage(error);

    console.error(`[Pipeline] job ${jobId} 실패:`, error);

    try {
      await patchJob(jobId, {
        stage: "error",
        progress: 100,
        message: `실패: ${message}`,
        error: message,
      });

      await pushJobLog(jobId, "error", 100, `실패: ${message}`);
    } catch (patchError) {
      console.error("[Pipeline] 실패 상태 기록 중 추가 오류:", patchError);
    }

    throw error;
  }
}
