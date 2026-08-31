import { dash } from '@better-auth/infra';
import { getDb, schema } from '@souramail/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

const { user, session, account, verification } = schema;

/**
 * SouraMAIL auth server (Better Auth + Better Auth Infra).
 *
 * - Storage: Drizzle adapter over the shared Postgres (`@souramail/db`).
 *   Auth tables (`user`, `session`, `account`, `verification`) live in
 *   `packages/db/src/auth-schema.ts` (regen: `pnpm --filter @souramail/auth gen`).
 * - `dash()`  → analytics, audit log, admin APIs (Better Auth Infra dashboard).
 * - `sentinel()` → abuse protection; requires Better Auth Infra **Pro**. Add it
 *   here once the plan allows.
 *
 * Env: BETTER_AUTH_URL, BETTER_AUTH_SECRET, BETTER_AUTH_API_KEY, DATABASE_URL.
 *
 * Built lazily via `getAuth()` so importing this package never touches
 * DATABASE_URL at module-load time (Next build "collect page data", tests, CI).
 */
function build() {
  return betterAuth({
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
}

export type Auth = ReturnType<typeof build>;
export type Session = Auth['$Infer']['Session'];

let _auth: Auth | undefined;

/** Lazily-constructed shared auth instance. */
export function getAuth(): Auth {
  if (!_auth) _auth = build();
  return _auth;
}
