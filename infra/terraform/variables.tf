variable "cloudflare_api_token" {
  type      = string
  sensitive = true
  # Scope: Zone:DNS:Edit + Zone:Zone:Read + Account:Workers R2 Storage:Edit
}

variable "cloudflare_account_id" {
  type = string
}

variable "cloudflare_zone_id" {
  type = string
}

variable "root_domain" {
  type    = string
  default = "souramail.com"
}

variable "r2_bucket_name" {
  type    = string
  default = "souramail-mail"
}

variable "mail_host_ipv4" {
  type        = string
  description = "Dedicated IPv4 of the Stalwart node (PTR = mx1.<root_domain>)."
}

variable "send_host_ipv4" {
  type        = string
  description = "IPv4 used for outbound (relay egress or the mail node)."
}
