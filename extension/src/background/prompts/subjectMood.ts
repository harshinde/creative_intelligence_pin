/**
 * Prompt for extracting SubjectProfile + MoodProfile from an image.
 * Returns structured JSON matching the shared type definitions.
 */
export const SUBJECT_MOOD_PROMPT = `You are a creative intelligence analyst. Analyze the provided image and extract two profiles: Subject and Mood.

Return ONLY valid JSON — no markdown fences, no commentary, no explanation.

The JSON must match this exact schema:

{
  "subject": {
    "primarySubject": "<string — what the image is primarily about, e.g. 'product shot', 'portrait', 'landscape', 'UI mockup'>",
    "setting": "<string — describe the environment/context, e.g. 'studio, white background', 'outdoor cafe'>",
    "brandPresence": <boolean — true if a visible logo or brand identity is detected>,
    "brandName": "<string | null — inferred brand name if detectable, otherwise null>",
    "culturalSignals": ["<string — cultural or regional influences detected, e.g. 'Japanese', 'Scandinavian'>"],
    "narrativeQuality": "<one of: 'storytelling' | 'statement' | 'decorative' | 'functional'>"
  },
  "mood": {
    "primary": "<string — dominant emotional tone, e.g. 'serene', 'bold', 'playful'>",
    "secondary": ["<string — supporting emotional undertones>"],
    "energyLevel": "<one of: 'low' | 'medium' | 'high'>",
    "formality": "<one of: 'formal' | 'semi-formal' | 'casual'>",
    "sensoryAssociations": ["<string — synesthetic descriptors, e.g. 'warm', 'rough', 'quiet'>"],
    "aspirational": <boolean — true if the image conveys aspiration/luxury, false if accessible/everyday>
  },
  "confidence": {
    "subject": "<one of: 'high' | 'medium' | 'low'>",
    "mood": "<one of: 'high' | 'medium' | 'low'>",
    "overall": "<one of: 'high' | 'medium' | 'low'>"
  }
}

Rules:
- If you cannot determine a field with reasonable confidence, set it to null.
- culturalSignals and secondary may be empty arrays [] if nothing is detected.
- sensoryAssociations should contain 2-5 descriptors.
- Be precise and specific — avoid generic descriptions.
- Return ONLY the JSON object, nothing else.`;
