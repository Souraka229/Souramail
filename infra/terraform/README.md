# infra/terraform

Managed infrastructure for SouraMAIL (docs/05 §9.1). **Non-mail only** — the
Stalwart/Rspamd host is bare-metal, provisioned per `infra/DEPLOY.md`.

| Resource | Purpose |
| -------- | ------- |
| `cloudflare_r2_bucket.mail` | raw MIME + attachments (`StorageProvider`) |
| `cloudflare_record.mx1` / `.send` | A records for the sending infra |
| `cloudflare_record.spf_include` | `_spf.souramail.com` include target |
| `cloudflare_record.dmarc_root` | root-domain DMARC, `p=none` (tighten in Phase 4) |

Staging Postgres = **Neon** and Redis = **Upstash** are provisioned through their
own dashboards / `packages/db/src/neon-bringup.ts`, not here.

```bash
cp terraform.tfvars.example terraform.tfvars   # git-ignored
terraform init
terraform plan
terraform apply
```

State: use a remote backend (R2 via the S3 API, or Terraform Cloud) before this
is shared — do not commit `terraform.tfstate`.
