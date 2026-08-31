/**
 * Minimal design-system primitives for Phase 0/1 screens, styled from the
 * `@souramail/ui` tokens. These are intentionally small; they graduate into
 * `packages/ui` (with proper variants + Storybook) in the Phase 0 design-system
 * workstream.
 */
import { color, font, radius, shadow, space } from '@souramail/ui';
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

export function Button({ variant = 'primary', block, style, ...rest }: ButtonProps) {
  const base = {
    fontFamily: font.sans,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1,
    padding: `${space.sm}px ${space.md}px`,
    borderRadius: radius.md,
    cursor: rest.disabled ? 'not-allowed' : 'pointer',
    opacity: rest.disabled ? 0.6 : 1,
    width: block ? '100%' : undefined,
    transition: 'background 120ms ease, border-color 120ms ease',
  } as const;
  const skin =
    variant === 'primary'
      ? { background: color.primary, color: '#fff', border: `1px solid ${color.primary}` }
      : variant === 'secondary'
        ? {
            background: color.surface,
            color: color.foreground,
            border: `1px solid ${color.border}`,
          }
        : { background: 'transparent', color: color.primary, border: '1px solid transparent' };
  return <button {...rest} style={{ ...base, ...skin, ...style }} />;
}

export function Input({ style, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      style={{
        fontFamily: font.sans,
        fontSize: 14,
        padding: `${space.sm}px ${space.md}px`,
        borderRadius: radius.md,
        border: `1px solid ${color.border}`,
        background: color.surface,
        color: color.foreground,
        width: '100%',
        outline: 'none',
        ...style,
      }}
    />
  );
}

export function Select({ style, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      style={{
        fontFamily: font.sans,
        fontSize: 14,
        padding: `${space.sm}px ${space.md}px`,
        borderRadius: radius.md,
        border: `1px solid ${color.border}`,
        background: color.surface,
        color: color.foreground,
        width: '100%',
        ...style,
      }}
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
    <label style={{ display: 'flex', flexDirection: 'column', gap: space.xs }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: color.foreground }}>{label}</span>
      {children}
      {hint ? <span style={{ fontSize: 12, color: color.muted }}>{hint}</span> : null}
    </label>
  );
}

export function Card({
  children,
  style,
  padding = space.lg,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
  padding?: number;
}) {
  return (
    <div
      style={{
        background: color.surface,
        border: `1px solid ${color.border}`,
        borderRadius: radius.md,
        boxShadow: shadow.sm,
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Callout({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warning' | 'error' | 'success';
  children: ReactNode;
}) {
  const bg = {
    info: '#EFF6FF',
    warning: '#FFFBEB',
    error: '#FEF2F2',
    success: '#ECFDF5',
  }[tone];
  const fg = {
    info: '#1D4ED8',
    warning: '#B45309',
    error: color.error,
    success: '#047857',
  }[tone];
  return (
    <div
      style={{
        background: bg,
        color: fg,
        border: `1px solid ${fg}22`,
        borderRadius: radius.md,
        padding: `${space.sm}px ${space.md}px`,
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'green' | 'amber' | 'red';
}) {
  const map = {
    neutral: { bg: '#F3F4F6', fg: color.muted },
    green: { bg: '#ECFDF5', fg: '#047857' },
    amber: { bg: '#FFFBEB', fg: '#B45309' },
    red: { bg: '#FEF2F2', fg: color.error },
  }[tone];
  return (
    <span
      style={{
        display: 'inline-block',
        background: map.bg,
        color: map.fg,
        borderRadius: radius.pill,
        padding: '2px 10px',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}
