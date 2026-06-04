import {
  ConsultPayload,
  ConsultSubmissionError,
  submitConsult,
} from "@/src/server/consult/service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ConsultPayload>;
    await submitConsult(body);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ConsultSubmissionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("[consult] unexpected error:", error);

    return NextResponse.json(
      { error: "문의 요청 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
