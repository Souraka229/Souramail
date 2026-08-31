import { color, font, layout, space } from '@souramail/ui';
import Link from 'next/link';
import { Button } from '@/components/ui';

export default function Home() {
  return (
    <main
      style={{
        maxWidth: layout.landingMaxWidth,
        margin: '0 auto',
        padding: space['4xl'],
        display: 'flex',
        flexDirection: 'column',
        gap: space.lg,
      }}
    >
      <span style={{ fontFamily: font.mono, color: color.primary, fontWeight: 600 }}>
        SouraMAIL
      </span>
      <h1 style={{ fontFamily: font.display, fontSize: 56, lineHeight: 1.1, margin: 0 }}>
        Professional email infrastructure.
        <br />
        <span style={{ color: color.muted }}>Without the infrastructure headache.</span>
      </h1>
      <p style={{ fontSize: 18, color: color.muted, maxWidth: 640 }}>
        Connect your domain, get MX / SPF / DKIM / DMARC generated and verified for you, then run
        mailboxes, rules and an AI copilot on top. The marketing site lands in Phase 3.
      </p>
      <div style={{ display: 'flex', gap: space.sm, marginTop: space.sm }}>
        <Link href="/sign-up">
          <Button>Create an account</Button>
        </Link>
        <Link href="/sign-in">
          <Button variant="secondary">Sign in</Button>
        </Link>
      </div>
    </main>
  );
}
