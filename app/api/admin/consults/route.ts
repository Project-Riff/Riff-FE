import { NextResponse } from "next/server";
import {
  ConsultSubmissionError,
  listConsults,
} from "@/src/server/consult/service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "10");
    const query = searchParams.get("query") ?? "";

    const result = await listConsults({
      page,
      pageSize,
      query,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ConsultSubmissionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("[admin/consults] unexpected error:", error);

    return NextResponse.json(
      { error: "고객 리스트 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
