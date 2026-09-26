import React, { useState } from 'react';
import type { ColorProfile } from '@shared/types';
import { colors, fonts, radius } from '../tokens';
import { SpectrumBar } from '../components/SpectrumBar';
import { Tag } from '../components/Tag';
import { SectionCopyButtons } from '../components/SectionCopyButtons';
import {
  temperatureToSpectrum,
  saturationToSpectrum,
  contrastToSpectrum,
} from '../utils/mappings';
import { copyText } from '../utils/clipboard';
import { formatColorAsBrief, formatColorAsHtmlBrief } from '../utils/format';

export interface PaletteTabProps {
  color: ColorProfile | undefined;
}

export function PaletteTab({ color }: PaletteTabProps) {
  const [globalFeedback, setGlobalFeedback] = useState<string | null>(null);

  if (!color) {
    return (
      <div
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          fontFamily: fonts.mono,
          fontSize: 11,
          color: colors.textMuted,
        }}
      >
        Waiting for color analysis…
      </div>
    );
  }

  function handleCopyPalette() {
    const hexArray = color!.palette.map((s) => s.hex);
    copyText(JSON.stringify(hexArray), setGlobalFeedback, '✓ palette');
  }

  function handleCopyJSON() {
    copyText(JSON.stringify(color!.palette, null, 2), setGlobalFeedback, '✓ JSON');
  }

  const temp = temperatureToSpectrum(color.temperature);
  const sat = saturationToSpectrum(color.saturationProfile);
  const con = contrastToSpectrum(color.contrastLevel);

  return (
    <div>
      {/* Top: whole-color copy (palette + harmony + emotion + everything) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <SectionLabel label="Color" />
        <SectionCopyButtons
          brief={formatColorAsBrief(color)}
          html={formatColorAsHtmlBrief(color)}
          json={{ color }}
          label="color"
        />
      </div>

      {/* Palette-specific copy (hex array or full structured palette) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <SectionLabel label="Extracted palette" />
        <div style={{ display: 'flex', gap: 6 }}>
          <SmallButton onClick={handleCopyPalette}>
            {globalFeedback === '✓ palette' ? globalFeedback : 'copy palette'}
          </SmallButton>
          <SmallButton onClick={handleCopyJSON}>
            {globalFeedback === '✓ JSON' ? globalFeedback : 'JSON'}
          </SmallButton>
        </div>
      </div>

      {/* Swatch strip */}
      <SwatchStrip palette={color.palette} />

      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: 9,
          color: colors.textFaint,
          marginBottom: 18,
          marginTop: 8,
        }}
      >
        Tap a swatch to copy its hex code.
      </div>

      {/* Spectrum bars */}
      <SpectrumBar
        lo="Cool"
        hi="Warm"
        value={temp.value}
        label="Temperature"
        description={temp.description}
      />
      <SpectrumBar
        lo="Muted"
        hi="Vivid"
        value={sat.value}
        label="Saturation"
        description={sat.description}
      />
      <SpectrumBar
        lo="Flat"
        hi="High contrast"
        value={con.value}
        label="Contrast"
        description={con.description}
      />

      {/* Harmony + emotion mapping */}
      <div style={{ marginTop: 16 }}>
        <SectionLabel label="Harmony" />
        <div style={{ fontSize: 12, color: colors.textPrimary, fontFamily: fonts.sans, marginBottom: 14, textTransform: 'capitalize' }}>
          {color.harmony}
        </div>
      </div>

      {color.emotionMapping.length > 0 && (
        <div>
          <SectionLabel label="Emotion mapping" />
          <div>
            {color.emotionMapping.map((e, i) => (
              <Tag key={i} accent={i === 0}>
                {e}
              </Tag>
            ))}
          </div>
        </div>
      )}

      {color.accessibilityNotes && (
        <div
          style={{
            marginTop: 14,
            padding: '8px 10px',
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.card,
            fontSize: 10,
            color: colors.accent,
            fontFamily: fonts.mono,
            lineHeight: 1.5,
          }}
        >
          ⚠ WCAG: {color.accessibilityNotes}
        </div>
      )}
    </div>
  );
}

function SwatchStrip({ palette }: { palette: ColorProfile['palette'] }) {
  const [feedback, setFeedback] = useState<{ idx: number; text: string } | null>(null);

  function handleSwatchClick(hex: string, idx: number) {
    copyText(hex, (msg) => {
      if (msg) setFeedback({ idx, text: `✓ ${hex}` });
      else setFeedback(null);
    });
  }

  return (
    <div
      style={{
        display: 'flex',
        borderRadius: radius.swatch,
        overflow: 'hidden',
        border: `1px solid ${colors.border}`,
        height: 60,
      }}
    >
      {palette.map((swatch, i) => (
        <button
          key={i}
          onClick={() => handleSwatchClick(swatch.hex, i)}
          title={`${swatch.hex} — ${swatch.role}${swatch.name ? ` (${swatch.name})` : ''}`}
          style={{
            flex: 1,
            background: swatch.hex,
            border: 'none',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingBottom: 6,
            cursor: 'pointer',
            position: 'relative',
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontFamily: fonts.mono,
              fontSize: 8,
              color: textColorForBg(swatch.hex),
              letterSpacing: '0.02em',
              opacity: 0.85,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              padding: '0 4px',
            }}
          >
            {feedback?.idx === i ? feedback.text : swatch.hex.toUpperCase()}
          </span>
        </button>
      ))}
    </div>
  );
}

/** Choose black or white text for swatch label based on perceived brightness. */
function textColorForBg(hex: string): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return '#000';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // Perceived luminance — simple linear approximation
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum > 150 ? '#1a1a1a' : '#f0f0f0';
}

function SmallButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: `1px solid ${colors.border}`,
        color: colors.textBody,
        fontFamily: fonts.mono,
        fontSize: 9,
        padding: '4px 8px',
        borderRadius: 4,
        cursor: 'pointer',
        textTransform: 'lowercase',
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </button>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 9,
        color: colors.textFaint,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginBottom: 8,
        fontWeight: 600,
      }}
    >
      {label}
    </div>
  );
}
