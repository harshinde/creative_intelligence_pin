/**
 * Prompt for extracting CompositionProfile from an image.
 * Returns structured JSON matching the shared type definitions.
 */
export const COMPOSITION_PROMPT = `You are a creative intelligence analyst specializing in visual composition and layout. Analyze the provided image and extract a detailed composition profile.

Return ONLY valid JSON — no markdown fences, no commentary, no explanation.

The JSON must match this exact schema:

{
  "composition": {
    "layoutArchetype": "<string — e.g. 'centered', 'rule-of-thirds', 'editorial-split', 'full-bleed', 'grid', 'diagonal', 'L-shaped', 'z-pattern', 'golden-ratio', 'asymmetric-balance'>",
    "focalPoint": "<string — brief description of the dominant visual element, e.g. 'product bottle in center', 'model\\'s face upper-left third'>",
    "symmetry": "<one of: 'symmetric' | 'asymmetric' | 'radial'>",
    "negativeSpaceRatio": "<one of: 'low' | 'medium' | 'high'>",
    "hasDepthLayers": "<boolean — true if the image has distinct foreground/midground/background separation>",
    "textToImageRatio": "<number 0-1 — proportion of the canvas area occupied by text, e.g. 0.0 for no text, 0.3 for 30% text>",
    "detectedRegions": [
      {
        "label": "<string — semantic label, e.g. 'headline_text', 'hero_image', 'cta_button', 'logo', 'product', 'background'>",
        "boundingBox": {
          "yMin": "<integer 0-1000 — top edge, normalized>",
          "xMin": "<integer 0-1000 — left edge, normalized>",
          "yMax": "<integer 0-1000 — bottom edge, normalized>",
          "xMax": "<integer 0-1000 — right edge, normalized>"
        },
        "visualWeight": "<one of: 'primary' | 'secondary' | 'tertiary'>"
      }
    ]
  },
  "confidence": {
    "composition": "<one of: 'high' | 'medium' | 'low'>"
  },
  "confidenceNotes": {
    "composition": "<string | null — if composition confidence is 'medium' or 'low', a concise (≤12 words) reason for the uncertainty; null if 'high'>"
  }
}

Rules:
- layoutArchetype should be a concise, recognized composition term.
- focalPoint should describe what draws the eye first in 5-15 words.
- symmetry must be exactly one of: symmetric, asymmetric, radial.
- negativeSpaceRatio: low = <20% empty space, medium = 20-50%, high = >50%.
- textToImageRatio must be a number between 0 and 1 (inclusive). Use 0 if no text is visible.
- detectedRegions should contain 2-8 regions, ordered by visual importance (primary first).
- boundingBox values are normalized to a 0-1000 coordinate space (0 = top/left, 1000 = bottom/right).
- yMin must be < yMax, and xMin must be < xMax for each bounding box.
- visualWeight indicates the region's visual dominance: primary = most important, tertiary = least.
- If you cannot determine a field with reasonable confidence, use your best estimate rather than omitting it.
- Return ONLY the JSON object, nothing else.`;
