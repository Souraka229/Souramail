import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-md bg-surface px-xl text-center">
      <span className="font-mono font-semibold text-primary">404</span>
      <h1 className="m-0 font-headline-md text-[32px] font-semibold">Page introuvable</h1>
      <p className="max-w-[420px] text-on-surface-variant">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link href="/" className="font-semibold text-primary hover:underline">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
