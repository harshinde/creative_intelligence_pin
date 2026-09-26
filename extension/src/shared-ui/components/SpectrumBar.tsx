import { colors, fonts, spacing } from '../tokens';

export interface SpectrumBarProps {
  lo: string;       // left pole label
  hi: string;       // right pole label
  value: number;    // 0–100
  label: string;    // field name
  description: string; // e.g. "low-medium"
}

export function SpectrumBar({ lo, hi, value, label, description }: SpectrumBarProps) {
  const fill = Math.max(0, Math.min(100, value));

  return (
    <div style={{ marginBottom: spacing.barGap }}>
      {/* Pole labels */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: fonts.mono,
          fontSize: 9,
          color: colors.textMuted,
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        <span>{lo}</span>
        <span>{hi}</span>
      </div>

      {/* Track + fill */}
      <div
        style={{
          height: 3,
          background: colors.cardHover,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${fill}%`,
            height: '100%',
            background: colors.accent,
            transition: 'width 240ms ease-out',
          }}
        />
      </div>

      {/* Label + value row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          fontFamily: fonts.mono,
          fontSize: 9,
          marginTop: 4,
        }}
      >
        <span style={{ color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        <span style={{ color: colors.accent }}>
          {fill}% — {description}
        </span>
      </div>
    </div>
  );
}
