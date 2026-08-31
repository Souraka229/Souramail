import { type NextRequest, NextResponse } from 'next/server';

/**
 * Edge gate for `/app/*`: if there's no Better Auth session cookie, bounce to
 * sign-in before the route renders. Cheap cookie-presence check only — the
 * authoritative validation is `requireAppContext()` on the server, so a forged
 * or expired cookie still reads no data.
 *
 * We check the cookie by name rather than importing `better-auth/cookies` to
 * keep the middleware bundle free of the Node-only `jose` code path on Edge.
 */
const SESSION_COOKIES = [
  'better-auth.session_token',
  '__Secure-better-auth.session_token',
];

export function middleware(req: NextRequest): NextResponse {
  const hasSession = SESSION_COOKIES.some((name) => req.cookies.has(name));
  if (!hasSession) {
    const url = new URL('/sign-in', req.url);
    url.searchParams.set('next', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*'],
};
