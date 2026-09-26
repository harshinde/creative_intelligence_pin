import { useState } from 'react';
import type { CSSProperties } from 'react';
import { colors, fonts, radius } from '../tokens';
import {
  getImageFromDataTransfer,
  submitPastedImage,
} from '../utils/pasteImage';

export interface EmptyStateProps {
  /** Called once the pasted image has been handed off to the background. */
  onPasted?: () => void;
}

export function EmptyState({ onPasted }: EmptyStateProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(blob: Blob) {
    setStatus('submitting');
    setError(null);
    try {
      await submitPastedImage(blob);
      onPasted?.();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div style={{ padding: '24px 18px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: 30, marginBottom: 10 }} aria-hidden="true">
          📌
        </div>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            fontFamily: fonts.sans,
            color: colors.textPrimary,
            margin: '0 0 6px',
          }}
        >
          Analyze your first image
        </h2>
        <p
          style={{
            fontSize: 12,
            color: colors.textBody,
            lineHeight: 1.55,
            maxWidth: 260,
            margin: '0 auto',
          }}
        >
          Two ways to start — both work the same way.
        </p>
      </div>

      {/* Option A: Paste from clipboard / drag-and-drop */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isDragging) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = getImageFromDataTransfer(e.dataTransfer);
          if (file) submit(file);
        }}
        style={{
          background: isDragging ? colors.accentBg : colors.card,
          border: `1.5px dashed ${isDragging ? colors.accent : colors.border}`,
          borderRadius: radius.card,
          padding: '18px 14px',
          marginBottom: 14,
          textAlign: 'center',
          transition: 'background 120ms, border-color 120ms',
        }}
      >
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 9,
            color: colors.accent,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: 6,
            fontWeight: 600,
          }}
        >
          From your clipboard
        </div>
        <div
          style={{
            fontSize: 13,
            fontFamily: fonts.sans,
            color: colors.textPrimary,
            marginBottom: 4,
          }}
        >
          Press{' '}
          <kbd style={kbdStyle}>⌘V</kbd>
          {' '}or drop an image here
        </div>
        <div
          style={{
            fontSize: 10,
            fontFamily: fonts.mono,
            color: colors.textMuted,
            lineHeight: 1.45,
          }}
        >
          Works with screenshots, Firefly Boards,<br />
          Figma, Photoshop — anywhere you can copy.
        </div>

        {status === 'submitting' && (
          <div
            style={{
              marginTop: 10,
              fontFamily: fonts.mono,
              fontSize: 10,
              color: colors.accent,
            }}
          >
            Sending to analysis…
          </div>
        )}
        {status === 'error' && error && (
          <div
            style={{
              marginTop: 10,
              fontFamily: fonts.mono,
              fontSize: 10,
              color: colors.danger,
              lineHeight: 1.4,
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Option B: Pin from any webpage */}
      <div
        style={{
          background: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.card,
          padding: 14,
        }}
      >
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 9,
            color: colors.textFaint,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: 8,
            fontWeight: 600,
          }}
        >
          From any webpage
        </div>
        <Step n="1" text="Visit any design site" />
        <Step n="2" text="Hover over an image" />
        <Step n="3" text="Click the Analyze button" highlight />
      </div>
    </div>
  );
}

function Step({
  n,
  text,
  highlight = false,
}: {
  n: string;
  text: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '3px 0',
        fontSize: 11,
        color: highlight ? colors.accent : colors.textBody,
      }}
    >
      <span
        style={{
          fontFamily: fonts.mono,
          fontSize: 10,
          color: highlight ? colors.accent : colors.textMuted,
          width: 12,
          textAlign: 'center',
        }}
      >
        {n}
      </span>
      <span style={{ fontFamily: fonts.sans }}>{text}</span>
    </div>
  );
}

const kbdStyle: CSSProperties = {
  fontFamily: fonts.mono,
  fontSize: 11,
  padding: '1px 6px',
  border: `1px solid ${colors.border}`,
  borderRadius: 3,
  background: colors.cardHover,
  color: colors.textPrimary,
};
