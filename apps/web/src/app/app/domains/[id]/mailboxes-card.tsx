'use client';

import { useActionState } from 'react';
import { Icon } from '@/components/icon';
import { Button, Callout } from '@/components/ui';
import { type AddMailboxState, addMailboxAction } from './mailbox-actions';

interface MailboxLite {
  id: string;
  address: string;
  type: string;
  quotaBytes: number;
}

const initial: AddMailboxState = {};

export function MailboxesCard({
  domainId,
  domainName,
  mailboxes,
}: {
  domainId: string;
  domainName: string;
  mailboxes: MailboxLite[];
}) {
  const [state, formAction, pending] = useActionState(addMailboxAction, initial);

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-headline-md text-headline-md tracking-tight text-on-surface">
          Mailboxes
        </h3>
        <span className="font-label-sm text-label-sm text-outline">
          {mailboxes.length} address{mailboxes.length === 1 ? '' : 'es'}
        </span>
      </div>

      {mailboxes.length > 0 && (
        <div className="flex flex-col divide-y divide-surface-container-high">
          {mailboxes.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2 font-mono text-body-sm text-on-surface">
                <Icon
                  name={m.type === 'alias' ? 'alternate_email' : 'mail'}
                  className="text-[16px] text-outline"
                />
                {m.address}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {(m.quotaBytes / 1_073_741_824).toFixed(0)} GB
              </span>
            </div>
          ))}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="domainId" value={domainId} />
        <div className="flex items-stretch gap-xs">
          <input
            name="localPart"
            required
            placeholder="hello"
            autoComplete="off"
            className="w-40 rounded-lg border border-surface-container-highest bg-surface px-md py-sm font-mono text-body-sm outline-none focus:border-[#00A48A] focus:ring-2 focus:ring-[#00A48A]/10"
          />
          <span className="flex items-center font-mono text-body-sm text-on-surface-variant">
            @{domainName}
          </span>
          <Button type="submit" disabled={pending} className="ml-auto">
            {pending ? 'Creating…' : 'Create mailbox'}
          </Button>
        </div>

        {state.error ? <Callout tone="error">{state.error}</Callout> : null}

        {state.ok ? (
          <Callout tone={state.ok.stalwart === 'error' ? 'warning' : 'success'}>
            <strong>{state.ok.address}</strong> created.
            {state.ok.stalwart === 'provisioned' && ' The mailbox is live on the mail server.'}
            {state.ok.stalwart === 'skipped-no-server' &&
              ' Recorded — it will be pushed to the mail server once it is connected.'}
            {state.ok.stalwart === 'error' &&
              ` Recorded, but the mail server rejected it: ${state.ok.detail ?? 'unknown error'}.`}
            <div className="mt-2 rounded border border-current/20 bg-surface px-2 py-1 font-mono text-[12px] text-on-surface">
              password: {state.ok.password}
            </div>
            <span className="mt-1 block text-[11px]">
              Shown once. SouraMAIL never stores it — copy it now.
            </span>
          </Callout>
        ) : null}
      </form>
    </div>
  );
}
