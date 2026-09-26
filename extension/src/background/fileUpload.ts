import type { GoogleGenAI } from './geminiClient';

/**
 * Upload an image to the Gemini File API.
 * Retries once on failure before throwing.
 * Returns the file URI for use in subsequent Gemini calls.
 *
 * Adapted from backend/src/gemini/fileApi.ts — uses Uint8Array instead of Buffer
 * (Blob constructor accepts Uint8Array natively in browsers and service workers).
 */
export async function uploadToGeminiFileApi(
  imageBytes: Uint8Array,
  mimeType: string,
  ai: GoogleGenAI,
): Promise<string> {
  return withRetry(() => upload(imageBytes, mimeType, ai), 1);
}

async function upload(bytes: Uint8Array, mimeType: string, ai: GoogleGenAI): Promise<string> {
  const blob = new Blob([bytes], { type: mimeType });
  const file = await ai.files.upload({ file: blob, config: { mimeType } });

  if (!file.uri) {
    throw new Error('Gemini File API returned no URI');
  }

  return file.uri;
}

async function withRetry<T>(fn: () => Promise<T>, retries: number): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    console.warn('[fileUpload] Upload failed, retrying once…', err);
    return withRetry(fn, retries - 1);
  }
}
