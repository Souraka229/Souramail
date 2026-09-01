import { listApiKeys } from '@souramail/db';
import { Icon } from '@/components/icon';
import { Badge } from '@/components/ui';
import { requireAppContext } from '@/lib/session';
import { revokeKeyAction } from './actions';
import { CreateKeyForm } from './create-key-form';

export default async function ApiKeysPage() {
  const { workspace } = await requireAppContext();
  const keys = await listApiKeys(workspace.workspaceId);
  const apiBase = process.env.API_PUBLIC_URL ?? 'https://gala-guema.xyz/api/v1';

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
          API keys
        </h1>
        <p className="mt-xs text-body-sm text-on-surface-variant">
          Authenticate the public API with{' '}
          <code className="font-mono">Authorization: Bearer soura_live_…</code> against{' '}
          <code className="font-mono">{apiBase}</code>. Docs at{' '}
          <code className="font-mono">{apiBase}</code> (OpenAPI:{' '}
          <code className="font-mono">{apiBase}/openapi.json</code>).
        </p>
      </header>

      <CreateKeyForm />

      <div className="flex flex-col gap-2">
        {keys.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant">No keys yet.</p>
        ) : (
          keys.map((k) => (
            <div
              key={k.id}
              className="flex items-center justify-between rounded-xl border border-surface-container-highest bg-surface-container-lowest p-4"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium text-on-surface">{k.name}</span>
                <span className="font-mono text-[12px] text-on-surface-variant">
                  {k.prefix}
                  {'…'} ·{' '}
                  {k.lastUsedAt
                    ? `used ${new Date(k.lastUsedAt).toLocaleDateString()}`
                    : 'never used'}
                </span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {k.scopes.map((s) => (
                    <Badge key={s} tone="neutral">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <form action={revokeKeyAction}>
                <input type="hidden" name="id" value={k.id} />
                <button
                  type="submit"
                  className="flex items-center gap-1 rounded-lg border border-surface-container-highest px-3 py-1.5 font-label-sm text-label-sm text-on-error-container hover:bg-error-container"
                >
                  <Icon name="delete" className="text-[16px]" /> Revoke
                </button>
              </form>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
