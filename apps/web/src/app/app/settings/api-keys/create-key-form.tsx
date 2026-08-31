'use client';

import { useActionState } from 'react';
import { Icon } from '@/components/icon';
import { Button, Callout } from '@/components/ui';
import { type CreateKeyState, createKeyAction } from './actions';
import { API_SCOPES, SCOPE_HELP } from './scopes';

const initial: CreateKeyState = {};

export function CreateKeyForm() {
  const [state, formAction, pending] = useActionState(createKeyAction, initial);

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
      <h2 className="font-headline-md text-[16px] font-semibold">Create an API key</h2>

      {state.secret ? (
        <Callout tone="success">
          <p className="mb-2">
            <strong>{state.name}</strong> created. Copy it now — it is shown once.
          </p>
          <code className="block break-all rounded border border-current/20 bg-surface px-2 py-1 font-mono text-[12px] text-on-surface">
            {state.secret}
          </code>
        </Callout>
      ) : null}

      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-label-md text-label-md">Name</span>
          <input
            name="name"
            required
            placeholder="Production server"
            className="rounded-lg border border-surface-container-highest bg-surface px-md py-sm font-body-sm outline-none focus:border-[#00A48A] focus:ring-2 focus:ring-[#00A48A]/10"
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="font-label-md text-label-md">Scopes (least privilege)</legend>
          {API_SCOPES.map((s) => (
            <label key={s} className="flex items-center gap-2 text-body-sm">
              <input type="checkbox" name={s} className="accent-[#00A48A]" />
              <code className="font-mono text-[12px]">{s}</code>
              <span className="text-on-surface-variant">— {SCOPE_HELP[s]}</span>
            </label>
          ))}
        </fieldset>

        {state.error ? <Callout tone="error">{state.error}</Callout> : null}

        <div>
          <Button type="submit" disabled={pending}>
            <Icon name="key" className="text-[16px]" />
            {pending ? 'Creating…' : 'Create key'}
          </Button>
        </div>
      </form>
    </div>
  );
}
