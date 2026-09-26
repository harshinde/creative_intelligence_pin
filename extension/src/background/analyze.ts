import type { GoogleGenAI } from './geminiClient';

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.5-pro';

export interface AnalyzeImageOptions {
  fileUri: string;
  mimeType: string;
  prompt: string;
  model?: string;
  ai: GoogleGenAI;
}

/**
 * Send an image (via Gemini File API URI) and a prompt to Gemini,
 * returning the raw text response.
 *
 * Falls back from Flash → Pro on failure.
 * Identical to backend/src/gemini/analyze.ts — fully browser-compatible.
 */
export async function analyzeImage(opts: AnalyzeImageOptions): Promise<string> {
  const model = opts.model ?? PRIMARY_MODEL;

  try {
    return await callModel(model, opts, opts.ai);
  } catch (err) {
    if (model === PRIMARY_MODEL) {
      console.warn(
        `[analyze] ${PRIMARY_MODEL} failed, falling back to ${FALLBACK_MODEL}:`,
        err,
      );
      return callModel(FALLBACK_MODEL, opts, opts.ai);
    }
    throw err;
  }
}

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 3000;

async function callModel(
  model: string,
  opts: AnalyzeImageOptions,
  ai: GoogleGenAI,
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { fileData: { fileUri: opts.fileUri, mimeType: opts.mimeType } },
              { text: opts.prompt },
            ],
          },
        ],
      });

      const text = response.text;
      if (!text) {
        throw new Error('Gemini returned an empty response');
      }

      return stripCodeFences(text);
    } catch (err) {
      lastError = err;
      const is429 =
        err instanceof Error &&
        (err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED'));

      if (is429 && attempt < MAX_RETRIES) {
        const waitMs = RETRY_BASE_MS * Math.pow(2, attempt); // 3s, 6s, 12s
        console.warn(
          `[analyze] 429 rate limit on ${model}, retrying in ${waitMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
        );
        await delay(waitMs);
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

/**
 * Text-only Gemini call (no image). Used for the design summary stage.
 * Same Flash → Pro fallback and retry logic.
 */
export async function generateText(
  prompt: string,
  ai: GoogleGenAI,
  model?: string,
): Promise<string> {
  const selectedModel = model ?? PRIMARY_MODEL;

  try {
    return await callTextModel(selectedModel, prompt, ai);
  } catch (err) {
    if (selectedModel === PRIMARY_MODEL) {
      console.warn(`[analyze] ${PRIMARY_MODEL} failed, falling back to ${FALLBACK_MODEL}:`, err);
      return callTextModel(FALLBACK_MODEL, prompt, ai);
    }
    throw err;
  }
}

async function callTextModel(
  model: string,
  prompt: string,
  ai: GoogleGenAI,
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const text = response.text;
      if (!text) throw new Error('Gemini returned an empty response');
      return stripCodeFences(text);
    } catch (err) {
      lastError = err;
      const is429 =
        err instanceof Error &&
        (err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED'));

      if (is429 && attempt < MAX_RETRIES) {
        const waitMs = RETRY_BASE_MS * Math.pow(2, attempt);
        console.warn(
          `[analyze] 429 rate limit on ${model}, retrying in ${waitMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
        );
        await delay(waitMs);
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

/** Strip markdown code fences that Gemini sometimes wraps around JSON. */
function stripCodeFences(text: string): string {
  return text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
