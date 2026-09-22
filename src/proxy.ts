import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const UPLOAD_ROLES = ["BOARD_MEMBER", "COMMITTEE_ARCH", "COMMITTEE_SOCIAL", "COMMITTEE_LANDSCAPE"];

export default auth((req) => {
  const { nextUrl } = req;
  const user = req.auth?.user;
  const path = nextUrl.pathname;

  const isMembers = path.startsWith("/members");
  const isAdmin = path.startsWith("/admin");
  const isCalendar = path.startsWith("/calendar");
  if (!isMembers && !isAdmin && !isCalendar) return NextResponse.next();

  if (!user) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  if (user.status !== "APPROVED") {
    return NextResponse.redirect(new URL("/pending-approval", nextUrl));
  }

  if (isMembers || isCalendar) return NextResponse.next();

  // Everything below is /admin/**
  const roles = user.roles ?? [];
  if (roles.includes("ADMIN")) return NextResponse.next();

  if (path.startsWith("/admin/users")) {
    if (roles.includes("MEMBERSHIP_COORDINATOR")) return NextResponse.next();
    return NextResponse.redirect(new URL("/members", nextUrl));
  }

  if (path.startsWith("/admin/content") || path.startsWith("/admin/committees")) {
    return NextResponse.redirect(new URL("/members", nextUrl));
  }

  if (path.startsWith("/admin/calendar") || path.startsWith("/admin/documents")) {
    if (roles.some((r) => UPLOAD_ROLES.includes(r))) return NextResponse.next();
    return NextResponse.redirect(new URL("/members", nextUrl));
  }

  if (path === "/admin" || path === "/admin/") {
    if (roles.includes("MEMBERSHIP_COORDINATOR") || roles.some((r) => UPLOAD_ROLES.includes(r))) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/members", nextUrl));
  }

  return NextResponse.redirect(new URL("/members", nextUrl));
});

export const config = {
  matcher: ["/members/:path*", "/admin/:path*", "/calendar/:path*"],
};
