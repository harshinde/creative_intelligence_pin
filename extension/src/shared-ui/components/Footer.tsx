import { colors, fonts, radius } from '../tokens';
import { confidenceToDots } from '../utils/mappings';

export interface FooterProps {
  /** 0–100, derived from confidence.overall. */
  confidenceScore: number;
  onCopyBrief: () => void;
  onCopyJSON: () => void;
  /** Transient feedback shown next to the button after copy. */
  feedback?: string | null;
  /** Hide buttons until analysis is fully complete. */
  ready: boolean;
}

export function Footer({
  confidenceScore,
  onCopyBrief,
  onCopyJSON,
  feedback,
  ready,
}: FooterProps) {
  const filled = confidenceToDots(confidenceScore);

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
