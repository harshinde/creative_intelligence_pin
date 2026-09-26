// Formatters used by the footer "Copy brief" / "Copy JSON" actions
// AND the per-section copy buttons inside each tab.

import type {
  PartialCreativeProfile,
  SubjectProfile,
  MoodProfile,
  ColorProfile,
  CompositionProfile,
  VisualStyleProfile,
  TypographyProfile,
  GraphicElementsProfile,
} from '@shared/types';

// ─────────────────────────────────────────
// PER-SECTION BRIEF FORMATTERS (key: value text)
// Each takes the section data and returns a string suitable for "Copy brief".
// ─────────────────────────────────────────

export function formatSubjectAsBrief(s: SubjectProfile): string {
  const lines = ['Subject', '-------'];
  lines.push(`Primary: ${s.primarySubject}`);
  lines.push(`Setting: ${s.setting}`);
  if (s.brandPresence) lines.push(`Brand: ${s.brandName ?? 'Detected'}`);
  if (s.culturalSignals.length > 0) {
    lines.push(`Cultural Signals: ${s.culturalSignals.join(', ')}`);
  }
  lines.push(`Narrative Quality: ${s.narrativeQuality}`);
  return lines.join('\n');
}

export function formatMoodAsBrief(m: MoodProfile): string {
  const lines = ['Mood', '----'];
  lines.push(`Primary: ${m.primary}`);
  if (m.secondary.length > 0) lines.push(`Secondary: ${m.secondary.join(', ')}`);
  lines.push(`Energy: ${m.energyLevel}`);
  lines.push(`Formality: ${m.formality}`);
  if (m.sensoryAssociations.length > 0) {
    lines.push(`Sensory: ${m.sensoryAssociations.join(', ')}`);
  }
  lines.push(`Aspirational: ${m.aspirational ? 'yes' : 'no'}`);
  return lines.join('\n');
}

export function formatColorAsBrief(c: ColorProfile): string {
  const lines = ['Color', '-----'];
  lines.push('Palette:');
  for (const swatch of c.palette) {
    const name = swatch.name ? ` — ${swatch.name}` : '';
    lines.push(`  ${swatch.hex} (${swatch.role})${name}`);
  }
  lines.push(`Harmony: ${c.harmony}`);
  lines.push(`Temperature: ${c.temperature}`);
  lines.push(`Saturation: ${c.saturationProfile}`);
  lines.push(`Tonal Range: ${c.tonalRange}`);
  lines.push(`Contrast: ${c.contrastLevel}`);
  if (c.emotionMapping.length > 0) {
    lines.push(`Emotion: ${c.emotionMapping.join(', ')}`);
  }
  if (c.accessibilityNotes) lines.push(`WCAG: ${c.accessibilityNotes}`);
  return lines.join('\n');
}

export function formatCompositionAsBrief(comp: CompositionProfile): string {
  const lines = ['Composition', '-----------'];
  lines.push(`Layout: ${comp.layoutArchetype}`);
  lines.push(`Focal Point: ${comp.focalPoint}`);
  lines.push(`Symmetry: ${comp.symmetry}`);
  lines.push(`Negative Space: ${comp.negativeSpaceRatio}`);
  lines.push(`Depth Layers: ${comp.hasDepthLayers ? 'yes' : 'no'}`);
  lines.push(
    `Text-to-Image Ratio: ${Math.round(comp.textToImageRatio * 100)}%`,
  );
  if (comp.detectedRegions.length > 0) {
    lines.push('Detected Regions:');
    for (const r of comp.detectedRegions) {
      lines.push(`  ${r.label.replace(/_/g, ' ')} (${r.visualWeight})`);
    }
  }
  return lines.join('\n');
}

export function formatVisualStyleAsBrief(vs: VisualStyleProfile): string {
  const lines = ['Visual Style', '------------'];
  lines.push(`Medium: ${vs.medium.replace(/_/g, ' ')}`);
  const styleDetail =
    vs.illustrationStyle || vs.photographyStyle || vs.renderingStyle;
  if (styleDetail) lines.push(`Style: ${styleDetail}`);
  lines.push(`Era: ${vs.designEra}`);
  if (vs.aestheticMovements.length > 0) {
    lines.push(`Aesthetic Movements: ${vs.aestheticMovements.join(', ')}`);
  }
  if (vs.texturePresence.length > 0) {
    lines.push(`Textures: ${vs.texturePresence.join(', ')}`);
  }
  return lines.join('\n');
}

