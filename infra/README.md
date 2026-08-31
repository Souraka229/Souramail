# infra/

Local development stack + (later) Terraform for staging/prod.

## Local dev

```bash
cp .env.example .env
pnpm infra:up            # postgres + redis + minio
pnpm --filter @souramail/db migrate
# mail edge (Phase 1):
docker compose -f infra/docker-compose.yml --profile mail up -d
```

| Service   | Port(s)                    | Notes |
| --------- | -------------------------- | ----- |
| postgres  | 5432                       | app connects as `souramail_app` (non-superuser → RLS enforced) |
| redis     | 6379                       | cache · rate-limit · BullMQ |
| minio     | 9000 (S3) · 9001 (console) | bucket `souramail-mail` auto-created |
| stalwart  | 25/587/465/143/993 · 8080  | SMTP/IMAP/JMAP + admin — *profile `mail`* |
| rspamd    | 11332–11334                | *profile `mail`* |
| clamav    | 3310                       | *profile `mail`* |
| unbound   | 5335                       | local recursive resolver for rspamd — *profile `mail`* |

Data volumes live under `infra/.data/` (git-ignored). Delete that folder for a clean slate.

## Terraform (Phase 0 workstream — TODO)

`infra/terraform/` — network, managed Postgres, Redis, R2 bucket, Cloudflare zone, secrets manager.
Not started yet; tracked in `docs/PHASE-0.md`.
