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

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    const jobId = createJobId();
    const paths = ensureJobDirs(jobId);

    const sourceName = sanitizeFilename(file.name);
    const ext = sourceName.split(".").pop() || "mp4";
    const targetPath = paths.sourcePath.replace(/\.mp4$/, `.${ext}`);

    const bytes = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(targetPath, bytes);

    const job: Job = {
      id: jobId,
      stage: "uploaded",
      progress: 5,
      message: "업로드 완료",
      createdAt: now(),
      updatedAt: now(),
      sourceName,
      sourcePath: targetPath,
      artifacts: {
        sourcePath: targetPath,
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