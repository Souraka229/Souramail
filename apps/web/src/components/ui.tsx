/**
 * Design-system primitives — "Kinetic Infrastructure" (design/tokens/kinetic-infrastructure.md).
 * 4px default radius, 1px outlines, tonal layering, no heavy shadows.
 */
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  block?: boolean;
};

export function Button({
  variant = 'primary',
  block = false,
  className = '',
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-sm font-label-md text-label-md rounded-lg px-lg py-sm transition-all duration-150 ease-out disabled:opacity-60 disabled:cursor-not-allowed';
  const skin =
    variant === 'primary'
      ? 'bg-[#00A48A] text-white hover:bg-[#008f78] shadow-sm'
      : variant === 'secondary'
        ? 'bg-surface-container-lowest text-on-surface border border-surface-container-highest hover:bg-surface-container-low'
        : 'bg-transparent text-primary hover:bg-primary/5';
  return <button className={`${base} ${skin} ${block ? 'w-full' : ''} ${className}`} {...rest} />;
}

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-surface-container-highest bg-surface-container-lowest px-md py-sm font-body-sm text-on-surface placeholder:text-outline-variant/70 outline-none transition-all focus:border-[#00A48A] focus:ring-2 focus:ring-[#00A48A]/10 ${className}`}
      {...rest}
    />
  );
}

export function Select({ className = '', ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-lg border border-surface-container-highest bg-surface-container-lowest px-md py-sm font-body-sm text-on-surface outline-none transition-all focus:border-[#00A48A] focus:ring-2 focus:ring-[#00A48A]/10 ${className}`}
      {...rest}
    />
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: `children` is always the form control this wraps
    <label className="flex flex-col gap-xs">
      <span className="font-label-md text-label-md text-on-surface">{label}</span>
      {children}
      {hint ? <span className="text-[12px] text-on-surface-variant">{hint}</span> : null}
    </label>
  );
}

export function Card({
  children,
  className = '',
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-surface-container-highest bg-surface-container-lowest p-lg ${
        interactive ? 'transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

const CALLOUT: Record<string, string> = {
  info: 'bg-secondary-container/40 text-on-secondary-container border-on-secondary-container/20',
  warning: 'bg-tertiary-container/15 text-on-tertiary-container border-tertiary-container/30',
  error: 'bg-error-container text-on-error-container border-error/20',
  success: 'bg-primary/10 text-on-primary-container border-primary/20',
};

export function Callout({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warning' | 'error' | 'success';
  children: ReactNode;
}) {
  return (
    <div className={`rounded-lg border px-md py-sm font-body-sm leading-relaxed ${CALLOUT[tone]}`}>
      {children}
    </div>
  );
}

const BADGE: Record<string, string> = {
  neutral: 'bg-surface-container-highest text-on-surface-variant',
  green: 'bg-primary/10 text-on-primary-container',
  amber: 'bg-tertiary-container/20 text-on-tertiary-container',
  red: 'bg-error-container text-on-error-container',
};

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'green' | 'amber' | 'red';
}) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2.5 py-0.5 font-label-sm text-[11px] font-semibold uppercase tracking-wider ${BADGE[tone]}`}
    >
      {children}
    </span>
  );
}
