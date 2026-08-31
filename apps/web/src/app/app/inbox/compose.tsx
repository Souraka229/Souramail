'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Icon } from '@/components/icon';
import { Button, Callout } from '@/components/ui';
import { type ComposeState, sendEmailAction } from './actions';

const initial: ComposeState = {};

export function Compose({
  mailboxId,
  fromAddress,
  closeHref,
  prefill,
}: {
  mailboxId: string;
  fromAddress: string;
  closeHref: string;
  prefill?: { to?: string; subject?: string; inReplyTo?: string; quote?: string };
}) {
  const [state, formAction, pending] = useActionState(sendEmailAction, initial);

  if (state.ok) {
    return (
      <div className="rounded-xl border border-surface-container-highest bg-surface-container-lowest p-6">
        <Callout tone="success">Message sent from {fromAddress}.</Callout>
        <Link href={closeHref} className="mt-3 inline-flex items-center gap-1 text-primary">
          <Icon name="arrow_back" className="text-[16px]" /> Back to inbox
        </Link>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-surface-container-highest bg-surface-container-lowest p-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-headline-md text-[18px] font-semibold">
          {prefill?.inReplyTo ? 'Reply' : 'New message'}
        </h2>
        <Link href={closeHref} className="text-on-surface-variant hover:text-on-surface">
          <Icon name="close" />
        </Link>
      </div>

      <input type="hidden" name="mailboxId" value={mailboxId} />
      {prefill?.inReplyTo && <input type="hidden" name="inReplyTo" value={prefill.inReplyTo} />}

      <div className="text-body-sm text-on-surface-variant">
        From <span className="font-mono text-on-surface">{fromAddress}</span>
      </div>
      <input
        name="to"
        required
        defaultValue={prefill?.to ?? ''}
        placeholder="to@example.com, another@example.com"
        className="rounded-lg border border-surface-container-highest bg-surface px-md py-sm font-body-sm outline-none focus:border-[#00A48A] focus:ring-2 focus:ring-[#00A48A]/10"
      />
      <input
        name="subject"
        defaultValue={prefill?.subject ?? ''}
        placeholder="Subject"
        className="rounded-lg border border-surface-container-highest bg-surface px-md py-sm font-body-sm outline-none focus:border-[#00A48A] focus:ring-2 focus:ring-[#00A48A]/10"
      />
      <textarea
        name="text"
        rows={12}
        defaultValue={prefill?.quote ?? ''}
        placeholder="Write your message…"
        className="resize-y rounded-lg border border-surface-container-highest bg-surface px-md py-sm font-body-sm leading-relaxed outline-none focus:border-[#00A48A] focus:ring-2 focus:ring-[#00A48A]/10"
      />

      {state.error ? <Callout tone="error">{state.error}</Callout> : null}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          <Icon name="send" className="text-[16px]" />
          {pending ? 'Sending…' : 'Send'}
        </Button>
        <Link
          href={closeHref}
          className="rounded-lg px-3 py-2 font-label-md text-label-md text-on-surface-variant hover:bg-surface-container"
        >
          Discard
        </Link>
      </div>
    </form>
  );
}
