import { dashClient, sentinelClient } from '@better-auth/infra/client';
import { createAuthClient } from 'better-auth/react';

/**
 * Browser auth client. Talks to the Next.js /api/auth/* routes (same origin).
 * `sentinelClient` handles device fingerprinting + proof-of-work challenges;
 * it is a no-op until the Sentinel plugin is enabled server-side (Infra Pro).
 */
export const authClient = createAuthClient({
  basePath: '/api/auth',
  plugins: [dashClient(), sentinelClient({ autoSolveChallenge: true })],
});

export const { signIn, signUp, signOut, useSession } = authClient;
