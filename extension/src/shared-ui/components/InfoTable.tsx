import React from 'react';
import { colors, fonts, radius, spacing } from '../tokens';
import { SectionCopyButtons } from './SectionCopyButtons';

export interface InfoRow {
  label: string;
  value: React.ReactNode;
}

export interface InfoTableProps {
  title?: string;
  rows: InfoRow[];
  /**
   * Optional copy-buttons payload. When set, the title row shows "brief" and
   * "JSON" pill buttons that copy the section's data in the chosen format.
   */
  copy?: {
    brief: string;
    /** Optional HTML sibling — see SectionCopyButtonsProps.html. */
    html?: string;
    json: unknown;
    label?: string;
  };
}

/**
 * Labeled key/value table inside a dark card.
 * Used for static fields that don't deserve a spectrum bar — subject details,
 * focal point/symmetry, visual style metadata, etc.
 */
export function InfoTable({ title, rows, copy }: InfoTableProps) {
  return (
    <div
      style={{
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.card,
        padding: spacing.cardPadding,
        marginBottom: 12,
      }}
    >
      {title && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
            gap: 8,
          }}
        >
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 9,
              color: colors.textFaint,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 600,
            }}
          >
            {title}
          </div>
          {copy && (
            <SectionCopyButtons
              brief={copy.brief}
              html={copy.html}
              json={copy.json}
              label={copy.label ?? title.toLowerCase()}
            />
          )}
        </div>
      )}

      {rows.map((row, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            padding: `${spacing.rowPaddingY}px 0`,
            borderTop: i === 0 ? 'none' : `1px solid ${colors.borderSubtle}`,
            fontSize: 11,
            lineHeight: 1.5,
          }}
        >
          <span
            style={{
              fontFamily: fonts.mono,
              fontSize: 10,
              color: colors.textMuted,
              flexShrink: 0,
              whiteSpace: 'nowrap',
              textTransform: 'lowercase',
            }}
          >
            {row.label}
          </span>
          <span
            style={{
              fontFamily: fonts.sans,
              color: colors.textPrimary,
              textAlign: 'right',
              wordBreak: 'break-word',
            }}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}
