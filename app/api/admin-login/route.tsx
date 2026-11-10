import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_MAX_AGE_SEC,
  createAdminSessionValue,
  getAdminCookieName,
  safeEqual,
} from "@/lib/admin-auth";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    const adminSecret = process.env.ADMIN_SECRET_KEY;
    const cookieName = getAdminCookieName();

    if (!adminSecret) {
      return NextResponse.json(
        { message: "서버 환경변수가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    if (typeof password !== "string" || !safeEqual(password, adminSecret)) {
      return NextResponse.json(
        { message: "관리자 키가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const response = NextResponse.json(
      { message: "관리자 로그인 성공" },
      { status: 200 }
    );

    response.cookies.set(cookieName, await createAdminSessionValue(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE_SEC,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { message: "요청 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}