import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";

export const middleware = withAuth(
  function middleware(request: NextRequestWithAuth) {
    const pathname = request.nextUrl.pathname;
    const userRole = request.nextauth.token?.role;

    // Se está na raiz "/" e é admin, vai para /admin
    if (pathname === "/" && userRole === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    // Se está na raiz "/" e é usuário normal, vai para /dashboard
    if (pathname === "/" && userRole && userRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Se tenta acessar /admin sem ser admin, redireciona para /dashboard
    if (
      pathname.startsWith("/admin") &&
      userRole !== "admin"
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Se está logado (tem token), autoriza
        return !!token;
      },
    },
  }
);

// Aplicar middleware a rotas protegidas
export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/profile/:path*",
  ],
};