export function formatTypographyAsBrief(t: TypographyProfile | null): string {
  if (t === null) return 'Typography\n----------\nNo text detected';
  const lines = ['Typography', '----------'];
  for (const font of t.fontsDetected) {
    const name = font.likelyName ? ` (${font.likelyName})` : '';
    lines.push(
      `  ${font.classification}${name} — ${font.role}, ${font.weightDescription}`,
    );
  }
  lines.push(`Tone: ${t.typographicTone}`);
  lines.push(`Hierarchy: ${t.hierarchyLevels} level${t.hierarchyLevels > 1 ? 's' : ''}`);
  lines.push(`Capitalization: ${t.capitalizationStyle}`);
  lines.push(`Spacing: ${t.spacingFeel}`);
  lines.push(`Text-Image Relationship: ${t.textImageRelationship}`);
  if (t.treatments.length > 0) lines.push(`Treatments: ${t.treatments.join(', ')}`);
  return lines.join('\n');
}

export function formatGraphicElementsAsBrief(ge: GraphicElementsProfile): string {
  const lines = ['Graphic Elements', '----------------'];
  if (ge.iconStyle) {
    lines.push(`Icons: ${ge.iconStyle}${ge.iconWeight ? ` (${ge.iconWeight})` : ''}`);
  }
  if (ge.cornerLanguage) lines.push(`Corners: ${ge.cornerLanguage}`);
  if (ge.patternPresent) lines.push(`Pattern: ${ge.patternDescription ?? 'Present'}`);
  if (ge.decorativeDevices.length > 0) {
    lines.push(`Decorative: ${ge.decorativeDevices.join(', ')}`);
  }
  if (ge.functionalVsDecorative) {
    lines.push(`Balance: ${ge.functionalVsDecorative}`);
  }
  if (lines.length === 2) lines.push('(none detected)');
  return lines.join('\n');
}

/** Trivial JSON-stringify; centralized so all sections behave the same. */
export function formatSectionAsJSON(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

// ─────────────────────────────────────────
// HTML SIBLINGS (for the dual-format clipboard write)
//
// Every function below mirrors the field order/content of its plain-text
// counterpart above — keep them in sync when either changes. AI-generated
// free-text fields (setting, primarySubject, focalPoint, font names, etc.)
// are NOT constrained to a controlled vocabulary, so every interpolated
// value is escaped before being placed in markup — unlike the JSX-rendered
// UI, this is a manually constructed HTML *string* for the clipboard, so
// React's automatic escaping doesn't apply here.
// ─────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Validates a hex color before it's interpolated into a style attribute. */
const SAFE_HEX = /^#[0-9a-fA-F]{6}$/;

function htmlHeading(text: string): string {
  return `<p><strong>${escapeHtml(text)}</strong></p>`;
}

function htmlRow(label: string, value: string): string {
  return `<p>${escapeHtml(label)}: ${escapeHtml(value)}</p>`;
}

function htmlList(items: string[]): string {
  if (items.length === 0) return '';
  return `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
}

function htmlSwatchRow(hex: string, role: string, name: string | null): string {
  const safeHex = SAFE_HEX.test(hex) ? hex : '#888888';
  const label = name ? `${hex} (${role}) — ${name}` : `${hex} (${role})`;
  return (
    `<p>` +
    `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;` +
    `background:${safeHex};margin-right:6px;vertical-align:middle;"></span>` +
    `${escapeHtml(label)}</p>`
  );
}

export function formatSubjectAsHtmlBrief(s: SubjectProfile): string {
  const parts = [htmlHeading('Subject')];
  parts.push(htmlRow('Primary', s.primarySubject));
  parts.push(htmlRow('Setting', s.setting));
  if (s.brandPresence) parts.push(htmlRow('Brand', s.brandName ?? 'Detected'));
  if (s.culturalSignals.length > 0) {
    parts.push(htmlRow('Cultural Signals', s.culturalSignals.join(', ')));
  }
  parts.push(htmlRow('Narrative Quality', s.narrativeQuality));
  return parts.join('');
}

