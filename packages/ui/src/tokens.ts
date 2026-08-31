/**
 * Design tokens — single source of truth for the app UI.
 * Derived from docs/04-design-system.md (produit palette wins over the Stitch export).
 */
export const color = {
  primary: '#00A48A',
  primaryHover: '#008F78',
  background: '#F0F2F5',
  surface: '#FFFFFF',
  foreground: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  error: '#EF4444',
  warning: '#F59E0B',
} as const;

export const font = {
  sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
  display: 'Geist, Inter, ui-sans-serif, system-ui, sans-serif',
  mono: '"Geist Mono", ui-monospace, SFMono-Regular, monospace',
} as const;

/** 8px grid (docs/04 §4). */
export const space = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
} as const;

export const radius = { sm: 4, md: 8, pill: 9999 } as const;

export const shadow = {
  sm: '0 1px 2px rgba(0,0,0,0.04)',
  level2: '0 4px 12px rgba(0,0,0,0.05)',
} as const;

export const layout = { sidebarWidth: 240, landingMaxWidth: 1280 } as const;

export const tokens = { color, font, space, radius, shadow, layout } as const;
