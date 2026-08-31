import { Icon } from '@/components/icon';
import { Callout } from '@/components/ui';
import { requireAppContext } from '@/lib/session';

export default async function InboxPage() {
  await requireAppContext();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-lg">
      <h1 className="flex items-center gap-sm font-headline-lg text-headline-lg tracking-tight text-on-surface">
        <Icon name="inbox" /> Inbox
      </h1>
      <Callout tone="info">
        The webmail client (JMAP + real-time push) runs on the SouraMAIL mail server. That server is
        stood up in the Phase 1 infrastructure step — a dedicated host with a static IPv4, PTR, and
        port 25. Until then there are no mailboxes to show.
      </Callout>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        What already works without the mail server: connecting a domain and getting its DNS
        authenticated — see the Domains tab.
      </p>
    </div>
  );
}
