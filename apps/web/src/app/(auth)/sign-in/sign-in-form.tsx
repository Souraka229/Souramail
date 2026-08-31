'use client';

import { color, font, space } from '@souramail/ui';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { Button, Callout, Card, Field, Input } from '@/components/ui';
import { signIn } from '@/lib/auth-client';

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/app';
  const preError = params.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(
    preError === 'no-workspace'
      ? 'Your account has no workspace yet. Try signing in again, or contact support.'
      : null,
  );
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: err } = await signIn.email({ email: email.trim(), password });
    setBusy(false);
    if (err) {
      setError(err.message ?? 'Invalid email or password.');
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <Card>
      <h1 style={{ fontFamily: font.display, fontSize: 24, margin: `0 0 ${space.lg}px` }}>
        Sign in
      </h1>

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
        <Field label="Email">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </Field>

        {error ? <Callout tone="error">{error}</Callout> : null}

        <Button type="submit" block disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p style={{ fontSize: 13, color: color.muted, marginTop: space.lg }}>
        New to SouraMAIL?{' '}
        <Link href="/sign-up" style={{ color: color.primary, fontWeight: 600 }}>
          Create an account
        </Link>
      </p>
    </Card>
  );
}
