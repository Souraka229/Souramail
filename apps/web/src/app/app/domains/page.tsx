import { color, font, space } from '@souramail/ui';
import Link from 'next/link';
import { Badge, Card } from '@/components/ui';
import { listDomains } from '@/lib/domains';
import { requireAppContext } from '@/lib/session';
import { AddDomainForm } from './add-domain-form';
import { healthTone } from './health';

export default async function DomainsPage() {
  const { workspace } = await requireAppContext();
  const domains = await listDomains(workspace.workspaceId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.xl }}>
      <header>
        <h1 style={{ fontFamily: font.display, fontSize: 28, margin: 0 }}>Domains</h1>
        <p style={{ color: color.muted, marginTop: space.xs }}>
          Connect a domain, then publish the DNS records SouraMAIL generates for it.
        </p>
      </header>

      <Card>
        <h2 style={{ fontSize: 16, margin: `0 0 ${space.md}px` }}>Connect a domain</h2>
        <AddDomainForm />
      </Card>

      {domains.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}>
          {domains.map((d) => (
            <Link
              key={d.id}
              href={`/app/domains/${d.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Card
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontWeight: 600, fontFamily: font.mono }}>{d.name}</span>
                  <span style={{ fontSize: 12, color: color.muted }}>
                    {d.dnsProvider && d.dnsProvider !== 'unknown'
                      ? `DNS: ${d.dnsProvider}`
                      : 'DNS provider not detected'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
                  <Badge tone={statusTone(d.status)}>{d.status}</Badge>
                  <Badge tone={healthTone(d.healthScore)}>Health {d.healthScore}</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p style={{ color: color.muted, fontSize: 14 }}>No domains connected yet.</p>
      )}
    </div>
  );
}

function statusTone(status: string): 'neutral' | 'green' | 'amber' | 'red' {
  if (status === 'active') return 'green';
  if (status === 'verifying') return 'amber';
  if (status === 'error') return 'red';
  return 'neutral';
}
