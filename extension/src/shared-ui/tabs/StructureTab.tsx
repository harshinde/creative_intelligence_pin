import type {
  CompositionProfile,
  VisualStyleProfile,
  TypographyProfile,
  GraphicElementsProfile,
} from '@shared/types';
import { colors, fonts } from '../tokens';
import { SpectrumBar } from '../components/SpectrumBar';
import { Tag } from '../components/Tag';
import { InfoTable, type InfoRow } from '../components/InfoTable';
import { SectionCopyButtons } from '../components/SectionCopyButtons';
import {
  negativeSpaceToSpectrum,
  textRatioToSpectrum,
  depthToSpectrum,
} from '../utils/mappings';
import {
  formatCompositionAsBrief,
  formatCompositionAsHtmlBrief,
  formatVisualStyleAsBrief,
  formatVisualStyleAsHtmlBrief,
  formatTypographyAsBrief,
  formatTypographyAsHtmlBrief,
  formatGraphicElementsAsBrief,
  formatGraphicElementsAsHtmlBrief,
} from '../utils/format';

export interface StructureTabProps {
  composition: CompositionProfile | undefined;
  visualStyle: VisualStyleProfile | undefined;
  typography: TypographyProfile | null | undefined;
  graphicElements: GraphicElementsProfile | undefined;
}

export function StructureTab({
  composition,
  visualStyle,
  typography,
  graphicElements,
}: StructureTabProps) {
  if (!composition && !visualStyle && !typography && !graphicElements) {
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
        Waiting for structure analysis…
      </div>
    );
  }

  return (
    <div>
      {/* Headline + Composition copy buttons */}
      {composition && (
        <div style={{ marginBottom: 18, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 600,
                fontFamily: fonts.sans,
                color: colors.textPrimary,
                margin: '0 0 4px',
                textTransform: 'capitalize',
                letterSpacing: '-0.01em',
              }}
            >
              {composition.layoutArchetype}
            </h2>
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: 9,
                color: colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Composition archetype
            </div>
          </div>
          <div style={{ marginTop: 6 }}>
            <SectionCopyButtons
              brief={formatCompositionAsBrief(composition)}
              html={formatCompositionAsHtmlBrief(composition)}
              json={{ composition }}
              label="composition"
            />
          </div>
        </div>
      )}

      {/* Spectrum bars */}
      {composition && (
        <>
          {(() => {
            const v = negativeSpaceToSpectrum(composition.negativeSpaceRatio);
            return (
              <SpectrumBar
                lo="Dense"
                hi="Open"
                value={v.value}
                label="Negative space"
                description={v.description}
              />
            );
          })()}

          {(() => {
            const v = textRatioToSpectrum(composition.textToImageRatio);
            return (
              <SpectrumBar
                lo="Image only"
                hi="Text heavy"
                value={v.value}
                label="Text-to-image ratio"
                description={v.description}
              />
            );
          })()}

          {(() => {
            const v = depthToSpectrum(composition.hasDepthLayers);
            return (
              <SpectrumBar
                lo="Flat"
                hi="Layered"
                value={v.value}
                label="Depth"
                description={v.description}
              />
            );
          })()}
        </>
      )}

      {/* Focal point / symmetry */}
      {composition && (
        <InfoTable
          rows={[
            { label: 'focal point', value: composition.focalPoint },
            { label: 'symmetry', value: cap(composition.symmetry) },
          ]}
        />
      )}

      {/* Visual style */}
      {visualStyle && <VisualStyleTable visualStyle={visualStyle} />}

      {/* Aesthetic movements */}
      {visualStyle && visualStyle.aestheticMovements.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <SectionLabel label="Aesthetic movements" />
          <div>
            {visualStyle.aestheticMovements.map((m, i) => (
              <Tag key={i} accent={i === 0}>
                {m}
              </Tag>
            ))}
          </div>
        </div>
      )}

      {/* Texture presence */}
      {visualStyle && visualStyle.texturePresence.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <SectionLabel label="Textures" />
          <div>
            {visualStyle.texturePresence.map((t, i) => (
              <Tag key={i}>{t}</Tag>
            ))}
          </div>
        </div>
      )}

      {/* Typography */}
      {typography !== undefined && (
        <TypographySection typography={typography} />
      )}

      {/* Graphic Elements */}
      {graphicElements && <GraphicElementsSection ge={graphicElements} />}
    </div>
  );
}