export function formatMoodAsHtmlBrief(m: MoodProfile): string {
  const parts = [htmlHeading('Mood')];
  parts.push(htmlRow('Primary', m.primary));
  if (m.secondary.length > 0) parts.push(htmlRow('Secondary', m.secondary.join(', ')));
  parts.push(htmlRow('Energy', m.energyLevel));
  parts.push(htmlRow('Formality', m.formality));
  if (m.sensoryAssociations.length > 0) {
    parts.push(htmlRow('Sensory', m.sensoryAssociations.join(', ')));
  }
  parts.push(htmlRow('Aspirational', m.aspirational ? 'yes' : 'no'));
  return parts.join('');
}

export function formatColorAsHtmlBrief(c: ColorProfile): string {
  const parts = [htmlHeading('Color'), '<p>Palette:</p>'];
  parts.push(
    c.palette
      .map((swatch) => htmlSwatchRow(swatch.hex, swatch.role, swatch.name))
      .join(''),
  );
  parts.push(htmlRow('Harmony', c.harmony));
  parts.push(htmlRow('Temperature', c.temperature));
  parts.push(htmlRow('Saturation', c.saturationProfile));
  parts.push(htmlRow('Tonal Range', c.tonalRange));
  parts.push(htmlRow('Contrast', c.contrastLevel));
  if (c.emotionMapping.length > 0) {
    parts.push(htmlRow('Emotion', c.emotionMapping.join(', ')));
  }
  if (c.accessibilityNotes) parts.push(htmlRow('WCAG', c.accessibilityNotes));
  return parts.join('');
}

export function formatCompositionAsHtmlBrief(comp: CompositionProfile): string {
  const parts = [htmlHeading('Composition')];
  parts.push(htmlRow('Layout', comp.layoutArchetype));
  parts.push(htmlRow('Focal Point', comp.focalPoint));
  parts.push(htmlRow('Symmetry', comp.symmetry));
  parts.push(htmlRow('Negative Space', comp.negativeSpaceRatio));
  parts.push(htmlRow('Depth Layers', comp.hasDepthLayers ? 'yes' : 'no'));
  parts.push(htmlRow('Text-to-Image Ratio', `${Math.round(comp.textToImageRatio * 100)}%`));
  if (comp.detectedRegions.length > 0) {
    parts.push('<p>Detected Regions:</p>');
    parts.push(
      htmlList(comp.detectedRegions.map((r) => `${r.label.replace(/_/g, ' ')} (${r.visualWeight})`)),
    );
  }
  return parts.join('');
}

export function formatVisualStyleAsHtmlBrief(vs: VisualStyleProfile): string {
  const parts = [htmlHeading('Visual Style')];
  parts.push(htmlRow('Medium', vs.medium.replace(/_/g, ' ')));
  const styleDetail = vs.illustrationStyle || vs.photographyStyle || vs.renderingStyle;
  if (styleDetail) parts.push(htmlRow('Style', styleDetail));
  parts.push(htmlRow('Era', vs.designEra));
  if (vs.aestheticMovements.length > 0) {
    parts.push(htmlRow('Aesthetic Movements', vs.aestheticMovements.join(', ')));
  }
  if (vs.texturePresence.length > 0) {
    parts.push(htmlRow('Textures', vs.texturePresence.join(', ')));
  }
  return parts.join('');
}

export function formatTypographyAsHtmlBrief(t: TypographyProfile | null): string {
  if (t === null) return htmlHeading('Typography') + '<p>No text detected</p>';
  const parts = [htmlHeading('Typography')];
  parts.push(
    htmlList(
      t.fontsDetected.map((font) => {
        const name = font.likelyName ? ` (${font.likelyName})` : '';
        return `${font.classification}${name} — ${font.role}, ${font.weightDescription}`;
      }),
    ),
  );
  parts.push(htmlRow('Tone', t.typographicTone));
  parts.push(htmlRow('Hierarchy', `${t.hierarchyLevels} level${t.hierarchyLevels > 1 ? 's' : ''}`));
  parts.push(htmlRow('Capitalization', t.capitalizationStyle));
  parts.push(htmlRow('Spacing', t.spacingFeel));
  parts.push(htmlRow('Text-Image Relationship', t.textImageRelationship));
  if (t.treatments.length > 0) parts.push(htmlRow('Treatments', t.treatments.join(', ')));
  return parts.join('');
}

