import { colors, fonts, radius } from '../tokens';

export interface AnalysisBlock {
  key: string;
  label: string;
}

export interface SettingsPanelProps {
  blocks: AnalysisBlock[];
  enabled: string[];
  onToggle: (key: string) => void;
  onClose: () => void;
}

export function SettingsPanel({
  blocks,
  enabled,
  onToggle,
  onClose,
}: SettingsPanelProps) {
  return (
    <div
      onClick={onClose}
      style={{
        // Fixed (not absolute) so the overlay always covers the visible
        // viewport regardless of scroll position — the side panel's outer
        // container has no height clamp, so `absolute` would size against
        // the full scrollable document and could render the dialog above
        // the user's current scroll position.
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(2px)',
        zIndex: 10,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 60,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 280,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.card,
          padding: 16,
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h3
            style={{
              fontFamily: fonts.mono,
              fontSize: 10,
              color: colors.textPrimary,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 600,
              margin: 0,
            }}
          >
            Analysis Blocks
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: colors.textMuted,
              cursor: 'pointer',
              fontSize: 14,
              padding: 0,
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {blocks.map((block) => {
          const checked = enabled.includes(block.key);
          return (
            <label
              key={block.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 0',
                fontSize: 12,
                color: colors.textPrimary,
                cursor: 'pointer',
                fontFamily: fonts.sans,
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(block.key)}
                style={{ accentColor: colors.accent, cursor: 'pointer' }}
              />
              {block.label}
            </label>
          );
        })}

        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 9,
            color: colors.textFaint,
            marginTop: 8,
            paddingTop: 10,
            borderTop: `1px solid ${colors.borderSubtle}`,
          }}
        >
          Changes apply on next pin.
        </div>
      </div>
    </div>
  );
}
