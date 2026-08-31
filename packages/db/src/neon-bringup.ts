/**
 * One-shot staging bring-up for the Neon project (SOURAMAIL).
 * Runs over Neon's HTTP SQL driver (port 443) — no raw Postgres TCP needed.
 *
 *   NEON_API_KEY=... NEON_PROJECT_ID=winter-silence-61658608 \
 *   node --experimental-strip-types src/neon-bringup.ts
 *
 * Steps: fetch owner connection URIs → create restricted `souramail_app` role →
 * run Drizzle migrations → grant on existing objects → apply RLS → verify tenant
 * isolation as `souramail_app` → print the app pooled URL for .env.staging.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { rlsStatements } from './rls.ts';

const API = 'https://console.neon.tech/api/v2';
const KEY = req('NEON_API_KEY');
const PROJECT = process.env.NEON_PROJECT_ID ?? 'winter-silence-61658608';
// base64url charset (A-Za-z0-9_-) → safe to interpolate into SQL string literals.
const APP_PW = process.env.APP_DB_PASSWORD ?? randomBytes(18).toString('base64url');
const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url));

function req(k: string): string {
  const v = process.env[k];
  if (!v) throw new Error(`missing env ${k}`);
  return v;
}

async function api(path: string): Promise<any> {
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${KEY}` } });
  if (!r.ok) throw new Error(`Neon API ${path} → ${r.status} ${await r.text()}`);
  return r.json();
}

async function uri(role: string, pooled: boolean): Promise<string> {
  const q = `database_name=neondb&role_name=${role}&pooled=${pooled}`;
  const res = await api(`/projects/${PROJECT}/connection_uri?${q}`);
  const u: string = res.uri;
  return u.includes('sslmode=') ? u : `${u}${u.includes('?') ? '&' : '?'}sslmode=require`;
}

async function main() {
  console.log(`▸ project ${PROJECT} — fetching owner connection URIs`);
  const ownerDirect = await uri('neondb_owner', false);
  const pooledHost = new URL(await uri('neondb_owner', true)).host;
  const owner = neon(ownerDirect);

  console.log('▸ creating / updating restricted role souramail_app');
  const exists = await owner.query(`select 1 from pg_roles where rolname = 'souramail_app'`);
  await owner.query(
    exists.length
      ? `alter role souramail_app login password '${APP_PW}'`
      : `create role souramail_app login password '${APP_PW}'`,
  );
  for (const s of [
    `grant usage on schema public to souramail_app`,
    `alter default privileges in schema public grant select, insert, update, delete on tables to souramail_app`,
    `alter default privileges in schema public grant usage, select on sequences to souramail_app`,
  ]) {
    await owner.query(s);
  }

  console.log('▸ running Drizzle migrations (neon-http)');
  await migrate(drizzle(owner), { migrationsFolder });

  console.log('▸ granting on existing objects + applying RLS');
  for (const s of [
    `grant select, insert, update, delete on all tables in schema public to souramail_app`,
    `grant usage, select on all sequences in schema public to souramail_app`,
    ...rlsStatements(),
  ]) {
    await owner.query(s);
  }

  console.log('▸ verifying tenant isolation as souramail_app');
  const appUri = `postgresql://souramail_app:${APP_PW}@${pooledHost}/neondb?sslmode=require`;
  const app = neon(appUri);
  const A = randomUUID();
  const B = randomUUID();

  await owner.query(
    `insert into "workspace" (id,name,slug) values ($1,'A','a-'||$1),($2,'B','b-'||$2)`,
    [A, B],
  );
  await owner.query(`insert into "domain" (tenant_id,name) values ($1,'a.test'),($2,'b.test')`, [
    A,
    B,
  ]);

  // Each HTTP call is its own session → set_config + select must share one transaction.
  const seeAs = async (tenant: string) => {
    const [, rows] = await app.transaction([
      app.query(`select set_config('app.tenant_id', $1, true)`, [tenant]),
      app.query(`select name from "domain" order by name`),
    ]);
    return (rows as { name: string }[]).map((r) => r.name);
  };
  const rowsA = await seeAs(A);
  const rowsB = await seeAs(B);
  const rowsNone = await app.query(`select name from "domain"`); // no tenant context

  await owner.query(`delete from "workspace" where id = any($1)`, [[A, B]]);

  const ok =
    JSON.stringify(rowsA) === '["a.test"]' &&
    JSON.stringify(rowsB) === '["b.test"]' &&
    (rowsNone as unknown[]).length === 0;
  if (!ok) {
    throw new Error(
      `isolation FAILED  A=${JSON.stringify(rowsA)}  B=${JSON.stringify(rowsB)}  none=${JSON.stringify(rowsNone)}`,
    );
  }
  console.log('  ✓ A sees only A, B only B, no-context sees nothing');

  console.log('\n✓ Neon staging ready. Lines for .env.staging:\n');
  console.log(`DATABASE_URL=${appUri}`);
  console.log(`DIRECT_URL=${ownerDirect}`);
}

main().catch((e) => {
  console.error('\n✗', e.message);
  process.exit(1);
});
