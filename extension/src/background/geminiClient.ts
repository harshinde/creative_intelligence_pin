import { GoogleGenAI } from '@google/genai';

/**
 * Create a Gemini client from a user-provided API key.
 * Called per-request — each user brings their own key.
 * Identical to backend/src/gemini/client.ts; browser-compatible.
 */
export function createGeminiClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({ apiKey });
}

export type { GoogleGenAI };
