import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const cookieName = process.env.ADMIN_COOKIE_NAME || "admin_auth";
  const adminCookie = req.cookies.get(cookieName)?.value;
  const pathname = req.nextUrl.pathname;

  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminLoginPage = pathname === "/admin-login";

  if (isAdminPage && adminCookie !== "authorized") {
    return NextResponse.redirect(new URL("/admin-login", req.url));
  }

  if (isAdminLoginPage && adminCookie === "authorized") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin", "/admin-login"],
};