// middleware.js

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./utils/session";
import { redirect } from "next/navigation";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // const access_token = await verifyToken(request);
  // if (!access_token) {
  //   return NextResponse.redirect(new URL("/", request.url));
  // } else {
  //   NextRequest.user = access_token;
  //   NextResponse.next()
  // }
}

// Middleware configuration to exclude static assets and specified paths

export const config = {
  matcher: [
    "/about",
    "/blog/:path",
    '/blog/:id',
    "/shop/:path",
  ],
};
