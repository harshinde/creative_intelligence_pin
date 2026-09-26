import type {
  ConfidenceScores,
  ConfidenceLevel,
  ConfidenceNotes,
  ConfidenceSection,
} from '@shared/types';
import { colors, fonts, radius } from '../tokens';
import { confidenceToDots, confidenceLevelColor } from '../utils/mappings';

export interface FooterProps {
  /** 0–100, derived from confidence.overall. */
  confidenceScore: number;
  /** Full per-section confidence, for the breakdown row. */
  confidence?: ConfidenceScores;
  /** Why a section was medium/low confidence, keyed by section. */
  confidenceNotes?: ConfidenceNotes;
  onCopyBrief: () => void;
  onCopyCaption: () => void;
  onCopyJSON: () => void;
  /** Transient feedback shown next to the button after copy. */
  feedback?: string | null;
  /** Hide buttons until analysis is fully complete. */
  ready: boolean;
}

// Section key → short label for the per-section confidence breakdown.
const SECTION_LABELS: Array<[ConfidenceSection, string]> = [
  ['subject', 'subj'],
  ['mood', 'mood'],
  ['color', 'color'],
  ['composition', 'comp'],
  ['visualStyle', 'style'],
  ['typography', 'type'],
  ['graphicElements', 'gfx'],
];

export function Footer({
  confidenceScore,
  confidence,
  confidenceNotes,
  onCopyBrief,
  onCopyCaption,
  onCopyJSON,
  feedback,
  ready,
}: FooterProps) {
  const filled = confidenceToDots(confidenceScore);
  const notes = SECTION_LABELS.filter(([key]) => confidenceNotes?.[key]);

  return (
    <div
      style={{
        background: colors.surface,
        borderTop: `1px solid ${colors.border}`,
        padding: '12px 14px 14px',
      }}
    >
      {/* Confidence row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: i < filled ? colors.success : colors.border,
                }}
              />
            ))}
          </div>
          <span
            style={{
              fontFamily: fonts.mono,
              fontSize: 9,
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Confidence
          </span>
        </div>
        <span
          style={{
            fontFamily: fonts.mono,
            fontSize: 10,
            color: confidenceScore > 0 ? colors.success : colors.textMuted,
          }}
        >
          {confidenceScore > 0 ? `${confidenceScore}%` : '—'}
        </span>
      </div>

      {/* Per-section confidence breakdown — surfaces which sections the
          model was less sure about, not just the overall score. */}
      {confidence && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 10,
          }}
        >
          {SECTION_LABELS.map(([key, label]) => {
            const level = confidence[key] as ConfidenceLevel | null | undefined;
            const dotColor = colors[confidenceLevelColor(level)];
            const note = confidenceNotes?.[key];
            return (
              <div
                key={key}
                title={
                  `${label}: ${level ?? 'not analyzed'} confidence` +
                  (note ? ` — ${note}` : '')
                }
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: dotColor,
                  }}
                />
                <span
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 9,
                    color: colors.textMuted,
                    letterSpacing: '0.03em',
                  }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Why-low-confidence notes — only rendered for sections that returned
          a reason (medium/low), so this stays empty on clean analyses. */}
      {notes.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {notes.map(([key, label]) => (
            <div
              key={key}
              style={{
                display: 'flex',
                gap: 6,
                fontFamily: fonts.mono,
                fontSize: 9,
                lineHeight: 1.5,
                color: colors.textMuted,
              }}
            >
              <span style={{ color: colors.textFaint, flexShrink: 0 }}>
                {label}
              </span>
              <span>{confidenceNotes?.[key]}</span>
            </div>
          ))}
        </div>
      )}

      {/* Buttons */}
      {ready && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={onCopyBrief}
            style={{
              flex: 1,
              padding: '9px 0',
              background: colors.accent,
              color: '#1a1208',
              border: 'none',
              borderRadius: radius.button,
              fontFamily: fonts.mono,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.05em',
              cursor: 'pointer',
            }}
          >
            COPY BRIEF
          </button>
          <button
            onClick={onCopyCaption}
            title="Copy a short one-line caption for moodboards"
            style={{
              flex: 1,
              padding: '9px 0',
              background: 'transparent',
              color: colors.textPrimary,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.button,
              fontFamily: fonts.mono,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.05em',
              cursor: 'pointer',
            }}
          >
            CAPTION
          </button>
          <button
            onClick={onCopyJSON}
            style={{
              flex: 1,
              padding: '9px 0',
              background: 'transparent',
              color: colors.textPrimary,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.button,
              fontFamily: fonts.mono,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.05em',
              cursor: 'pointer',
            }}
          >
            COPY JSON
          </button>
          {feedback && (
            <span
              style={{
                fontFamily: fonts.mono,
                fontSize: 10,
                color: colors.success,
                whiteSpace: 'nowrap',
              }}
            >
              {feedback}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
