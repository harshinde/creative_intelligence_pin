/**
 * Browser-native image preprocessing for the extension background service worker.
 * Replaces the Node.js `sharp` dependency from the backend.
 *
 * Uses OffscreenCanvas + createImageBitmap — both available in MV3 service workers
 * from Chrome 109+ (current stable is well above that).
 */

const MAX_LONGEST_EDGE = 1500;
const MAX_BYTES = 18 * 1024 * 1024; // 18 MB

export type SupportedMimeType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/gif'
  | 'image/svg+xml';

export interface ProcessedImage {
  bytes: Uint8Array;
  mimeType: string;
}

/**
 * Preprocess an image for Gemini upload:
 * 1. SVG → PNG conversion
 * 2. Proportional resize if longest edge > 1500px
 * 3. Size validation (18 MB max)
 *
 * Returns processed bytes and final MIME type.
 */
export async function preprocessImage(
  input: Uint8Array,
  inputMime: string,
): Promise<ProcessedImage> {
  // SVG: render to PNG via OffscreenCanvas
  if (inputMime === 'image/svg+xml' || inputMime === 'image/svg') {
    const svgBlob = new Blob([input], { type: 'image/svg+xml' });
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(svgBlob);
    } catch (err) {
      throw new Error(`Failed to render SVG image: ${err}`);
    }
    const canvas = new OffscreenCanvas(bitmap.width || 800, bitmap.height || 600);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const pngBlob = await canvas.convertToBlob({ type: 'image/png' });
    const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
    // Recurse once to apply resize check on the PNG result
    return preprocessImage(pngBytes, 'image/png');
  }

  const blob = new Blob([input], { type: inputMime });
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch (err) {
    throw new Error(
      `Unsupported image format (${inputMime}). Supported formats: JPEG, PNG, WebP, GIF, SVG.`,
    );
  }

  const { width, height } = bitmap;
  const longest = Math.max(width, height);

  if (longest > MAX_LONGEST_EDGE) {
    const scale = MAX_LONGEST_EDGE / longest;
    const newWidth = Math.round(width * scale);
    const newHeight = Math.round(height * scale);

    const canvas = new OffscreenCanvas(newWidth, newHeight);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);
    bitmap.close();

    // Always output JPEG after resize (matches backend sharp behavior)
    const jpegBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 });
    const resultBytes = new Uint8Array(await jpegBlob.arrayBuffer());
    return validateSize({ bytes: resultBytes, mimeType: 'image/jpeg' });
  }

  bitmap.close();

  // No resize needed — re-detect MIME from bytes and return original
  const detectedMime = detectMimeFromBytes(input) ?? inputMime;
  return validateSize({ bytes: input, mimeType: detectedMime });
}

/**
 * Validate that the image doesn't exceed the Gemini File API size limit.
 */
function validateSize(img: ProcessedImage): ProcessedImage {
  if (img.bytes.byteLength > MAX_BYTES) {
    const sizeMb = (img.bytes.byteLength / 1024 / 1024).toFixed(1);
    throw new Error(`Image too large: ${sizeMb} MB exceeds the 18 MB limit`);
  }
  return img;
}

/**
 * Detect image MIME type from magic bytes (first 12 bytes).
 */
export function detectMimeFromBytes(bytes: Uint8Array): SupportedMimeType {
  // JPEG: FF D8
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';

  // PNG: 89 50 4E 47
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  )
    return 'image/png';

  // GIF: 47 49 46
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'image/gif';

  // WebP: 52 49 46 46 ?? ?? ?? ?? 57 45 42 50
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  )
    return 'image/webp';

  // SVG: check for "<svg" or "<?xml" text patterns
  const start = new TextDecoder().decode(bytes.slice(0, 64)).trimStart();
  if (start.startsWith('<svg') || start.startsWith('<?xml') || start.includes('<svg')) {
    return 'image/svg+xml';
  }

  // Fallback
  return 'image/jpeg';
}

/**
 * Decode a data URI (e.g. from an inline <img> src) into bytes + MIME type.
 */
export function decodeDataUri(dataUri: string): { bytes: Uint8Array; mimeType: string } {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) throw new Error('Invalid data URI format');

  const mimeType = match[1];
  const binaryStr = atob(match[2]);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return { bytes, mimeType };
}

/**
 * Decode a plain base64 string (no data URI prefix) into bytes.
 */
export function decodeBase64(base64: string): Uint8Array {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}
