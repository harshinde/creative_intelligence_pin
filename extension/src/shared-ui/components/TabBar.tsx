import { colors, fonts } from '../tokens';

export type TabKey = 'mood' | 'palette' | 'structure';

export interface TabBarProps {
  active: TabKey;
  onChange: (key: TabKey) => void;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'mood', label: 'Mood' },
  { key: 'palette', label: 'Palette' },
  { key: 'structure', label: 'Structure' },
];

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        borderTop: `1px solid ${colors.border}`,
        borderBottom: `1px solid ${colors.border}`,
        background: colors.surface,
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            style={{
              flex: 1,
              padding: '11px 0',
              background: 'transparent',
              border: 'none',
              borderBottom: isActive
                ? `1px solid ${colors.accent}`
                : '1px solid transparent',
              marginBottom: -1,
              fontFamily: fonts.mono,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: isActive ? colors.accent : colors.textMuted,
              cursor: 'pointer',
              transition: 'color 120ms ease, border-color 120ms ease',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
