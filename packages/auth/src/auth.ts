import { dash } from '@better-auth/infra';
import { getDb, schema } from '@souramail/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

const { user, session, account, verification } = schema;

/**
 * SouraMAIL auth server (Better Auth + Better Auth Infra).
 *
 * - Storage: Drizzle adapter over the shared Postgres (`@souramail/db`).
 *   Auth tables (`user`, `session`, `account`, `verification`, …) are generated
 *   into `packages/db/src/auth-schema.ts` via `pnpm --filter @souramail/auth gen`.
 * - `dash()`  → analytics, audit log, admin APIs (Better Auth Infra dashboard).
 * - `sentinel()` → abuse protection; requires Better Auth Infra **Pro**. Enable it
 *   once the plan allows (import it from `@better-auth/infra` and add below).
 *
 * Env: BETTER_AUTH_URL, BETTER_AUTH_SECRET, BETTER_AUTH_API_KEY, DATABASE_URL.
 */
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  basePath: '/api/auth',
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(getDb(), {
    provider: 'pg',
    schema: { user, session, account, verification },
  }),
  emailAndPassword: { enabled: true },
  plugins: [dash({ apiKey: process.env.BETTER_AUTH_API_KEY ?? '' })],
});

export type Auth = typeof auth;
export type Session = Auth['$Infer']['Session'];
