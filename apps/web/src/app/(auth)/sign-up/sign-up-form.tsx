'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { Button, Callout, Card, Field, Input } from '@/components/ui';
import { signUp } from '@/lib/auth-client';

export function SignUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/app';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: err } = await signUp.email({
      name: name.trim() || email.split('@')[0] || 'there',
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (err) {
      setError(err.message ?? 'Could not create the account.');
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <Card>
      <h1 className="mb-xs font-headline-md text-[24px] font-semibold">Create your account</h1>
      <p className="mb-lg text-[14px] text-on-surface-variant">
        A workspace is created for you automatically.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-md">
        <Field label="Name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder="Ada Lovelace"
          />
        </Field>
        <Field label="Work email">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@company.com"
          />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <Input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </Field>

        {error ? <Callout tone="error">{error}</Callout> : null}

        <Button type="submit" block disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-lg text-[13px] text-on-surface-variant">
        Already have an account?{' '}
        <Link href="/sign-in" className="font-semibold text-primary">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
