import { colors, fonts, radius } from '../tokens';

export interface SetupStateProps {
  onOpenSettings: () => void;
}

export function SetupState({ onOpenSettings }: SetupStateProps) {
  return (
    <div style={{ padding: '22px 18px 18px' }}>
      {/* Warning banner */}
      <div
        style={{
          background: colors.accentBg,
          border: `1px solid ${colors.accentBorder}`,
          borderRadius: radius.card,
          padding: '12px 14px',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 10,
            color: colors.accent,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          ⚠ API key required
        </div>
        <p
          style={{
            fontSize: 12,
            color: colors.textBody,
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          A Gemini API key is needed to analyze pinned images. The key is stored
          locally in your browser only.
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={onOpenSettings}
          style={{
            flex: 1,
            padding: '10px 12px',
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
          OPEN SETTINGS
        </button>
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1,
            padding: '10px 12px',
            background: 'transparent',
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.button,
            fontFamily: fonts.mono,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.05em',
            textAlign: 'center',
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          GET API KEY ↗
        </a>
      </div>

      {/* Privacy */}
      <div
        style={{
          background: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.card,
          padding: '10px 12px',
        }}
      >
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 9,
            color: colors.textFaint,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 6,
            fontWeight: 600,
          }}
        >
          Privacy
        </div>
        <p style={{ fontSize: 11, color: colors.textBody, lineHeight: 1.5, margin: 0 }}>
          Pinned images are sent to Google Gemini for analysis. Your API key is
          stored locally only and never leaves your browser except to call Gemini.
        </p>
      </div>
    </div>
  );
}
