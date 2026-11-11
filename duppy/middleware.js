import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Gate for the admin hub. API routes check the session again themselves.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (pathname === "/adminhub/login" || pathname.startsWith("/api/adminhub/cron/")) return;
  if (req.auth?.user?.role) return;

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/adminhub/login", req.nextUrl));
});

export const config = {
  matcher: ["/adminhub/:path*", "/api/adminhub/:path*"],
};
