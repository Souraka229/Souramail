'use client';

import { useState } from 'react';
import { Icon } from '@/components/icon';

export function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-stretch gap-xs">
      <code className="flex-1 break-all rounded border border-outline-variant bg-surface-container-lowest px-sm py-xs font-mono text-[12px] text-on-surface">
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
            /* clipboard blocked — value is selectable above */
          }
        }}
        className="flex items-center gap-1 whitespace-nowrap rounded border border-outline-variant bg-surface-container-lowest px-sm font-label-sm text-[12px] font-semibold text-primary transition-colors hover:bg-surface-container"
      >
        <Icon name={copied ? 'check' : 'content_copy'} className="text-[14px]" />
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
