import { getAuth } from '@souramail/auth';
import { toNextJsHandler } from 'better-auth/next-js';

// Serves every Better Auth endpoint under /api/auth/* (sign-up, sign-in,
// session, callback, …). Matches the Better Auth Infra dashboard config.
//
// Handlers resolve `getAuth()` at request time so `next build` can import this
// module without DATABASE_URL / a live DB.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  return toNextJsHandler(getAuth().handler).GET(request);
}

export async function POST(request: Request): Promise<Response> {
  return toNextJsHandler(getAuth().handler).POST(request);
}
