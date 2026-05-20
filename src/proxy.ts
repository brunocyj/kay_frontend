import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Só protege rotas que começam com /admin
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const token = request.cookies.get("bb_token")?.value;

  // Sem token → 404 (não revela que a rota existe)
  if (!token) return NextResponse.rewrite(new URL("/not-found", request.url));

  // Decodifica o payload do JWT (sem verificar assinatura — verificação real é no backend)
  // O objetivo aqui é apenas esconder a rota de quem não tem token de admin
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf-8")
    );

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
