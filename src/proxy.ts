import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware para proteger rotas privadas e redirecionar usuários não autenticados
// Usamos o 'export default' para garantir que o Next.js encontre a função
export default function middleware(request: NextRequest) {
  const token = request.cookies.get("user_token")?.value;
  const role = request.cookies.get("user_role")?.value;

  const { pathname } = request.nextUrl;

  // Definimos as rotas que não precisam de autenticação
  const isPublicRoute = pathname === "/login";

  // Se não tem token e tenta acessar rota privada -> Login
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && pathname === "/login") {
    const destination = role === "ADMIN" ? "/admin" : "/home";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica o middleware em todas as rotas, exceto:
     * api, _next/static, _next/image, e ícones (arquivos estáticos)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
