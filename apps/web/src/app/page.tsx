import { color, font, layout, space } from '@souramail/ui';

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
        Phase 0 scaffold. Marketing site lands in Phase 3 — see{' '}
        <code>design/mockups/landing-page-v2.html</code> and{' '}
        <code>docs/05-roadmap-developpement.md</code>.
      </p>
    </main>
  );
}
