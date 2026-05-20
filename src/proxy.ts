import { NextRequest, NextResponse } from "next/server";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const token = request.cookies.get("bb_token")?.value;

  if (!token) return NextResponse.rewrite(new URL("/not-found", request.url));

  try {
    // atob é disponível no Edge Runtime (ao contrário de Buffer)
    const base64 = token.split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));

    const role = payload?.role as string | undefined;
    const isAdmin = role === "superadmin" || role === "admin";

    if (!isAdmin) return NextResponse.rewrite(new URL("/not-found", request.url));

    return NextResponse.next();
  } catch {
    return NextResponse.rewrite(new URL("/not-found", request.url));
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
