import { NextResponse } from "next/server";
import fs from "fs";
import { Readable } from "stream";
import { ensureJobDirs } from "@/src/server/riff/local-paths";
import { createJobId, now, sanitizeFilename } from "@/src/server/riff/utils";
import { saveJob } from "@/src/server/riff/job-store";
import { Job } from "@/src/server/riff/types";
import { compressVideoForAnalysis } from "@/src/server/riff/ffmpeg";

const COMPRESS_THRESHOLD_BYTES = 1024 * 1024 * 1024;

function getUploadDebugMeta(request: Request) {
  return {
    method: request.method,
    url: request.url,
    contentType: request.headers.get("content-type"),
    contentLength: request.headers.get("content-length"),
    transferEncoding: request.headers.get("transfer-encoding"),
    userAgent: request.headers.get("user-agent"),
    now: new Date().toISOString(),
  };
}

export async function POST(request: Request) {
  const uploadDebugMeta = getUploadDebugMeta(request);

  try {
    console.log("[local-upload] request meta", uploadDebugMeta);

    const isRawVideoUpload = !!request.headers.get("x-raw-video-upload");

    if (isRawVideoUpload) {
      const sourceName = sanitizeFilename(
        decodeURIComponent(request.headers.get("x-source-name") || "source.mp4"),
      );
      const resumeFrom = (request.headers.get("x-resume-from") || "full") as Job["resumeFrom"];
      const rawStoreInfo = request.headers.get("x-store-info");
      const declaredSize = Number(request.headers.get("x-file-size") || "0");

      let storeInfo: Job["storeInfo"] | undefined;
      if (rawStoreInfo?.trim()) {
        storeInfo = JSON.parse(
          decodeURIComponent(rawStoreInfo),
        ) as Job["storeInfo"];
      }

      const jobId = createJobId();
      const paths = ensureJobDirs(jobId);
      const ext = sourceName.split(".").pop() || "mp4";
      const originalPath = paths.sourceOriginalPath.replace(/\.mp4$/, `.${ext}`);

      if (!request.body) {
        return NextResponse.json(
          { error: "업로드할 비디오 스트림이 없습니다." },
          { status: 400 },
        );
      }

      await new Promise<void>((resolve, reject) => {
        const nodeStream = Readable.fromWeb(request.body as any);
        const writer = fs.createWriteStream(originalPath);

        nodeStream.on("error", reject);
        writer.on("error", reject);
        writer.on("finish", () => resolve());
        nodeStream.pipe(writer);
      });

      let targetPath = originalPath;
      let compressedPath: string | undefined;

      if (declaredSize >= COMPRESS_THRESHOLD_BYTES) {
        compressedPath = paths.compressedPath;
        console.log(
          `[local-upload] 대용량 파일 감지 ${(declaredSize / 1024 / 1024).toFixed(1)}MB -> 압축 시작`,
        );
        await compressVideoForAnalysis(originalPath, compressedPath);
        targetPath = compressedPath;
      }

      const job: Job = {
        id: jobId,
        stage: "uploaded",
        progress: 5,
        message: compressedPath ? "업로드 및 압축 완료" : "업로드 완료",
        createdAt: now(),
        updatedAt: now(),
        sourceName,
        sourcePath: targetPath,
        storeInfo,
        resumeFrom,
        artifacts: {
          sourcePath: targetPath,
          sourceOriginalPath: originalPath,
          compressedPath,
        },
        logs: [
          {
            t: 0,
            stage: compressedPath ? "compressing" : "uploaded",
            progress: 5,
            message: compressedPath ? "대용량 영상 압축 완료" : "업로드 완료",
          },
        ],
      };

      await saveJob(job);

      return NextResponse.json({
        jobId,
        sourceName,
        compressed: Boolean(compressedPath),
      });
    }

    const formData = await request.formData();
    const file = formData.get("video") as File | null;
    const analysisFile = formData.get("analysis") as File | null;
    const subtitleFile = formData.get("subtitle") as File | null;
    const ttsFile = formData.get("tts") as File | null;
    const bodyFile = formData.get("body") as File | null;
    const resumeFrom =
      typeof formData.get("resumeFrom") === "string"
        ? String(formData.get("resumeFrom"))
        : "full";
    const rawStoreInfo = formData.get("storeInfo");

    if (!file && !bodyFile && !analysisFile && !subtitleFile && !ttsFile) {
      return NextResponse.json(
        { error: "업로드할 파일이 없습니다." },
        { status: 400 },
      );
    }

    let storeInfo: Job["storeInfo"] | undefined;

    if (typeof rawStoreInfo === "string" && rawStoreInfo.trim()) {
      try {
        storeInfo = JSON.parse(rawStoreInfo) as Job["storeInfo"];
      } catch {
        return NextResponse.json(
          { error: "storeInfo 파싱에 실패했습니다." },
          { status: 400 },
        );
      }
    }

    const jobId = createJobId();
    const paths = ensureJobDirs(jobId);

    let sourceName: string | undefined;
    let targetPath: string | undefined;

    if (file) {
      sourceName = sanitizeFilename(file.name);
      const ext = sourceName.split(".").pop() || "mp4";
      targetPath = paths.sourcePath.replace(/\.mp4$/, `.${ext}`);

      const bytes = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(targetPath, bytes);
    }

    if (analysisFile) {
      const bytes = Buffer.from(await analysisFile.arrayBuffer());
      fs.writeFileSync(paths.analysisPath, bytes);
    }

    if (subtitleFile) {
      const bytes = Buffer.from(await subtitleFile.arrayBuffer());
      fs.writeFileSync(paths.subtitlePath, bytes);
    }

    if (ttsFile) {
      const bytes = Buffer.from(await ttsFile.arrayBuffer());
      fs.writeFileSync(paths.ttsPath, bytes);
    }

    if (bodyFile) {
      const bytes = Buffer.from(await bodyFile.arrayBuffer());
      fs.writeFileSync(paths.bodyPath, bytes);
    }

    const job: Job = {
      id: jobId,
      stage: "uploaded",
      progress: 5,
      message: "업로드 완료",
      createdAt: now(),
      updatedAt: now(),
      sourceName,
      sourcePath: targetPath,
      storeInfo,
      resumeFrom: resumeFrom as Job["resumeFrom"],
      artifacts: {
        sourcePath: targetPath,
        analysisPath: analysisFile ? paths.analysisPath : undefined,
        subtitlePath: subtitleFile ? paths.subtitlePath : undefined,
        ttsPath: ttsFile ? paths.ttsPath : undefined,
        bodyPath: bodyFile ? paths.bodyPath : undefined,
      },
      logs: [
        {
          t: 0,
          stage: "uploaded",
          progress: 5,
          message: "업로드 완료",
        },
      ],
    };

    await saveJob(job);

    return NextResponse.json({
      jobId,
      sourceName,
    });
  } catch (error) {
    console.error("[local-upload] upload failed", {
      ...uploadDebugMeta,
      errorName: error instanceof Error ? error.name : typeof error,
      errorMessage:
        error instanceof Error ? error.message : "unknown upload error",
      errorCause:
        error instanceof Error && "cause" in error
          ? String((error as Error & { cause?: unknown }).cause)
          : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "upload error",
      },
      { status: 500 },
    );
  }
}
