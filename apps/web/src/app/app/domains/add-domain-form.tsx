'use client';

import { space } from '@souramail/ui';
import { useActionState } from 'react';
import { Button, Callout, Field, Input } from '@/components/ui';
import { type ActionState, addDomainAction } from './actions';

const initial: ActionState = {};

export function AddDomainForm() {
  const [state, formAction, pending] = useActionState(addDomainAction, initial);
  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
      <Field label="Domain" hint="Enter the domain you send email from, e.g. myapp.com">
        <Input name="name" required placeholder="myapp.com" autoComplete="off" />
      </Field>
      {state.error ? <Callout tone="error">{state.error}</Callout> : null}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Adding…' : 'Connect domain'}
        </Button>
      </div>
    </form>
  );
}
