import { emailHealthScore, type ScoredRecord } from '@souramail/core';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/icon';
import { getDomainWithRecords } from '@/lib/domains';
import { requireAppContext } from '@/lib/session';
import { scanDomainAction } from '../actions';
import { CopyField } from './copy-field';

const STATE_LABEL: Record<'verified' | 'pending' | 'missing', string> = {
  verified: 'Verified',
  pending: 'Detected',
  missing: 'Not found',
};

function categoryOf(key: string): ScoredRecord['category'] {
  return key === 'mx' ? 'deliverability' : 'authentication';
}

export default async function DomainDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace } = await requireAppContext();
  const data = await getDomainWithRecords(workspace.workspaceId, id);
  if (!data) notFound();

  const { domain, records } = data;
  const scored: ScoredRecord[] = records.map((r) => ({
    key: r.key,
    category: categoryOf(r.key),
    state: r.state,
  }));
  const health = emailHealthScore(scored);
  const verifiedCount = records.filter((r) => r.state === 'verified').length;
  const healthy = domain.status === 'active';
  const pct = (c: 'authentication' | 'deliverability' | 'security') => {
    const cat = health.byCategory[c];
    return Math.round((cat.earned / cat.possible) * 100);
  };
  const dmarc = records.find((r) => r.key === 'dmarc');
  const recommendDmarc = dmarc && dmarc.state === 'verified' && domain.status === 'active';

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/app/domains"
        className="flex items-center gap-xs text-body-sm text-primary hover:underline"
      >
        <Icon name="arrow_back" className="text-[16px]" /> Domains
      </Link>

      <div className="grid h-full grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Main column */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Score hero */}
          <div className="group relative flex flex-col gap-6 overflow-hidden rounded-xl bg-surface-container-lowest p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <h2 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
                  {domain.name}
                </h2>
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full ${
                      healthy
                        ? 'bg-primary-container text-on-primary-container'
                        : 'bg-tertiary-container/30 text-on-tertiary-container'
                    }`}
                  >
                    <Icon name={healthy ? 'check' : 'schedule'} className="text-[14px]" />
                  </span>
                  <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                    {healthy ? 'Healthy' : domain.status}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="font-label-md text-label-md uppercase tracking-wider text-outline">
                  Overall Score
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-xl text-[64px] font-bold leading-none tracking-tighter text-on-surface">
                    {domain.healthScore}
                  </span>
                  <span className="font-body-md text-body-md text-on-surface-variant">/100</span>
                </div>
              </div>
            </div>
            <div className="relative z-10 h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
              <div
                className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
                style={{ width: `${domain.healthScore}%` }}
              />
            </div>
            <div className="pointer-events-none absolute -right-16 -top-16 z-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl transition-colors group-hover:bg-primary/10" />
          </div>

          {/* Category cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {(
              [
                ['send', 'Deliverability', pct('deliverability')],
                ['security', 'Security', pct('security')],
                ['verified', 'Authentication', pct('authentication')],
              ] as const
            ).map(([icon, label, value]) => (
              <div
                key={label}
                className="flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <Icon name={icon} className="text-[20px]" />
                  <span className="font-label-md text-label-md uppercase tracking-wider">
                    {label}
                  </span>
                </div>
                <span className="font-headline-lg text-headline-lg text-on-surface">{value}%</span>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-container-highest">
                  <div className="h-full bg-primary" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* DNS Configuration */}
          <div className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md tracking-tight text-on-surface">
                DNS Configuration
              </h3>
              <form action={scanDomainAction}>
                <input type="hidden" name="id" value={domain.id} />
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-label-md text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary/90"
                >
                  <Icon name="refresh" className="text-[18px]" /> Verify DNS
                </button>
              </form>
            </div>

            <div className="flex flex-col gap-3">
              {records.map((r) => {
                const ok = r.state === 'verified';
                return (
                  <div
                    key={r.id}
                    className="flex flex-col gap-3 rounded-lg bg-surface-container p-3 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            ok
                              ? 'bg-primary/10 text-primary'
                              : r.state === 'pending'
                                ? 'bg-tertiary-container/20 text-on-tertiary-container'
                                : 'bg-error-container text-on-error-container'
                          }`}
                        >
                          <Icon
                            name={
                              ok ? 'check_circle' : r.state === 'pending' ? 'sync_problem' : 'error'
                            }
                            className="text-[18px]"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md uppercase text-on-surface">
                            {r.key} · {r.type}
                          </span>
                          <span className="mt-1 font-mono text-[12px] text-on-surface-variant">
                            {r.purpose}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`rounded-md px-2.5 py-1 font-label-md text-[10px] uppercase tracking-widest ${
                          ok
                            ? 'bg-primary/10 text-primary'
                            : r.state === 'pending'
                              ? 'bg-tertiary-container/20 text-on-tertiary-container'
                              : 'bg-error-container text-on-error-container'
                        }`}
                      >
                        {STATE_LABEL[r.state]}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 pl-12">
                      <div className="flex flex-col gap-1">
                        <span className="font-label-sm text-[11px] uppercase tracking-wider text-outline">
                          Name / Host
                        </span>
                        <CopyField value={r.name} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-label-sm text-[11px] uppercase tracking-wider text-outline">
                          Value
                        </span>
                        <CopyField value={r.expectedValue} />
                      </div>
                      {r.observedValue && !ok ? (
                        <p className="break-all font-mono text-[12px] text-on-surface-variant">
                          Currently published: {r.observedValue}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {recommendDmarc ? (
            <div className="relative flex flex-col gap-4 overflow-hidden rounded-xl border-l-4 border-tertiary-container bg-surface-container-lowest p-6 shadow-sm">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-tertiary-container/10 blur-2xl" />
              <div className="relative z-10 flex items-start gap-3">
                <Icon name="warning" className="mt-1 text-tertiary-container" />
                <div className="flex flex-col">
                  <h3 className="font-headline-md text-[16px] font-semibold text-on-surface">
                    DMARC Policy Update Recommended
                  </h3>
                  <p className="mt-2 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
                    Your DMARC policy is at{' '}
                    <code className="rounded bg-surface-container px-1 py-0.5 font-mono text-[12px]">
                      p=none
                    </code>
                    . Once your reports look clean, tighten it to{' '}
                    <code className="rounded bg-surface-container px-1 py-0.5 font-mono text-[12px]">
                      p=quarantine
                    </code>{' '}
                    then{' '}
                    <code className="rounded bg-surface-container px-1 py-0.5 font-mono text-[12px]">
                      p=reject
                    </code>
                    .
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
              <h3 className="font-label-md text-label-md uppercase tracking-wider text-outline">
                Setup progress
              </h3>
              <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
                {verifiedCount}/{records.length} records verified. Publish the values on the left at
                your DNS provider
                {domain.dnsProvider && domain.dnsProvider !== 'unknown'
                  ? ` (${domain.dnsProvider})`
                  : ''}
                , then hit <strong>Verify DNS</strong>.
              </p>
              <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
                Sending &amp; receiving real mail also needs the SouraMAIL mail server (Phase 1
                infrastructure).
              </p>
            </div>
          )}

          <div className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
            <h3 className="font-label-md text-label-md uppercase tracking-wider text-outline">
              Recent Health Events
            </h3>
            {records
              .filter((r) => r.state === 'verified')
              .map((r) => (
                <div
                  key={r.id}
                  className="relative flex flex-col gap-1 border-l-2 border-surface-container pb-4 pl-4 before:absolute before:-left-[5px] before:top-1.5 before:h-2 before:w-2 before:rounded-full before:bg-primary before:content-['']"
                >
                  <span className="font-body-sm text-body-sm font-medium text-on-surface">
                    {r.key.toUpperCase()} record verified
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {domain.verifiedAt ? new Date(domain.verifiedAt).toLocaleString() : 'Recently'}
                  </span>
                </div>
              ))}
            <div className="relative flex flex-col gap-1 border-l-2 border-transparent pl-4 before:absolute before:-left-[5px] before:top-1.5 before:h-2 before:w-2 before:rounded-full before:bg-surface-variant before:content-['']">
              <span className="font-body-sm text-body-sm font-medium text-on-surface">
                Domain added
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {new Date(domain.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
