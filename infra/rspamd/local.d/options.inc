# Use the local recursive resolver (Unbound). Public resolvers rate-limit the
# RBL / DKIM / URIBL lookups Rspamd depends on (docs/05 §1).
dns {
  nameserver = ["udp://unbound:53"];
  timeout = 1s;
  sockets = 16;
  retransmits = 2;
}

# We terminate on the milter side; don't add our own Received headers.
local_addrs = "127.0.0.1, ::1, 172.16.0.0/12, 10.0.0.0/8, 192.168.0.0/16";
