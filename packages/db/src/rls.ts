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

  // Bootstrap lookup #2: resolve an inbound recipient address → (tenant, mailbox)
  // for the Stalwart MTA-hook, which arrives with no tenant context. Same
  // SECURITY DEFINER pattern — narrow, read-only, keyed on the address passed in.
  // Aliases resolve to their target mailbox.
  stmts.push(
    `create or replace function mailbox_by_address(p_address text)
       returns table (mailbox_id uuid, tenant_id uuid, mailbox_type mailbox_type, target_mailbox_id uuid)
       language sql
       stable
       security definer
       set search_path = public
     as $fn$
       select
         coalesce(m.target_mailbox_id, m.id) as mailbox_id,
         m.tenant_id,
         m.type,
         m.target_mailbox_id
       from mailbox m
       where lower(m.address) = lower(p_address)
       limit 1
     $fn$`,
    `revoke all on function mailbox_by_address(text) from public`,
    `do $grant$
     begin
       if exists (select 1 from pg_roles where rolname = 'souramail_app') then
         execute 'grant execute on function mailbox_by_address(text) to souramail_app';
       end if;
     end
     $grant$`,
  );

  // Bootstrap lookup #4: resolve an API key hash → (tenant, scopes) for the
  // public API, which authenticates with `Authorization: Bearer soura_...` and
  // has no tenant context until the key is matched.
  stmts.push(
    `create or replace function api_key_by_hash(p_hash text)
       returns table (api_key_id uuid, tenant_id uuid, scopes jsonb, key_name text)
       language sql
       stable
       security definer
       set search_path = public
     as $fn$
       select k.id, k.tenant_id, k.scopes, k.name
       from api_key k
       where k.hash = p_hash
       limit 1
     $fn$`,
    `revoke all on function api_key_by_hash(text) from public`,
    `do $grant$
     begin
       if exists (select 1 from pg_roles where rolname = 'souramail_app') then
         execute 'grant execute on function api_key_by_hash(text) to souramail_app';
       end if;
     end
     $grant$`,
  );

  // Bootstrap lookup #3: resolve a provider message id → (outbound_job, tenant)
  // for the SES/FBL delivery-event webhook, which arrives with no tenant context.
  stmts.push(
    `create or replace function outbound_job_by_provider_msg(p_provider_msg_id text)
       returns table (outbound_job_id uuid, tenant_id uuid, message_id uuid)
       language sql
       stable
       security definer
       set search_path = public
     as $fn$
       select o.id, o.tenant_id, o.message_id
       from outbound_job o
       where o.provider_message_id = p_provider_msg_id
       limit 1
     $fn$`,
    `revoke all on function outbound_job_by_provider_msg(text) from public`,
    `do $grant$
     begin
       if exists (select 1 from pg_roles where rolname = 'souramail_app') then
         execute 'grant execute on function outbound_job_by_provider_msg(text) to souramail_app';
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
