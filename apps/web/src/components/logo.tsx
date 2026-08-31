/**
 * SouraMAIL mark — a monoline "S" ribbon threaded through a double elongated
 * hexagon, in the brand teal. Matches design/screenshots/logo-system.png.
 * Standalone SVG, no external asset.
 */
export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SouraMAIL"
    >
      <g stroke="#00a48a" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round">
        {/* outer elongated hexagon */}
        <path d="M18 12 H44 L56 24 V40 L44 52 H18 L8 40 V24 L18 12 Z" />
        {/* inner elongated hexagon */}
        <path d="M23 22 H39 L46 29 V35 L39 42 H23 L16 35 V29 L23 22 Z" />
        {/* continuous S ribbon */}
        <path d="M40 22 H28 Q20 22 20 28 Q20 33 27 33 H35 Q44 33 44 40 Q44 46 36 46 H24" />
      </g>
    </svg>
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-sm ${className}`}>
      <Logo className="h-8 w-8" />
      <span className="font-headline-md text-[20px] font-bold tracking-tight">
        <span className="text-primary-container">Soura</span>
        <span className="text-primary">MAIL</span>
      </span>
    </span>
  );
}
