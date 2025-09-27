// src/middleware.ts  (NextAuth v4)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/analytics",
  "/customers",
  "/items",
  "/laporan",
  "/mechanics",
  "/parts",
  "/reminders",
  "/services",
  "/vehicles",
];

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;

  const isProtected = PROTECTED_PREFIXES.some((p) =>
    nextUrl.pathname.startsWith(p)
  );
  if (!isProtected) return NextResponse.next();

  // Cek session JWT dari NextAuth v4
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET, // pastikan ada di .env
  });

  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/analytics/:path*",
    "/customers/:path*",
    "/items/:path*",
    "/laporan/:path*",
    "/mechanics/:path*",
    "/parts/:path*",
    "/reminders/:path*",
    "/services/:path*",
    "/vehicles/:path*",
  ],
};
