import { useEffect, useRef, useState } from 'react';
import type { LayoutRegion } from '@shared/types';
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
  /** Composition regions to optionally overlay on the image. */
  regions?: LayoutRegion[];
}

const HEIGHT = 170;

// Border color per region importance.
const WEIGHT_COLOR: Record<LayoutRegion['visualWeight'], string> = {
  primary: colors.accent,
  secondary: 'rgba(210,158,80,0.6)',
  tertiary: 'rgba(255,255,255,0.4)',
};

/**
 * Given a container and the image's natural size, compute the rectangle the
 * image actually occupies under `object-fit: contain` (i.e. accounting for
 * letterbox bars). Regions are normalized to the full image, so boxes must be
 * positioned against this rect, not the raw container.
 */
function containRect(
  cw: number,
  ch: number,
  nw: number,
  nh: number,
): { x: number; y: number; w: number; h: number } {
  if (nw <= 0 || nh <= 0) return { x: 0, y: 0, w: cw, h: ch };
  const imageAspect = nw / nh;
  const containerAspect = cw / ch;
  if (imageAspect > containerAspect) {
    const w = cw;
    const h = cw / imageAspect;
    return { x: 0, y: (ch - h) / 2, w, h };
  }
  const h = ch;
  const w = ch * imageAspect;
  return { x: (cw - w) / 2, y: 0, w, h };
}

export function ImageHero({
  imageUrl,
  sourceUrl,
  analyzing = false,
  progress = 0,
  statusLabel,
  regions,
}: ImageHeroProps) {
  const [imgError, setImgError] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [showRegions, setShowRegions] = useState(false);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({
    w: 0,
    h: HEIGHT,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const hasRegions = !!regions && regions.length > 0;
  // Only overlay once we know both the container and the image's natural size;
  // without natural dims we can't map normalized coords accurately.
  const overlayActive = showRegions && hasRegions && !!natural;

  // Measure the container so box math tracks the resizable side panel width.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () =>
      setContainerSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reset natural size + toggle when the image changes.
  useEffect(() => {
    setNatural(null);
    setShowRegions(false);
    setImgError(false);
  }, [imageUrl]);

  const rect =
    overlayActive && natural
      ? containRect(containerSize.w, containerSize.h, natural.w, natural.h)
      : null;

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
      ref={containerRef}
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
          onLoad={(e) =>
            setNatural({
              w: e.currentTarget.naturalWidth,
              h: e.currentTarget.naturalHeight,
            })
          }
          style={{
            width: '100%',
            height: '100%',
            // Switch to `contain` while overlaying regions so the whole image
            // is visible and boxes line up; `cover` otherwise for a full bleed.
            objectFit: overlayActive ? 'contain' : 'cover',
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

      {/* Composition region overlay */}
      {overlayActive && rect && regions && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {regions.map((r, i) => {
            const box = r.boundingBox;
            const left = rect.x + (box.xMin / 1000) * rect.w;
            const top = rect.y + (box.yMin / 1000) * rect.h;
            const width = ((box.xMax - box.xMin) / 1000) * rect.w;
            const height = ((box.yMax - box.yMin) / 1000) * rect.h;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left,
                  top,
                  width,
                  height,
                  border: `1.5px solid ${WEIGHT_COLOR[r.visualWeight]}`,
                  borderRadius: 2,
                  boxSizing: 'border-box',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    background: WEIGHT_COLOR[r.visualWeight],
                    color: '#1a1208',
                    fontFamily: fonts.mono,
                    fontSize: 8,
                    lineHeight: 1.2,
                    padding: '1px 3px',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {r.label.replace(/_/g, ' ')}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Regions toggle — only when composition regions exist */}
      {hasRegions && imageUrl && !imgError && !analyzing && (
        <button
          onClick={() => setShowRegions((v) => !v)}
          title="Toggle composition region overlay"
          style={{
            position: 'absolute',
            top: 10,
            right: 12,
            background: showRegions ? colors.accent : 'rgba(0,0,0,0.5)',
            border: `1px solid ${colors.border}`,
            color: showRegions ? '#1a1208' : colors.textPrimary,
            fontFamily: fonts.mono,
            fontSize: 10,
            padding: '4px 8px',
            borderRadius: 4,
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
          }}
        >
          {showRegions ? '✓ regions' : 'regions'}
        </button>
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
