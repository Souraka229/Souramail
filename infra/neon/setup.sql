-- One-time provisioning for the Neon staging DB.
-- Run as the owner, over the DIRECT (non-pooled) connection:
--
--   psql "$DIRECT_URL" -f infra/neon/setup.sql
--
-- Creates the restricted runtime role `souramail_app` (no superuser, no BYPASSRLS)
-- so Row-Level Security is actually enforced in staging, exactly like local dev.
-- Replace 'REPLACE_ME' with a strong password, then put it in .env.staging DATABASE_URL.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'souramail_app') then
    create role souramail_app with login password 'REPLACE_ME';
  end if;
end
$$;

grant usage on schema public to souramail_app;

-- Objects created by future migrations (run as the owner) become usable by the app role.
alter default privileges in schema public
  grant select, insert, update, delete on tables to souramail_app;
alter default privileges in schema public
  grant usage, select on sequences to souramail_app;

-- Objects that already exist (if migrations ran before this script).
grant select, insert, update, delete on all tables in schema public to souramail_app;
grant usage, select on all sequences in schema public to souramail_app;

-- Sanity: this role must NOT be able to bypass RLS.
select rolname, rolsuper, rolbypassrls from pg_roles where rolname = 'souramail_app';
