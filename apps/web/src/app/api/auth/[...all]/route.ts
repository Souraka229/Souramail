import { auth } from '@souramail/auth';
import { toNextJsHandler } from 'better-auth/next-js';

// Serves every Better Auth endpoint under /api/auth/* (sign-up, sign-in,
// session, callback, …). Matches the Better Auth Infra dashboard config.
export const { GET, POST } = toNextJsHandler(auth.handler);
