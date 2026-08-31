'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Lightweight liveness: refresh on window focus and every `intervalMs`.
 * Real-time JMAP push (EventSource → the client already exposes
 * `getSession().eventSourceUrl`) lands once the JMAP proxy runs on a long-lived
 * container rather than a serverless function.
 */
export function Live({ intervalMs = 20000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') router.refresh();
    };
    const id = setInterval(tick, intervalMs);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', tick);
    };
  }, [router, intervalMs]);
  return null;
}