function VisualStyleTable({ visualStyle }: { visualStyle: VisualStyleProfile }) {
  const rows: InfoRow[] = [];
  rows.push({ label: 'medium', value: cap(visualStyle.medium.replace(/_/g, ' ')) });

  const styleDetail =
    visualStyle.illustrationStyle ||
    visualStyle.photographyStyle ||
    visualStyle.renderingStyle;
  if (styleDetail) rows.push({ label: 'style', value: styleDetail });
  rows.push({ label: 'era', value: visualStyle.designEra });
  return (
    <InfoTable
      title="Visual style"
      rows={rows}
      copy={{
        brief: formatVisualStyleAsBrief(visualStyle),
        html: formatVisualStyleAsHtmlBrief(visualStyle),
        json: { visualStyle },
        label: 'visual style',
      }}
    />
  );
}

function TypographySection({ typography }: { typography: TypographyProfile | null }) {
  if (typography === null) {
    return (
      <div
        style={{
          marginBottom: 14,
          padding: 12,
          background: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: 7,
          fontFamily: fonts.mono,
          fontSize: 10,
          color: colors.textMuted,
          textAlign: 'center',
        }}
      >
        No text detected
      </div>
    );
  }

  const rows: InfoRow[] = [];
  if (typography.fontsDetected.length > 0) {
    rows.push({
      label: 'fonts',
      value: (
        <span style={{ fontFamily: fonts.sans }}>
          {typography.fontsDetected.map((f, i) => {
            const name = f.likelyName || cap(f.classification);
            return (
              <div key={i} style={{ fontSize: 11, lineHeight: 1.4 }}>
                <span style={{ color: colors.textPrimary }}>{name}</span>
                <span style={{ color: colors.textMuted, fontFamily: fonts.mono, fontSize: 10, marginLeft: 6 }}>
                  {f.role} · {f.weightDescription}
                </span>
              </div>
            );
          })}
        </span>
      ),
    });
  }
  rows.push({ label: 'tone', value: typography.typographicTone });
  rows.push({
    label: 'hierarchy',
    value: `${typography.hierarchyLevels} level${typography.hierarchyLevels > 1 ? 's' : ''}`,
  });
  rows.push({ label: 'spacing', value: typography.spacingFeel });
  if (typography.treatments.length > 0) {
    rows.push({
      label: 'treatments',
      value: (
        <span>
          {typography.treatments.map((t, i) => (
            <Tag key={i}>{t}</Tag>
          ))}
        </span>
      ),
    });
  }

  return (
    <InfoTable
      title="Typography"
      rows={rows}
      copy={{
        brief: formatTypographyAsBrief(typography),
        html: formatTypographyAsHtmlBrief(typography),
        json: { typography },
        label: 'typography',
      }}
    />
  );
}

function GraphicElementsSection({ ge }: { ge: GraphicElementsProfile }) {
  const rows: InfoRow[] = [];
  if (ge.iconStyle) {
    rows.push({
      label: 'icons',
      value: `${ge.iconStyle}${ge.iconWeight ? ` (${ge.iconWeight})` : ''}`,
    });
  }
  if (ge.cornerLanguage) rows.push({ label: 'corners', value: ge.cornerLanguage });
  if (ge.patternPresent) {
    rows.push({ label: 'pattern', value: ge.patternDescription ?? 'Present' });
  }
  if (ge.decorativeDevices.length > 0) {
    rows.push({
      label: 'decorative',
      value: (
        <span>
          {ge.decorativeDevices.map((d, i) => (
            <Tag key={i}>{d}</Tag>
          ))}
        </span>
      ),
    });
  }
  if (ge.functionalVsDecorative) {
    rows.push({ label: 'balance', value: ge.functionalVsDecorative });
  }

  if (rows.length === 0) return null;

  return (
    <InfoTable
      title="Graphic elements"
      rows={rows}
      copy={{
        brief: formatGraphicElementsAsBrief(ge),
        html: formatGraphicElementsAsHtmlBrief(ge),
        json: { graphicElements: ge },
        label: 'graphic elements',
      }}
    />
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

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
