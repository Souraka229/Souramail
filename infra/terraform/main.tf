# SouraMAIL — managed infrastructure (docs/05 §9.1). Provisions the non-mail
# pieces: Cloudflare zone config, R2 bucket for MIME + attachments, and the DNS
# records for the SouraMAIL *sending* infrastructure (mx1 / send / _spf).
#
# The mail host itself (Stalwart/Rspamd on bare-metal with a controlled PTR) is
# provisioned out of band — see infra/DEPLOY.md.
#
#   cd infra/terraform
#   cp terraform.tfvars.example terraform.tfvars   # fill in
#   terraform init && terraform plan

terraform {
  required_version = ">= 1.6"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.40"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# ─── R2 bucket: raw MIME + attachments (never large blobs in Postgres) ──────
resource "cloudflare_r2_bucket" "mail" {
  account_id = var.cloudflare_account_id
  name       = var.r2_bucket_name
  location   = "WEUR" # EU data residency (docs/05 §9.4)
}

# ─── DNS for the SouraMAIL sending infrastructure ──────────────────────────
resource "cloudflare_record" "mx1" {
  zone_id = var.cloudflare_zone_id
  name    = "mx1"
  type    = "A"
  content = var.mail_host_ipv4
  proxied = false # mail must not be proxied
  ttl     = 300
}

resource "cloudflare_record" "send" {
  zone_id = var.cloudflare_zone_id
  name    = "send"
  type    = "A"
  content = var.send_host_ipv4
  proxied = false
  ttl     = 300
}

resource "cloudflare_record" "spf_include" {
  zone_id = var.cloudflare_zone_id
  name    = "_spf"
  type    = "TXT"
  content = "v=spf1 ip4:${var.send_host_ipv4} include:amazonses.com -all"
  ttl     = 300
}

resource "cloudflare_record" "dmarc_root" {
  zone_id = var.cloudflare_zone_id
  name    = "_dmarc"
  type    = "TXT"
  content = "v=DMARC1; p=none; rua=mailto:dmarc@${var.root_domain}"
  ttl     = 300
}
