import { useState } from 'react';
import { colors, fonts } from '../tokens';
import { copyText } from '../utils/clipboard';

export interface ImageHeroProps {
  imageUrl: string | null;
  sourceUrl: string | undefined;
  analyzing?: boolean;
  /** 0–1 progress, e.g. completedStages/totalStages. */
  progress?: number;
  /** Status label shown when analyzing, e.g. "Analyzing colors…" */
  statusLabel?: string;
}

const HEIGHT = 170;

export function ImageHero({
  imageUrl,
  sourceUrl,
  analyzing = false,
  progress = 0,
  statusLabel,
}: ImageHeroProps) {
  const [imgError, setImgError] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const sourceDomain = (() => {
    if (!sourceUrl) return null;
    try {
      return new URL(sourceUrl).hostname.replace(/^www\./, '');
    } catch {
      return null;
    }
  })();

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: HEIGHT,
        background: colors.card,
        overflow: 'hidden',
      }}
    >
      {imageUrl && !imgError ? (
        <img
          src={imageUrl}
          alt="Pinned"
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.textFaint,
            fontFamily: fonts.mono,
            fontSize: 11,
          }}
        >
          {imgError ? 'Image unavailable' : 'No image'}
        </div>
      )}

      {/* Bottom gradient + chrome */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 60,
          background:
            'linear-gradient(to top, rgba(13,13,14,0.92) 0%, rgba(13,13,14,0) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Source domain + copy image button */}
      {imageUrl && (
        <div
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            bottom: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: fonts.mono,
            fontSize: 10,
            color: colors.textBody,
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
            {sourceDomain ?? ''}
          </span>
          <button
            onClick={() =>
              copyText(imageUrl, setCopyFeedback, '✓ image url')
            }
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: `1px solid ${colors.border}`,
              color: colors.textPrimary,
              fontFamily: fonts.mono,
              fontSize: 10,
              padding: '4px 8px',
              borderRadius: 4,
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
            }}
          >
            {copyFeedback ?? 'copy image'}
          </button>
        </div>
      )}

      {/* Analyzing overlay */}
      {analyzing && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(13,13,14,0.65)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 11,
              color: colors.textPrimary,
              letterSpacing: '0.05em',
            }}
          >
            {statusLabel ?? 'Analyzing image…'}
          </div>
          <div
            style={{
              width: 200,
              height: 2,
              background: colors.border,
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.max(4, Math.min(100, progress * 100))}%`,
                height: '100%',
                background: colors.accent,
                transition: 'width 320ms ease-out',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
