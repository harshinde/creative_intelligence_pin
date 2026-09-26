import type { PartialCreativeProfile } from '@shared/types';

/**
 * Build a prompt for generating a design summary from accumulated analysis data.
 * This is a text-only prompt (no image) that synthesizes all analysis blocks.
 * Identical to backend/src/gemini/prompts/designSummary.ts.
 */
export function buildDesignSummaryPrompt(profile: PartialCreativeProfile): string {
  const sections: string[] = [];

  if (profile.subject) {
    sections.push(
      `Subject: ${profile.subject.primarySubject} in ${profile.subject.setting}. Narrative quality: ${profile.subject.narrativeQuality}.`,
    );
  }
  if (profile.mood) {
    sections.push(
      `Mood: ${profile.mood.primary} (${profile.mood.secondary?.join(', ') || 'none'}). Energy: ${profile.mood.energyLevel}, Formality: ${profile.mood.formality}. ${profile.mood.aspirational ? 'Aspirational' : 'Accessible'}.`,
    );
  }
  if (profile.color) {
    const colors = profile.color.palette.map((s) => `${s.hex} (${s.role})`).join(', ');
    sections.push(
      `Color: ${profile.color.harmony} harmony, ${profile.color.temperature} temperature, ${profile.color.saturationProfile} saturation. Palette: ${colors}.`,
    );
  }
  if (profile.composition) {
    sections.push(
      `Composition: ${profile.composition.layoutArchetype} layout, ${profile.composition.symmetry}, focal point: ${profile.composition.focalPoint}. Negative space: ${profile.composition.negativeSpaceRatio}.`,
    );
  }
  if (profile.visualStyle) {
    sections.push(
      `Visual Style: ${profile.visualStyle.medium}. Aesthetic: ${profile.visualStyle.aestheticMovements.join(', ')}. Era: ${profile.visualStyle.designEra}.`,
    );
  }
  if (profile.typography) {
    const fonts = profile.typography.fontsDetected
      .map(
        (f) =>
          `${f.classification}${f.likelyName ? ` (${f.likelyName})` : ''} for ${f.role}`,
      )
      .join('; ');
    sections.push(
      `Typography: ${fonts}. Tone: ${profile.typography.typographicTone}. Spacing: ${profile.typography.spacingFeel}.`,
    );
  } else if (profile.typography === null) {
    sections.push('Typography: No text detected.');
  }
  if (profile.graphicElements) {
    const ge = profile.graphicElements;
    const parts: string[] = [];
    if (ge.iconStyle) parts.push(`Icons: ${ge.iconStyle}`);
    if (ge.cornerLanguage) parts.push(`Corners: ${ge.cornerLanguage}`);
    if (ge.patternPresent) parts.push(`Pattern: ${ge.patternDescription || 'present'}`);
    if (ge.decorativeDevices.length > 0)
      parts.push(`Decorative: ${ge.decorativeDevices.join(', ')}`);
    if (parts.length > 0) sections.push(`Graphic Elements: ${parts.join('. ')}.`);
  }

  const analysisData = sections.join('\n');

  return `You are a senior creative director writing a concise design brief. Based on the following analysis of an image, write a 2-4 sentence design summary that captures the essence of the creative direction.

The summary should:
- Read like a professional creative brief, not a list of attributes
- Highlight the most distinctive design choices
- Connect the visual elements to the emotional/brand impact
- Be useful for a designer trying to replicate or reference this style

Analysis data:
${analysisData}

Return ONLY valid JSON — no markdown fences, no commentary:
{ "designSummary": "<your 2-4 sentence summary>" }`;
}
