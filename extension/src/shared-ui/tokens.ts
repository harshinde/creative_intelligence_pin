// Design tokens shared by the side panel (and any other extension surface).
// Mirrors the CSS custom properties in creative-intelligence-design-reference.md
// so React inline styles use the same source of truth.

export const colors = {
  bg: '#0d0d0e',
  surface: '#101012',
  card: '#171719',
  cardHover: '#1e1e22',
  border: '#252528',
  borderSubtle: '#1e1e22',
  accent: '#d29e50',
  accentBg: 'rgba(210,158,80,0.10)',
  accentBorder: 'rgba(210,158,80,0.30)',
  textPrimary: '#e0d8d0',
  textBody: '#b8b0a8',
  textSecondary: '#888',
  textMuted: '#5c5c5e',
  textFaint: '#38383a',
  success: '#5db880',
  successBg: 'rgba(93,184,128,0.15)',
  danger: '#d96a6a',
} as const;

export const fonts = {
  sans:
    '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif',
  mono:
    'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
} as const;

export const radius = {
  card: 7,
  tag: 100,
  button: 4,
  swatch: 4,
} as const;

export const spacing = {
  cardPadding: 12,
  rowPaddingY: 5,
  barGap: 11,
} as const;

// Responsive layout thresholds for the side panel (and any future surface
// that needs to adapt to a resizable width). Centralized here so a new
// component doesn't have to duplicate or import these from another
// component file.
export const layout = {
  /** Below this width, use compact padding/spacing (matches the old popup). */
  roomyBreakpoint: 480,
  /** Content column is capped here so it stays readable on very wide panels. */
  contentMaxWidth: 640,
  /** Max width for prose blocks (e.g. the design summary), in ch units. */
  proseMaxWidthCh: 60,
} as const;
