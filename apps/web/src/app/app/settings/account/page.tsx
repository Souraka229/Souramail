import { listUserWorkspaces, listWorkspaceMembers } from '@souramail/db';
import { Icon } from '@/components/icon';
import { Badge } from '@/components/ui';
import { requireAppContext } from '@/lib/session';

const PLAN_LABEL: Record<string, string> = { free: 'Free', pro: 'Pro', business: 'Business' };
const ROLE_TONE: Record<string, 'green' | 'amber' | 'neutral'> = {
  owner: 'green',
  admin: 'amber',
  member: 'neutral',
};

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function AccountPage() {
  const { user, workspace } = await requireAppContext();
  const [members, workspaces] = await Promise.all([
    listWorkspaceMembers(workspace.workspaceId),
    listUserWorkspaces(user.id),
  ]);
  const initial = (user.name?.trim()?.[0] ?? user.email[0] ?? '?').toUpperCase();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
          Account
        </h1>
        <p className="mt-xs text-body-sm text-on-surface-variant">
          Your profile and the workspace you're signed into.
        </p>
      </header>

      {/* Profile */}
      <section className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-[20px] font-semibold text-on-primary">
            {initial}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="font-headline-md text-[18px] font-semibold text-on-surface">
              {user.name || '—'}
            </span>
            <span className="flex items-center gap-2 text-body-sm text-on-surface-variant">
              {user.email}
              {user.emailVerified ? (
                <Badge tone="green">verified</Badge>
              ) : (
                <Badge tone="amber">unverified</Badge>
              )}
            </span>
          </div>
        </div>
      </section>

      {/* Active workspace */}
      <section className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-[16px] font-semibold text-on-surface">Workspace</h2>
          <Badge tone="neutral">{PLAN_LABEL[workspace.plan] ?? workspace.plan}</Badge>
        </div>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt className="font-label-sm text-[11px] uppercase tracking-wider text-outline">
              Name
            </dt>
            <dd className="mt-0.5 text-body-sm text-on-surface">{workspace.name}</dd>
          </div>
          <div>
            <dt className="font-label-sm text-[11px] uppercase tracking-wider text-outline">
              Slug
            </dt>
            <dd className="mt-0.5 font-mono text-body-sm text-on-surface">{workspace.slug}</dd>
          </div>
          <div>
            <dt className="font-label-sm text-[11px] uppercase tracking-wider text-outline">
              Your role
            </dt>
            <dd className="mt-0.5">
              <Badge tone={ROLE_TONE[workspace.role] ?? 'neutral'}>{workspace.role}</Badge>
            </dd>
          </div>
          <div>
            <dt className="font-label-sm text-[11px] uppercase tracking-wider text-outline">
              Members
            </dt>
            <dd className="mt-0.5 text-body-sm text-on-surface">{members.length}</dd>
          </div>
        </dl>
      </section>

      {/* Members */}
      <section className="flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
        <h2 className="font-headline-md text-[16px] font-semibold text-on-surface">
          Members ({members.length})
        </h2>
        <div className="flex flex-col divide-y divide-surface-container-high">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center justify-between py-3">
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-body-sm font-medium text-on-surface">
                  {m.name || m.email}
                  {m.userId === user.id ? (
                    <span className="ml-2 text-[11px] text-outline">(you)</span>
                  ) : null}
                </span>
                <span className="truncate text-[12px] text-on-surface-variant">{m.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-on-surface-variant">{fmtDate(m.joinedAt)}</span>
                <Badge tone={ROLE_TONE[m.role] ?? 'neutral'}>{m.role}</Badge>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Other workspaces */}
      {workspaces.length > 1 ? (
        <section className="flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
          <h2 className="font-headline-md text-[16px] font-semibold text-on-surface">
            Your workspaces
          </h2>
          <div className="flex flex-col divide-y divide-surface-container-high">
            {workspaces.map((w) => (
              <div key={w.workspaceId} className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-body-sm text-on-surface">
                  <Icon name="workspaces" className="text-[16px] text-outline" />
                  {w.name}
                  {w.workspaceId === workspace.workspaceId ? (
                    <span className="text-[11px] text-outline">(current)</span>
                  ) : null}
                </span>
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">{PLAN_LABEL[w.plan] ?? w.plan}</Badge>
                  <Badge tone={ROLE_TONE[w.role] ?? 'neutral'}>{w.role}</Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
