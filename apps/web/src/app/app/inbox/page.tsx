import { color, font, space } from '@souramail/ui';
import { Callout } from '@/components/ui';
import { requireAppContext } from '@/lib/session';

export default async function InboxPage() {
  await requireAppContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.lg }}>
      <h1 style={{ fontFamily: font.display, fontSize: 28, margin: 0 }}>Inbox</h1>
      <Callout tone="info">
        The webmail client (JMAP + real-time push) is built on the SouraMAIL mail server. That
        server is stood up in the Phase 1 infrastructure step — a dedicated host with a static IPv4,
        PTR, and port 25. Until then there are no mailboxes to show.
      </Callout>
      <p style={{ color: color.muted, fontSize: 14 }}>
        What already works without the mail server: connecting a domain and getting its DNS
        authenticated (Domains tab).
      </p>
    </div>
  );
}
