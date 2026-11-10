import { NextRequest, NextResponse } from "next/server";
import { getAdminCookieName, verifyAdminSessionValue } from "@/lib/admin-auth";

/** 관리자만 쓰는 API. 고객 상담 정보 열람·수정과 Gemini를 쓰는 쇼츠 작업이 여기에 있다. */
function isAdminApi(pathname: string) {
  return (
    pathname.startsWith("/api/admin/") ||
    pathname === "/api/local-upload" ||
    pathname === "/api/jobs" ||
    pathname.startsWith("/api/jobs/")
  );
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isAuthorized = await verifyAdminSessionValue(
    req.cookies.get(getAdminCookieName())?.value,
  );

  if (isAdminApi(pathname)) {
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "관리자 로그인이 필요합니다." },
        { status: 401 },
      );
    }

    return NextResponse.next();
  }

  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminLoginPage = pathname === "/admin-login";

  if (isAdminPage && !isAuthorized) {
    return NextResponse.redirect(new URL("/admin-login", req.url));
  }

  if (isAdminLoginPage && isAuthorized) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/admin",
    "/admin-login",
    "/api/admin/:path*",
    "/api/local-upload",
    "/api/jobs",
    "/api/jobs/:path*",
  ],
};
