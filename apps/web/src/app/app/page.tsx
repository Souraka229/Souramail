import { PLAN_LIMITS } from '@souramail/core';
import { color, font, space } from '@souramail/ui';
import Link from 'next/link';
import { Button, Card } from '@/components/ui';
import { listDomains } from '@/lib/domains';
import { requireAppContext } from '@/lib/session';

export default async function OverviewPage() {
  const { user, workspace } = await requireAppContext();
  const domains = await listDomains(workspace.workspaceId);
  const limits = PLAN_LIMITS[workspace.plan];
  const activeDomains = domains.filter((d) => d.status === 'active').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.xl }}>
      <header>
        <h1 style={{ fontFamily: font.display, fontSize: 28, margin: 0 }}>
          Welcome{user.name ? `, ${user.name.split(' ')[0]}` : ''}.
        </h1>
        <p style={{ color: color.muted, marginTop: space.xs }}>
          Workspace <strong>{workspace.name}</strong> · {workspace.role} · {workspace.plan} plan
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: space.md,
        }}
      >
        <Stat
          label="Domains connected"
          value={`${domains.length}`}
          sub={`${activeDomains} verified`}
        />
        <Stat
          label="Domain limit"
          value={limits.domains === 'unlimited' ? '∞' : `${limits.domains}`}
          sub={`${workspace.plan} plan`}
        />
        <Stat
          label="Daily send limit"
          value={limits.dailySend.toLocaleString()}
          sub="emails / day"
        />
        <Stat
          label="AI actions / day"
          value={limits.aiActionsPerDay === 'unlimited' ? '∞' : `${limits.aiActionsPerDay}`}
          sub="Copilot + Rules"
        />
      </div>

      <Card>
        <h2 style={{ fontSize: 16, margin: `0 0 ${space.xs}px` }}>Next step</h2>
        <p style={{ color: color.muted, fontSize: 14, margin: `0 0 ${space.md}px` }}>
          {domains.length === 0
            ? 'Connect the domain you send email from. SouraMAIL generates the exact MX / SPF / DKIM / DMARC records and checks them for you.'
            : 'Publish the generated DNS records, then hit Verify. Mailboxes and real send/receive arrive with the Phase 1 mail server.'}
        </p>
        <Link href="/app/domains">
          <Button>{domains.length === 0 ? 'Connect a domain' : 'Review domains'}</Button>
        </Link>
      </Card>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card padding={16}>
      <div style={{ fontSize: 12, color: color.muted, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: font.display, marginTop: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: color.muted }}>{sub}</div>
    </Card>
  );
}
