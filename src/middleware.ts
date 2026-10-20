import { jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const SECRET_KEY = process.env.JWT_SECRET || 'comanda-facil-secret-jwt-key-development-2026';
const key = new TextEncoder().encode(SECRET_KEY);
const COOKIE_NAME = 'comanda_token';

// Rotas protegidas
const PROTECTED_ROUTES = ['/mesas', '/comanda', '/comandas', '/produtos', '/admin'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const token = req.cookies.get(COOKIE_NAME)?.value;
  let sessionPayload: any = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
      sessionPayload = payload;
    } catch {
      sessionPayload = null;
    }
  }

  // Redireciona raiz para mesas ou login
  if (pathname === '/') {
    if (sessionPayload) {
      return NextResponse.redirect(new URL('/mesas', req.url));
    } else {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Se rota é de login e usuário já está logado
  if (pathname === '/login') {
    if (sessionPayload) {
      return NextResponse.redirect(new URL('/mesas', req.url));
    }
    return NextResponse.next();
  }

  // Se é rota protegida e usuário não está logado (RF14)
  if (isProtectedRoute) {
    if (!sessionPayload) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Se é rota administrativa (/admin, /produtos) e usuário não é admin
    if (pathname.startsWith('/admin') && sessionPayload.tipo !== 'administrador') {
      return NextResponse.redirect(new URL('/mesas?unauthorized=1', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes handle their own auth responses)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
