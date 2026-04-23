import { NextResponse } from "next/server";
import { getJob, pushJobLog } from "@/src/server/riff/job-store";
import { runRealPipeline } from "@/src/server/riff/pipeline";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    return NextResponse.json({ error: "job not found" }, { status: 404 });
  }

  await pushJobLog(id, "uploaded", 7, "파이프라인 시작");

  void runRealPipeline(id).catch(async (error) => {
    await pushJobLog(
      id,
      "error",
      job.progress,
      error instanceof Error ? error.message : "pipeline error",
    );
  });

  return NextResponse.json({ ok: true });
}