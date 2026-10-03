import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('finhealth_session')?.value;
  const { pathname } = request.nextUrl;

  const protectedRoutes = [
    '/dashboard',
    '/transactions',
    '/signals',
    '/simulator',
    '/credit',
    '/khaata',
    '/reports',
    '/upload',
    '/copilot',
    '/onboarding',
  ];

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // If attempting to access protected route without active session, redirect to signin
  if (isProtectedRoute && !session) {
    const signinUrl = new URL('/signin', request.url);
    signinUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signinUrl);
  }

  // If already logged in and visiting /signin or /signup, redirect to dashboard
  if ((pathname === '/signin' || pathname === '/signup') && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/transactions/:path*',
    '/signals/:path*',
    '/simulator/:path*',
    '/credit/:path*',
    '/khaata/:path*',
    '/reports/:path*',
    '/upload/:path*',
    '/copilot/:path*',
    '/onboarding/:path*',
    '/signin',
    '/signup',
  ],
};
