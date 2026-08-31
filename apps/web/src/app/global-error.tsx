'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          fontFamily: 'Inter, system-ui, sans-serif',
          background: '#F0F2F5',
          color: '#111827',
        }}
      >
        <h1 style={{ fontSize: 28, margin: 0 }}>Une erreur est survenue</h1>
        <p style={{ color: '#6B7280' }}>{error.digest ? `Réf. ${error.digest}` : null}</p>
        <button
          type="button"
          onClick={reset}
          style={{
            border: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            background: '#00A48A',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
