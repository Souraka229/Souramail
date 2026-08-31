import Link from 'next/link';
import type { ReactNode } from 'react';
import { Wordmark } from '@/components/logo';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mesh-gradient flex min-h-[100dvh] flex-col items-center justify-center gap-xl bg-surface px-xl py-xl">
      <Link href="/">
        <Wordmark />
      </Link>
      <div className="w-full max-w-[400px]">{children}</div>
    </main>
  );
}