export function formatGraphicElementsAsHtmlBrief(ge: GraphicElementsProfile): string {
  const parts = [htmlHeading('Graphic Elements')];
  const rows: string[] = [];
  if (ge.iconStyle) {
    rows.push(htmlRow('Icons', `${ge.iconStyle}${ge.iconWeight ? ` (${ge.iconWeight})` : ''}`));
  }
  if (ge.cornerLanguage) rows.push(htmlRow('Corners', ge.cornerLanguage));
  if (ge.patternPresent) rows.push(htmlRow('Pattern', ge.patternDescription ?? 'Present'));
  if (ge.decorativeDevices.length > 0) {
    rows.push(htmlRow('Decorative', ge.decorativeDevices.join(', ')));
  }
  if (ge.functionalVsDecorative) rows.push(htmlRow('Balance', ge.functionalVsDecorative));
  if (rows.length === 0) rows.push('<p>(none detected)</p>');
  parts.push(...rows);
  return parts.join('');
}

export function formatProfileAsText(profile: PartialCreativeProfile): string {
  const lines: string[] = [];
  lines.push('Creative Intelligence Brief');
  lines.push('============================');

  if (profile.designSummary) {
    lines.push('');
    lines.push(profile.designSummary);
  }

  if (profile.subject) {
    const s = profile.subject;
    lines.push('');
    lines.push(`Subject: ${s.primarySubject} — ${s.setting}`);
    if (s.brandPresence) lines.push(`Brand: ${s.brandName ?? 'Detected'}`);
    if (s.culturalSignals.length > 0) {
      lines.push(`Cultural Signals: ${s.culturalSignals.join(', ')}`);
    }
    lines.push(`Narrative: ${s.narrativeQuality}`);
  }

  if (profile.mood) {
    const m = profile.mood;
    lines.push('');
    lines.push(`Mood: ${m.primary}`);
    if (m.secondary.length > 0) lines.push(`Secondary: ${m.secondary.join(', ')}`);
    lines.push(`Energy: ${m.energyLevel} | Formality: ${m.formality}`);
    if (m.sensoryAssociations.length > 0) {
      lines.push(`Sensory: ${m.sensoryAssociations.join(', ')}`);
    }
    lines.push(m.aspirational ? 'Aspirational' : 'Accessible');
  }

  if (profile.color) {
    const c = profile.color;
    lines.push('');
    lines.push('Color Palette:');
    for (const swatch of c.palette) {
      const name = swatch.name ? ` — ${swatch.name}` : '';
      lines.push(`  ${swatch.hex} (${swatch.role})${name}`);
    }
    lines.push(`Harmony: ${c.harmony} | Temperature: ${c.temperature}`);
    lines.push(`Saturation: ${c.saturationProfile} | Contrast: ${c.contrastLevel}`);
    if (c.emotionMapping.length > 0) lines.push(`Emotion: ${c.emotionMapping.join(', ')}`);
    if (c.accessibilityNotes) lines.push(`WCAG: ${c.accessibilityNotes}`);
  }

  if (profile.composition) {
    const comp = profile.composition;
    lines.push('');
    lines.push('Composition:');
    lines.push(`Layout: ${comp.layoutArchetype}`);
    lines.push(`Focal Point: ${comp.focalPoint}`);
    lines.push(
      `Symmetry: ${comp.symmetry} | Negative Space: ${comp.negativeSpaceRatio}`,
    );
    lines.push(`Depth Layers: ${comp.hasDepthLayers ? 'Yes' : 'No'}`);
    lines.push(
      `Text-to-Image Ratio: ${Math.round(comp.textToImageRatio * 100)}%`,
    );
  }

  if (profile.visualStyle) {
    const vs = profile.visualStyle;
    lines.push('');
    lines.push('Visual Style:');
    lines.push(`Medium: ${vs.medium.replace('_', ' ')}`);
    const styleDetail =
      vs.illustrationStyle || vs.photographyStyle || vs.renderingStyle;
    if (styleDetail) lines.push(`Style: ${styleDetail}`);
    if (vs.aestheticMovements.length > 0) {
      lines.push(`Aesthetic: ${vs.aestheticMovements.join(', ')}`);
    }
    lines.push(`Era: ${vs.designEra}`);
  }

  if (profile.typography !== undefined) {
    lines.push('');
    if (profile.typography === null) {
      lines.push('Typography: No text detected');
    } else {
      const t = profile.typography;
      lines.push('Typography:');
      for (const font of t.fontsDetected) {
        const name = font.likelyName ? ` (${font.likelyName})` : '';
        lines.push(
          `  ${font.classification}${name} — ${font.role}, ${font.weightDescription}`,
        );
      }
      lines.push(`Tone: ${t.typographicTone} | Hierarchy: ${t.hierarchyLevels} levels`);
    }
  }

  if (profile.graphicElements) {
    const ge = profile.graphicElements;
    lines.push('');
    lines.push('Graphic Elements:');
    if (ge.iconStyle) {
      lines.push(`Icons: ${ge.iconStyle}${ge.iconWeight ? ` (${ge.iconWeight})` : ''}`);
    }
    if (ge.cornerLanguage) lines.push(`Corners: ${ge.cornerLanguage}`);
    if (ge.patternPresent) lines.push(`Pattern: ${ge.patternDescription ?? 'Present'}`);
    if (ge.decorativeDevices.length > 0) {
      lines.push(`Decorative: ${ge.decorativeDevices.join(', ')}`);
    }
  }

  if (profile.confidence?.overall) {
    lines.push('');
    lines.push(`Confidence: ${profile.confidence.overall}`);
  }

  if (profile.sourceUrl) {
    lines.push('');
    lines.push(`Source: ${profile.sourceUrl}`);
  }

  return lines.join('\n');
}

