'use client';

import { color, font, radius, space } from '@souramail/ui';
import { useState } from 'react';

export function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ display: 'flex', gap: space.xs, alignItems: 'stretch' }}>
      <code
        style={{
          flex: 1,
          fontFamily: font.mono,
          fontSize: 12,
          background: color.background,
          border: `1px solid ${color.border}`,
          borderRadius: radius.sm,
          padding: `${space.xs}px ${space.sm}px`,
          wordBreak: 'break-all',
        }}
      >
        {value}
      </code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* clipboard blocked — the value is selectable above */
          }
        }}
        style={{
          fontFamily: font.sans,
          fontSize: 12,
          fontWeight: 600,
          color: color.primary,
          background: color.surface,
          border: `1px solid ${color.border}`,
          borderRadius: radius.sm,
          padding: `0 ${space.sm}px`,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
