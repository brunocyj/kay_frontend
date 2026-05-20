import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (!path.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("bb_token")?.value;

  if (!token) {
    return NextResponse.rewrite(new URL("/not-found", request.url));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ["/admin/:path*"],
};
