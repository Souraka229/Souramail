-- Runs once on first container start (empty data dir).
-- The application connects as `souramail_app`, a NON-superuser role, so that
-- Row-Level Security is actually enforced (superusers and table owners bypass RLS).

CREATE ROLE souramail_app WITH LOGIN PASSWORD 'souramail_app';

GRANT CONNECT ON DATABASE souramail TO souramail_app;

\connect souramail

GRANT USAGE ON SCHEMA public TO souramail_app;

-- Future tables/sequences created by the migration role are usable by the app role.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO souramail_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO souramail_app;

-- Migrations run as `postgres` (owner). The app role must NOT be BYPASSRLS.
