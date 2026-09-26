/**
 * Prompt for extracting GraphicElementsProfile from an image.
 * Returns structured JSON matching the shared type definitions.
 */
export const GRAPHIC_ELEMENTS_PROMPT = `You are a creative intelligence analyst specializing in graphic design elements and UI patterns. Analyze the provided image and extract a detailed graphic elements profile.

Return ONLY valid JSON — no markdown fences, no commentary, no explanation.

The JSON must match this exact schema:

{
  "graphicElements": {
    "iconStyle": "<one of: 'outlined' | 'filled' | 'duotone' | 'hand-drawn' | '3d' | 'emoji' | 'flat' | null — null if no icons are present>",
    "iconWeight": "<one of: 'thin' | 'regular' | 'bold' | null — null if no icons are present>",
    "cornerLanguage": "<one of: 'sharp' | 'rounded' | 'mixed' | null — null if no UI elements or containers are visible>",
    "patternPresent": "<boolean — true if repeating patterns, textures, or geometric motifs are visible>",
    "patternDescription": "<string | null — describe the pattern if present, e.g. 'diagonal stripes', 'polka dots', 'geometric grid'. Null if patternPresent is false>",
    "decorativeDevices": ["<string — e.g. 'badges', 'rules', 'underlines', 'speech bubbles', 'borders', 'dividers', 'ribbons', 'arrows', 'stars', 'circles'. Empty array if none>"],
    "functionalVsDecorative": "<one of: 'mostly-functional' | 'mostly-decorative' | 'balanced' | null — null if no graphic elements are present to evaluate>"
  },
  "confidence": {
    "graphicElements": "<one of: 'high' | 'medium' | 'low'>"
  }
}

Rules:
- iconStyle must be exactly one of the 7 allowed values, or null if no icons are detected.
- iconWeight must be null when iconStyle is null.
- cornerLanguage describes the overall shape language of UI elements (buttons, cards, containers): sharp = squared corners, rounded = border-radius, mixed = combination.
- patternDescription must be null when patternPresent is false.
- decorativeDevices can be an empty array if no decorative graphic elements are present.
- functionalVsDecorative: mostly-functional = icons/elements serve UI purpose, mostly-decorative = purely aesthetic, balanced = mix of both. Null if no elements to evaluate.
- For images that are pure photography with no graphic overlays, set iconStyle, iconWeight, cornerLanguage to null, patternPresent to false, decorativeDevices to empty array, and functionalVsDecorative to null.
- Return ONLY the JSON object, nothing else.`;
