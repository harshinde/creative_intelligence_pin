import { colors, fonts } from '../tokens';

export type StageStatus = 'done' | 'running' | 'queued' | 'failed';

export interface Stage {
  key: string;
  label: string;
  status: StageStatus;
}

export interface StageProgressProps {
  stages: Stage[];
  /** Approximate seconds remaining, optional. */
  etaSeconds?: number;
}

export function StageProgress({ stages, etaSeconds }: StageProgressProps) {
  const total = stages.length;
  const done = stages.filter((s) => s.status === 'done').length;

  return (
    <div style={{ padding: '18px 16px 16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 10,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 600,
          }}
        >
          Stages · {done} of {total}
        </div>
        {etaSeconds !== undefined && etaSeconds > 0 && (
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 10,
              color: colors.textMuted,
            }}
          >
            ~{etaSeconds}s remaining
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {stages.map((stage) => (
          <StageRow key={stage.key} stage={stage} />
        ))}
      </div>
    </div>
  );
}

function StageRow({ stage }: { stage: Stage }) {
  const isDone = stage.status === 'done';
  const isRunning = stage.status === 'running';
  const isFailed = stage.status === 'failed';

  const iconBg = isDone
    ? colors.successBg
    : isRunning
    ? colors.accentBg
    : isFailed
    ? 'rgba(217,106,106,0.15)'
    : 'transparent';

  const iconColor = isDone
    ? colors.success
    : isRunning
    ? colors.accent
    : isFailed
    ? colors.danger
    : colors.textFaint;

  const labelColor = isDone || isRunning
    ? colors.textPrimary
    : isFailed
    ? colors.danger
    : colors.textFaint;

  const statusLabel = isDone
    ? 'done'
    : isRunning
    ? 'running'
    : isFailed
    ? 'failed'
    : 'queued';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 8px',
        background: isRunning ? colors.card : 'transparent',
        borderRadius: 5,
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: iconBg,
          border: isRunning || isDone || isFailed ? 'none' : `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 9,
          color: iconColor,
          flexShrink: 0,
        }}
      >
        {isDone ? '✓' : isRunning ? <Spinner color={iconColor} /> : isFailed ? '×' : ''}
      </div>

      <span
        style={{
          flex: 1,
          fontFamily: fonts.sans,
          fontSize: 11,
          color: labelColor,
        }}
      >
        {stage.label}
      </span>

      <span
        style={{
          fontFamily: fonts.mono,
          fontSize: 9,
          color: iconColor,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {statusLabel}
      </span>
    </div>
  );
}

function Spinner({ color }: { color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        border: `1.5px solid ${color}`,
        borderRightColor: 'transparent',
        borderRadius: '50%',
        animation: 'ci-spin 0.9s linear infinite',
      }}
    />
  );
}
