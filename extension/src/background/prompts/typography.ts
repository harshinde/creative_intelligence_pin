/**
 * Prompt for extracting TypographyProfile from an image.
 * Returns structured JSON matching the shared type definitions.
 * Returns null for both typography and confidence when no text is detected.
 */
export const TYPOGRAPHY_PROMPT = `You are a creative intelligence analyst specializing in typography and type design. Analyze the provided image and extract a detailed typography profile.

Return ONLY valid JSON — no markdown fences, no commentary, no explanation.

IMPORTANT: If no text is visible in the image, return exactly:
{ "typography": null, "confidence": { "typography": null } }

If text IS visible, the JSON must match this exact schema:

{
  "typography": {
    "present": true,
    "fontsDetected": [
      {
        "classification": "<one of: 'serif' | 'sans-serif' | 'display' | 'slab' | 'script' | 'monospace' | 'variable' | 'handwritten'>",
        "likelyName": "<string | null — your best guess at the font name, e.g. 'Helvetica', 'Futura', 'Playfair Display'. Null if unsure>",
        "confirmedName": null,
        "role": "<string — e.g. 'headline', 'body', 'caption', 'logo', 'button', 'subheading'>",
        "weightDescription": "<string — e.g. 'bold', 'light', 'regular', 'black', 'medium', 'thin'>"
      }
    ],
    "hierarchyLevels": "<integer >= 1 — number of distinct type hierarchy levels visible>",
    "typographicTone": "<string — e.g. 'editorial', 'corporate', 'playful', 'luxury', 'technical', 'casual', 'authoritative'>",
    "treatments": ["<string — e.g. 'outlined', 'gradient', 'text-on-texture', 'drop-shadow', 'knockout', 'underlined', 'highlighted'. Empty array if no special treatments>"],
    "capitalizationStyle": "<string — e.g. 'all-caps', 'title-case', 'sentence-case', 'lowercase-stylistic', 'mixed'>",
    "spacingFeel": "<one of: 'tight' | 'normal' | 'airy'>",
    "textImageRelationship": "<string — e.g. 'overlaid', 'panel-separated', 'integrated', 'isolated', 'wrapped'>"
  },
  "confidence": {
    "typography": "<one of: 'high' | 'medium' | 'low'>"
  }
}

Rules:
- If no text, logos, or typographic elements are visible, return the null response shown above.
- fontsDetected must contain 1-6 entries, one per distinct font/style detected.
- classification must be exactly one of the 8 allowed values.
- confirmedName must always be null (it is populated by a separate service).
- likelyName should be your best guess at the actual font name, or null if you cannot identify it.
- hierarchyLevels counts distinct levels (e.g. headline + body = 2, headline + subhead + body + caption = 4).
- treatments can be an empty array if no special typographic treatments are applied.
- spacingFeel must be exactly one of: tight, normal, airy.
- Be specific about typographicTone — avoid generic descriptions.
- Return ONLY the JSON object, nothing else.`;
