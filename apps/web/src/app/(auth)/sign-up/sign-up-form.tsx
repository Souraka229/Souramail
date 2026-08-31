'use client';

import { color, font, space } from '@souramail/ui';
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
      <h1 style={{ fontFamily: font.display, fontSize: 24, margin: `0 0 ${space.xs}px` }}>
        Create your account
      </h1>
      <p style={{ color: color.muted, fontSize: 14, margin: `0 0 ${space.lg}px` }}>
        A workspace is created for you automatically.
      </p>

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
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

      <p style={{ fontSize: 13, color: color.muted, marginTop: space.lg }}>
        Already have an account?{' '}
        <Link href="/sign-in" style={{ color: color.primary, fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </Card>
  );
}
