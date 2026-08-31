'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/icon';

type State = 'input' | 'checking' | 'ready';

/** Marketing demo of the onboarding flow — from design/mockups/landing-page-v2.html. */
export function DomainWidget() {
  const [state, setState] = useState<State>('input');
  const [domain, setDomain] = useState('');
  const shown = domain.trim() || 'yourdomain.com';

  function start() {
    setState('checking');
    setTimeout(() => setState('ready'), 2600);
  }

  return (
    <div
      id="domain-widget"
      className="relative flex min-h-[280px] flex-col items-center justify-center gap-xl overflow-hidden rounded-full border border-surface-container-highest bg-surface-container-lowest p-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-[#00A48A]/10"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#00A48A]/[0.02] to-transparent" />

      {state === 'input' && (
        <div className="relative z-10 flex w-full max-w-lg flex-col items-center gap-lg">
          <h3 className="font-headline-md text-[20px] font-semibold">Connect your domain</h3>
          <div className="flex w-full rounded-xl border border-surface-container-highest bg-surface p-sm shadow-sm transition-all focus-within:border-[#00A48A]/50 focus-within:ring-2 focus-within:ring-[#00A48A]/20">
            <input
              autoComplete="off"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && start()}
              className="w-full bg-transparent px-md py-sm font-mono text-[15px] text-on-surface outline-none placeholder:text-outline-variant/70"
              placeholder="e.g., yourdomain.com"
              type="text"
            />
            <button
              type="button"
              onClick={start}
              className="whitespace-nowrap rounded-lg bg-on-surface px-xl py-sm font-label-md text-[14px] text-surface shadow-sm transition-all hover:bg-on-surface/90"
            >
              Continue
            </button>
          </div>
          <p className="mt-xs flex items-center gap-xs text-[13px] text-on-surface-variant">
            <Icon name="verified_user" className="text-[14px] text-[#00A48A]" /> Instant
            verification. No credit card required.
          </p>
        </div>
      )}

      {state === 'checking' && (
        <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-xl">
          <div className="flex w-full flex-col items-center gap-md text-center">
            <span className="font-label-md text-[12px] font-semibold uppercase tracking-widest text-on-surface-variant">
              Configuring infrastructure
            </span>
            <div className="mt-md flex w-full flex-col gap-sm">
              <Row done label="Resolving DNS" />
              <Row done label="Generating SPF & DKIM" />
              <div className="relative flex items-center justify-between overflow-hidden rounded-lg border border-[#00A48A]/30 bg-surface px-md py-sm shadow-sm ring-1 ring-[#00A48A]/10">
                <div className="absolute inset-0 animate-pulse bg-[#00A48A]/5" />
                <span className="relative z-10 flex items-center gap-sm font-mono text-[14px] text-on-surface">
                  <Icon
                    name="progress_activity"
                    className="animate-spin text-[16px] text-[#00A48A]"
                  />
                  Propagating records
                </span>
                <span className="relative z-10 animate-pulse font-mono text-[12px] text-[#00A48A]">
                  Waiting…
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {state === 'ready' && (
        <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-lg">
          <div className="mb-xs flex h-16 w-16 items-center justify-center rounded-full border border-[#00A48A]/20 bg-[#00A48A]/10 text-[#00A48A] shadow-sm">
            <Icon name="mark_email_read" className="text-[32px]" />
          </div>
          <h3 className="text-center font-headline-md text-[24px] font-semibold">
            Infrastructure ready
          </h3>
          <div className="w-full rounded-xl border border-surface-container-highest bg-surface-container-low px-xl py-md text-center shadow-inner">
            <span className="font-mono text-[16px] font-medium text-[#00A48A]">hello@{shown}</span>
          </div>
          <Link
            href="/sign-up"
            className="mt-sm flex w-full items-center justify-center gap-sm rounded-lg bg-[#00A48A] px-xl py-md font-label-md text-[14px] text-white shadow-sm transition-all hover:shadow-md"
          >
            Open developer dashboard <Icon name="arrow_forward" className="text-[16px]" />
          </Link>
        </div>
      )}
    </div>
  );
}

function Row({ label, done }: { label: string; done?: boolean }) {
  return (
    <div className="flex w-full items-center justify-between rounded-lg border border-surface-container-highest bg-surface-container-low px-md py-sm">
      <span className="flex items-center gap-sm font-mono text-[14px] text-on-surface">
        <Icon name="check_circle" className="text-[16px] text-[#00A48A]" /> {label}
      </span>
      <span className="font-mono text-[12px] text-on-surface-variant">{done ? 'Done' : ''}</span>
    </div>
  );
}