/** Mirrors formatProfileAsText() field-for-field — keep them in sync. */
export function formatProfileAsHtml(profile: PartialCreativeProfile): string {
  const parts: string[] = [];
  parts.push(htmlHeading('Creative Intelligence Brief'));

  if (profile.designSummary) {
    parts.push(`<p>${escapeHtml(profile.designSummary)}</p>`);
  }

  if (profile.subject) {
    const s = profile.subject;
    parts.push(htmlRow('Subject', `${s.primarySubject} — ${s.setting}`));
    if (s.brandPresence) parts.push(htmlRow('Brand', s.brandName ?? 'Detected'));
    if (s.culturalSignals.length > 0) {
      parts.push(htmlRow('Cultural Signals', s.culturalSignals.join(', ')));
    }
    parts.push(htmlRow('Narrative', s.narrativeQuality));
  }

  if (profile.mood) {
    const m = profile.mood;
    parts.push(htmlRow('Mood', m.primary));
    if (m.secondary.length > 0) parts.push(htmlRow('Secondary', m.secondary.join(', ')));
    parts.push(htmlRow('Energy', m.energyLevel), htmlRow('Formality', m.formality));
    if (m.sensoryAssociations.length > 0) {
      parts.push(htmlRow('Sensory', m.sensoryAssociations.join(', ')));
    }
    parts.push(`<p>${m.aspirational ? 'Aspirational' : 'Accessible'}</p>`);
  }

  if (profile.color) {
    const c = profile.color;
    parts.push('<p>Color Palette:</p>');
    parts.push(
      c.palette.map((swatch) => htmlSwatchRow(swatch.hex, swatch.role, swatch.name)).join(''),
    );
    parts.push(htmlRow('Harmony', c.harmony), htmlRow('Temperature', c.temperature));
    parts.push(htmlRow('Saturation', c.saturationProfile), htmlRow('Contrast', c.contrastLevel));
    if (c.emotionMapping.length > 0) parts.push(htmlRow('Emotion', c.emotionMapping.join(', ')));
    if (c.accessibilityNotes) parts.push(htmlRow('WCAG', c.accessibilityNotes));
  }

  if (profile.composition) {
    const comp = profile.composition;
    parts.push(htmlHeading('Composition'));
    parts.push(htmlRow('Layout', comp.layoutArchetype));
    parts.push(htmlRow('Focal Point', comp.focalPoint));
    parts.push(htmlRow('Symmetry', comp.symmetry), htmlRow('Negative Space', comp.negativeSpaceRatio));
    parts.push(htmlRow('Depth Layers', comp.hasDepthLayers ? 'Yes' : 'No'));
    parts.push(htmlRow('Text-to-Image Ratio', `${Math.round(comp.textToImageRatio * 100)}%`));
  }

  if (profile.visualStyle) {
    const vs = profile.visualStyle;
    parts.push(htmlHeading('Visual Style'));
    parts.push(htmlRow('Medium', vs.medium.replace('_', ' ')));
    const styleDetail = vs.illustrationStyle || vs.photographyStyle || vs.renderingStyle;
    if (styleDetail) parts.push(htmlRow('Style', styleDetail));
    if (vs.aestheticMovements.length > 0) {
      parts.push(htmlRow('Aesthetic', vs.aestheticMovements.join(', ')));
    }
    parts.push(htmlRow('Era', vs.designEra));
  }

  if (profile.typography !== undefined) {
    if (profile.typography === null) {
      parts.push('<p>Typography: No text detected</p>');
    } else {
      const t = profile.typography;
      parts.push('<p>Typography:</p>');
      parts.push(
        htmlList(
          t.fontsDetected.map((font) => {
            const name = font.likelyName ? ` (${font.likelyName})` : '';
            return `${font.classification}${name} — ${font.role}, ${font.weightDescription}`;
          }),
        ),
      );
      parts.push(htmlRow('Tone', t.typographicTone), htmlRow('Hierarchy', `${t.hierarchyLevels} levels`));
    }
  }

  if (profile.graphicElements) {
    const ge = profile.graphicElements;
    parts.push(htmlHeading('Graphic Elements'));
    if (ge.iconStyle) {
      parts.push(htmlRow('Icons', `${ge.iconStyle}${ge.iconWeight ? ` (${ge.iconWeight})` : ''}`));
    }
    if (ge.cornerLanguage) parts.push(htmlRow('Corners', ge.cornerLanguage));
    if (ge.patternPresent) parts.push(htmlRow('Pattern', ge.patternDescription ?? 'Present'));
    if (ge.decorativeDevices.length > 0) {
      parts.push(htmlRow('Decorative', ge.decorativeDevices.join(', ')));
    }
  }

  if (profile.confidence?.overall) {
    parts.push(htmlRow('Confidence', profile.confidence.overall));
  }

  if (profile.sourceUrl) {
    parts.push(htmlRow('Source', profile.sourceUrl));
  }

  return parts.join('');
}

