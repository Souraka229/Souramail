import { color, font, space } from '@souramail/ui';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.md,
        padding: space.xl,
        textAlign: 'center',
      }}
    >
      <span style={{ fontFamily: font.mono, color: color.primary, fontWeight: 600 }}>404</span>
      <h1 style={{ fontFamily: font.display, fontSize: 32, margin: 0 }}>Page introuvable</h1>
      <p style={{ color: color.muted, maxWidth: 420 }}>
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link href="/" style={{ color: color.primary, fontWeight: 600 }}>
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
