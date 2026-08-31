'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { signOut } from '@/lib/auth-client';

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await signOut();
        router.push('/sign-in');
        router.refresh();
      }}
      className="flex w-full items-center justify-center gap-sm rounded-lg border border-surface-container-highest bg-surface-container-lowest px-md py-xs font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-60"
    >
      <Icon name="logout" className="text-[16px]" />
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
