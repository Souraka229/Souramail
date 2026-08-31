import { color, font, space } from '@souramail/ui';
import Link from 'next/link';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.xl,
        padding: space.xl,
        background: color.background,
      }}
    >
      <Link
        href="/"
        style={{
          fontFamily: font.mono,
          color: color.primary,
          fontWeight: 600,
          textDecoration: 'none',
          fontSize: 18,
        }}
      >
        SouraMAIL
      </Link>
      <div style={{ width: '100%', maxWidth: 400 }}>{children}</div>
    </main>
  );
}
