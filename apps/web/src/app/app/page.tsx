import { PLAN_LIMITS } from '@souramail/core';
import Link from 'next/link';
import { Icon } from '@/components/icon';
import { listDomains } from '@/lib/domains';
import { requireAppContext } from '@/lib/session';

export default async function OverviewPage() {
  const { user, workspace } = await requireAppContext();
  const domains = await listDomains(workspace.workspaceId);
  const limits = PLAN_LIMITS[workspace.plan];
  const activeDomains = domains.filter((d) => d.status === 'active').length;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header>
        <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
          Welcome{user.name ? `, ${user.name.split(' ')[0]}` : ''}.
        </h1>
        <p className="mt-xs text-body-sm text-on-surface-variant">
          Workspace <strong className="text-on-surface">{workspace.name}</strong> · {workspace.role}{' '}
          · {workspace.plan} plan
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          icon="dns"
          label="Domains connected"
          value={`${domains.length}`}
          sub={`${activeDomains} verified`}
        />
        <Stat
          icon="workspaces"
          label="Domain limit"
          value={limits.domains === 'unlimited' ? '∞' : `${limits.domains}`}
          sub={`${workspace.plan} plan`}
        />
        <Stat
          icon="send"
          label="Daily send limit"
          value={limits.dailySend.toLocaleString()}
          sub="emails / day"
        />
        <Stat
          icon="auto_awesome"
          label="AI actions / day"
          value={limits.aiActionsPerDay === 'unlimited' ? '∞' : `${limits.aiActionsPerDay}`}
          sub="Copilot + Rules"
        />
      </div>

      <div className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
        <h2 className="font-headline-md text-[16px] font-semibold">Next step</h2>
        <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
          {domains.length === 0
            ? 'Connect the domain you send email from. SouraMAIL generates the exact MX / SPF / DKIM / DMARC records and checks them for you.'
            : 'Publish the generated DNS records, then hit Verify. Mailboxes and real send/receive arrive with the Phase 1 mail server.'}
        </p>
        <div>
          <Link
            href="/app/domains"
            className="inline-flex items-center gap-2 rounded-lg bg-[#00A48A] px-lg py-sm font-label-md text-label-md text-white shadow-sm transition-colors hover:bg-[#008f78]"
          >
            <Icon name={domains.length === 0 ? 'add' : 'arrow_forward'} className="text-[18px]" />
            {domains.length === 0 ? 'Connect a domain' : 'Review domains'}
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-5 shadow-sm">
      <div className="flex items-center gap-2 text-on-surface-variant">
        <Icon name={icon} className="text-[18px]" />
        <span className="font-label-sm text-label-sm uppercase tracking-wider">{label}</span>
      </div>
      <span className="font-headline-lg text-[28px] font-bold leading-none text-on-surface">
        {value}
      </span>
      <span className="text-[12px] text-on-surface-variant">{sub}</span>
    </div>
  );
}
