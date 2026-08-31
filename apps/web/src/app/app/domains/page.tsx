import Link from 'next/link';
import { Icon } from '@/components/icon';
import { Badge, Card } from '@/components/ui';
import { listDomains } from '@/lib/domains';
import { requireAppContext } from '@/lib/session';
import { AddDomainForm } from './add-domain-form';
import { healthTone } from './health';

export default async function DomainsPage() {
  const { workspace } = await requireAppContext();
  const domains = await listDomains(workspace.workspaceId);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-xl">
      <header>
        <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
          Domains
        </h1>
        <p className="mt-xs text-body-sm text-on-surface-variant">
          Connect a domain, then publish the DNS records SouraMAIL generates for it.
        </p>
      </header>

      <Card>
        <h2 className="mb-md font-headline-md text-[16px] font-semibold">Connect a domain</h2>
        <AddDomainForm />
      </Card>

      {domains.length > 0 ? (
        <div className="flex flex-col gap-sm">
          {domains.map((d) => (
            <Link key={d.id} href={`/app/domains/${d.id}`} className="no-underline">
              <Card interactive className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="font-mono font-semibold text-on-surface">{d.name}</span>
                  <span className="text-[12px] text-on-surface-variant">
                    {d.dnsProvider && d.dnsProvider !== 'unknown'
                      ? `DNS: ${d.dnsProvider}`
                      : 'DNS provider not detected'}
                  </span>
                </div>
                <div className="flex items-center gap-sm">
                  <Badge tone={statusTone(d.status)}>{d.status}</Badge>
                  <Badge tone={healthTone(d.healthScore)}>Health {d.healthScore}</Badge>
                  <Icon name="chevron_right" className="text-on-surface-variant" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <div className="flex flex-col items-center gap-2 py-xl text-center">
            <Icon name="dns" className="text-[32px] text-outline" />
            <p className="text-body-sm text-on-surface-variant">No domains connected yet.</p>
          </div>
        </Card>
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
