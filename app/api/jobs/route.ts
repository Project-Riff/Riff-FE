import { NextResponse } from "next/server";
import { listJobs } from "@/src/server/riff/job-store";

export async function GET() {
  return NextResponse.json({
    jobs: listJobs(),
  });
}