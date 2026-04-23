import { NextResponse } from "next/server";
import { getJob } from "@/src/server/riff/job-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    console.log("[API /jobs/:id] not found", id);
    return NextResponse.json(
      { error: "not found" },
      {
        status: 404,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        },
      },
    );
  }

  console.log(
    "[API /jobs/:id]",
    id,
    "stage=",
    job.stage,
    "progress=",
    job.progress,
    "logs=",
    job.logs?.length,
    "finalUrl=",
    job.artifacts?.finalUrl,
  );

  return NextResponse.json(job, {
    headers: {
      "Cache-Control":
        "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    },
  });
}