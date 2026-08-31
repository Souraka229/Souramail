/**
 * SouraMAIL mark — an envelope built from a routing/infrastructure glyph, in the
 * brand teal. Standalone SVG so it needs no external asset.
 */
export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SouraMAIL"
    >
      <rect x="2" y="6" width="28" height="20" rx="5" fill="#00a48a" />
      <path
        d="M6 11.5 14.4 18a2.6 2.6 0 0 0 3.2 0L26 11.5"
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="11.5" r="2.2" fill="#003128" />
      <circle cx="26" cy="11.5" r="2.2" fill="#003128" />
      <circle cx="16" cy="24" r="2.2" fill="#003128" />
    </svg>
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-sm ${className}`}>
      <Logo className="h-8 w-8" />
      <span className="font-headline-md text-[20px] font-bold tracking-tight text-on-surface">
        SouraMAIL
      </span>
    </span>
  );
}