/**
 * A short, scannable one-liner meant to sit directly under an image on a
 * moodboard — descriptors joined by "·", then the palette hex codes.
 * e.g. "SERENE · WARM · MINIMALIST · rule-of-thirds — #FF5733 #2C3E50 #A0B0C0"
 * Falls back gracefully when sections are missing.
 */
export function formatProfileAsCaption(profile: PartialCreativeProfile): string {
  const descriptors: string[] = [];

  // "Loud" single-word descriptors get uppercased for scannability.
  if (profile.mood?.primary) descriptors.push(profile.mood.primary.toUpperCase());
  if (profile.color?.temperature) descriptors.push(profile.color.temperature.toUpperCase());

  const aesthetic = profile.visualStyle?.aestheticMovements?.[0];
  if (aesthetic) descriptors.push(aesthetic.toUpperCase());
  else if (profile.visualStyle?.medium) {
    descriptors.push(profile.visualStyle.medium.replace(/_/g, ' ').toUpperCase());
  }

  // Layout reads as a lowercase phrase (e.g. "rule-of-thirds"), left as-is.
  if (profile.composition?.layoutArchetype) {
    descriptors.push(profile.composition.layoutArchetype);
  }

  const head = descriptors.join(' · ');
  const hexes = (profile.color?.palette ?? [])
    .slice(0, 5)
    .map((s) => s.hex)
    .join(' ');

  if (head && hexes) return `${head} — ${hexes}`;
  return head || hexes || 'No analysis available';
}

export function formatProfileAsJSON(profile: PartialCreativeProfile): string {
  // Strip transient/UI-only fields. Truncate inline data URIs so JSON stays usable.
  // The `failedStages` field is part of the type but excluded from the export.
  const {
    id: _id,
    analysisStatus: _status,
    failedStages: _failed,
    sourceThumbnailUrl,
    ...rest
  } = profile;

  const clean: Record<string, unknown> = { ...rest };
  if (sourceThumbnailUrl) {
    clean.sourceThumbnailUrl = sourceThumbnailUrl.startsWith('data:')
      ? sourceThumbnailUrl.substring(0, 40) + '…[truncated]'
      : sourceThumbnailUrl;
  }

  return JSON.stringify(clean, null, 2);
}
