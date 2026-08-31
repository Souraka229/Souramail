# infra/

Local dev stack + mail edge + Terraform for the managed pieces.

## Local dev (core)

```bash
cp ../.env.example ../.env
pnpm infra:up            # postgres + redis + minio
pnpm --filter @souramail/db migrate
```

## Mail edge (Phase 1) — see [`DEPLOY.md`](DEPLOY.md)

```bash
MAIL_HOSTNAME=mx1.localhost STALWART_ADMIN_SECRET=dev \
docker compose -f infra/docker-compose.yml --profile mail up -d
```

| Service   | Port(s)                    | Config | Notes |
| --------- | -------------------------- | ------ | ----- |
| postgres  | 5432                       | — | app connects as `souramail_app` (non-superuser → RLS enforced) |
| redis     | 6379                       | — | cache · rate-limit · BullMQ · Rspamd (greylist/bayes/ratelimit) |
| minio     | 9000 (S3) · 9001 (console) | — | bucket `souramail-mail` auto-created (`StorageProvider` target) |
| stalwart  | 25/587/465/143/993 · 8080  | `stalwart/config/config.toml` | SMTP/IMAP/JMAP + admin API — *profile `mail`* |
| rspamd    | 11332–11334                | `rspamd/local.d/*.conf` | in: SPF/DKIM/DMARC/ARC + ClamAV · out: DKIM `soura` + ratelimit — *profile `mail`* |
| clamav    | 3310                       | — | attachment AV — *profile `mail`* |
| unbound   | 5335                       | — | local recursive resolver for Rspamd — *profile `mail`* |

Data volumes live under `infra/.data/` (git-ignored). Per-domain DKIM keys go in
`infra/.data/dkim/<domain>.soura.key`.

## Terraform — see [`terraform/README.md`](terraform/README.md)

`infra/terraform/` provisions the **non-mail** managed pieces: Cloudflare zone +
R2 bucket + DNS for the sending infra (`mx1` / `send` / `_spf` / `_dmarc`).
Neon (Postgres) + Upstash (Redis) staging are provisioned via their own flows.
