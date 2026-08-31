import { color, font, radius, space } from '@souramail/ui';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, Button, Callout, Card } from '@/components/ui';
import { getDomainWithRecords } from '@/lib/domains';
import { requireAppContext } from '@/lib/session';
import { scanDomainAction } from '../actions';
import { healthTone } from '../health';
import { CopyField } from './copy-field';

const STATE_LABEL: Record<string, { label: string; tone: 'neutral' | 'green' | 'amber' | 'red' }> =
  {
    verified: { label: 'Verified', tone: 'green' },
    pending: { label: 'Detected, not matching', tone: 'amber' },
    missing: { label: 'Not found', tone: 'red' },
  };

export default async function DomainDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace } = await requireAppContext();
  const data = await getDomainWithRecords(workspace.workspaceId, id);
  if (!data) notFound();

  const { domain, records } = data;
  const verifiedCount = records.filter((r) => r.state === 'verified').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.xl }}>
      <div>
        <Link href="/app/domains" style={{ fontSize: 13, color: color.primary }}>
          ← Domains
        </Link>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: space.sm,
          }}
        >
          <h1 style={{ fontFamily: font.mono, fontSize: 24, margin: 0 }}>{domain.name}</h1>
          <div style={{ display: 'flex', gap: space.sm }}>
            <Badge tone={domain.status === 'active' ? 'green' : 'amber'}>{domain.status}</Badge>
            <Badge tone={healthTone(domain.healthScore)}>
              Email Health {domain.healthScore}/100
            </Badge>
          </div>
        </div>
      </div>

      {domain.status !== 'active' ? (
        <Callout tone="info">
          Add the {records.length} records below at your DNS provider
          {domain.dnsProvider && domain.dnsProvider !== 'unknown' ? ` (${domain.dnsProvider})` : ''}
          , then run <strong>Verify DNS</strong>. {verifiedCount}/{records.length} verified so far.
          <br />
          Sending and receiving mail also needs the SouraMAIL mail server — that comes with Phase 1
          infrastructure provisioning.
        </Callout>
      ) : (
        <Callout tone="success">
          All DNS records verified. This domain is ready for mailboxes.
        </Callout>
      )}

      <form action={scanDomainAction}>
        <input type="hidden" name="id" value={domain.id} />
        <Button type="submit">Verify DNS</Button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
        {records.map((r) => {
          const s = STATE_LABEL[r.state] ?? STATE_LABEL.missing!;
          return (
            <Card key={r.id}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: space.sm,
                }}
              >
                <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: 13 }}>
                  {r.key} · {r.type}
                </span>
                <Badge tone={s.tone}>{s.label}</Badge>
              </div>
              <p style={{ fontSize: 13, color: color.muted, margin: `0 0 ${space.md}px` }}>
                {r.purpose}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: space.xs }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: color.muted }}>
                  NAME / HOST
                </span>
                <CopyField value={r.name} />
                <span
                  style={{ fontSize: 12, fontWeight: 600, color: color.muted, marginTop: space.xs }}
                >
                  VALUE
                </span>
                <CopyField value={r.expectedValue} />
              </div>

              {r.observedValue && r.state !== 'verified' ? (
                <div
                  style={{
                    marginTop: space.sm,
                    fontSize: 12,
                    color: color.muted,
                    fontFamily: font.mono,
                    background: color.background,
                    borderRadius: radius.sm,
                    padding: space.sm,
                    wordBreak: 'break-all',
                  }}
                >
                  Currently published: {r.observedValue}
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
