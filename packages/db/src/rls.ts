import type { Pool } from 'pg';
import { TENANT_SCOPED_TABLES } from './schema.ts';

/**
 * The individual DDL statements that enable + FORCE Row-Level Security on every
 * tenant-scoped table and (re)create the `tenant_isolation` policy pinning
 * visibility to the `app.tenant_id` session var set by withTenant().
 *
 * FORCE = even the table owner is subject to RLS, so a stray owner/superuser
 * connection cannot silently bypass isolation for app queries.
 *
 * One statement per array entry (works over both the pg wire protocol and the
 * Neon HTTP driver, which is single-statement).
 */
export function rlsStatements(): string[] {
  const stmts: string[] = [];

  // workspace: a tenant context sees only its own workspace row.
  stmts.push(
    `alter table "workspace" enable row level security`,
    `alter table "workspace" force row level security`,
    `drop policy if exists tenant_isolation on "workspace"`,
    `create policy tenant_isolation on "workspace" using (id = nullif(current_setting('app.tenant_id', true), '')::uuid)`,
  );

  for (const table of TENANT_SCOPED_TABLES) {
    stmts.push(
      `alter table "${table}" enable row level security`,
      `alter table "${table}" force row level security`,
      `drop policy if exists tenant_isolation on "${table}"`,
      `create policy tenant_isolation on "${table}" using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)`,
    );
  }

  // Bootstrap lookup: resolve a user's workspaces BEFORE any tenant context
  // exists (login, session hydration). SECURITY DEFINER runs as the function
  // owner (migration role), so this one narrow, read-only query is exempt from
  // the RLS policies above. Callers still can't see cross-tenant rows through it
  // — it only returns memberships for the user id they pass.
  stmts.push(
    `create or replace function app_user_workspaces(p_user_id text)
       returns table (workspace_id uuid, member_role member_role, workspace_name text, workspace_slug text, workspace_plan plan)
       language sql
       stable
       security definer
       set search_path = public
     as $fn$
       select m.tenant_id, m.role, w.name, w.slug, w.plan
       from membership m
       join workspace w on w.id = m.tenant_id
       where m.user_id = p_user_id
       order by m.created_at asc
     $fn$`,
    `revoke all on function app_user_workspaces(text) from public`,
    `do $grant$
     begin
       if exists (select 1 from pg_roles where rolname = 'souramail_app') then
         execute 'grant execute on function app_user_workspaces(text) to souramail_app';
       end if;
     end
     $grant$`,
  );

  return stmts;
}

/** Apply RLS over a node-postgres pool (local dev / CI). */
export async function applyRls(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('begin');
    for (const stmt of rlsStatements()) await client.query(stmt);
    await client.query('commit');
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}

/** Tables that should be RLS-protected (for audits/tests). */
export const rlsProtectedTables = ['workspace', ...TENANT_SCOPED_TABLES] as const;
