import { NextResponse } from "next/server";
import fs from "fs";
import { ensureJobDirs } from "@/src/server/riff/local-paths";
import { createJobId, now, sanitizeFilename } from "@/src/server/riff/utils";
import { saveJob } from "@/src/server/riff/job-store";
import { Job } from "@/src/server/riff/types";

export async function POST(request: Request) {
  try {
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
    console.error(error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "upload error",
      },
      { status: 500 },
    );
  }
}
