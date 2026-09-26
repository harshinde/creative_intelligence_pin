// Helpers for accepting an image via clipboard paste or drag-and-drop.
// The popup converts the image to a data URI and sends it to the background
// service worker for analysis. No backend, no fetch.

/**
 * Read the first image found in a DataTransfer (from a paste or drop event).
 * Returns null if no image is found.
 */
export function getImageFromDataTransfer(dt: DataTransfer | null): File | null {
  if (!dt) return null;

  // Prefer items (gives us image/* mime types directly)
  if (dt.items) {
    for (let i = 0; i < dt.items.length; i++) {
      const item = dt.items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) return file;
      }
    }
  }

  // Fallback: scan files
  if (dt.files) {
    for (let i = 0; i < dt.files.length; i++) {
      const f = dt.files[i];
      if (f.type.startsWith('image/')) return f;
    }
  }

  return null;
}

/** Convert a File/Blob to a data URI string (handles large files safely). */
export function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Send a clipboard-pasted (or dropped) image to the background service worker
 * for analysis. Returns the profileId.
 */
export async function submitPastedImage(blob: Blob): Promise<{ profileId: string }> {
  const dataUri = await blobToDataUri(blob);
  const mimeType = blob.type || 'image/png';

  const response = await chrome.runtime.sendMessage({
    type: 'PASTE_IMAGE',
    payload: {
      base64: dataUri,
      mimeType,
      capturedAt: new Date().toISOString(),
    },
  });

  if (!response?.ok) {
    throw new Error(response?.error ?? 'Background did not accept the pasted image');
  }
  return response.data;
}
