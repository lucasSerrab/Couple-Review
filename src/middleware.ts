import { NextResponse, type NextRequest } from "next/server";

// Rotas que funcionam sem perfil escolhido.
const PUBLICAS = ["/perfis", "/api/perfis", "/offline", "/manifest.webmanifest", "/sw.js", "/pwa-icon"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const perfil = request.cookies.get("perfil")?.value;
  const logado = perfil === "lucas" || perfil === "giovanna";
  const publica = PUBLICAS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!logado && !publica && !pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/perfis", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$).*)"],
};
