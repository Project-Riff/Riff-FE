import { NextResponse } from "next/server";
import {
  ConsultSubmissionError,
  deleteConsult,
  updateConsult,
} from "@/src/server/consult/service";

function parseConsultId(value: string) {
  return Number(value);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const consultId = parseConsultId(id);
    const body = (await request.json()) as Record<string, unknown>;

    const result = await updateConsult(consultId, {
      businessNumber: String(body.businessNumber ?? ""),
      businessLocation: String(body.businessLocation ?? ""),
      name: String(body.name ?? ""),
      phone: String(body.phone ?? ""),
      email: String(body.email ?? ""),
      referrer: String(body.referrer ?? ""),
      restaurantInfo: String(body.restaurantInfo ?? ""),
      requestNote: String(body.requestNote ?? ""),
    });

    return NextResponse.json({ ok: true, item: result });
  } catch (error) {
    if (error instanceof ConsultSubmissionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("[admin/consults/:id] patch unexpected error:", error);

    return NextResponse.json(
      { error: "고객 문의 수정 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const consultId = parseConsultId(id);
    const result = await deleteConsult(consultId);

    return NextResponse.json({ ok: true, item: result });
  } catch (error) {
    if (error instanceof ConsultSubmissionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("[admin/consults/:id] delete unexpected error:", error);

    return NextResponse.json(
      { error: "고객 문의 삭제 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
