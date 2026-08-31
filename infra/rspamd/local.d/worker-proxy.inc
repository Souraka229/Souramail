# Milter proxy — self-scan mode. Stalwart connects here on :11332 as a milter;
# Rspamd scans in-process and returns the verdict (no separate scan worker hop).
milter = yes;
timeout = 120s;
upstream "local" {
  default = yes;
  self_scan = yes;
}
