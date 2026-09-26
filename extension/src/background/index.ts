/**
 * Creative Intelligence Pin — Background Service Worker (MV3)
 *
 * Self-contained: no backend server required.
 * All image processing, Gemini API calls, and state management run here.
 */

import { GoogleGenAI } from '@google/genai';
import {
  preprocessImage,
  detectMimeFromBytes,
  decodeDataUri,
  decodeBase64,
} from './imageProcessing';
import { uploadToGeminiFileApi } from './fileUpload';
import { setProfile, setFileMeta, updateProfile } from './profileStore';
import { runFullAnalysis, retryFailedStages } from './analysisOrchestrator';

// ─────────────────────────────────────────
// SIDE PANEL BEHAVIOR
// Make the toolbar icon toggle the side panel. This replaces the popup
// entirely — clicking the icon opens (or focuses) the side panel.
// ─────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.error('[background] setPanelBehavior failed:', err));
});

/**
 * Open the side panel for the given tab, using whatever user-gesture
 * context we still have. Safe to call outside a gesture — Chrome will
 * simply reject the call and the user can open the panel themselves.
 */
async function tryOpenSidePanel(tabId: number | undefined) {
  try {
    if (typeof tabId === 'number') {
      await chrome.sidePanel.open({ tabId });
    }
  } catch (err) {
    // Not a user gesture, panel already open, or unsupported — non-fatal.
    console.debug('[background] sidePanel.open failed:', err);
  }
}

// ─────────────────────────────────────────
// KEEPALIVE ALARM
// Analysis can take 40-90s. MV3 service workers go idle after ~30s.
// A repeating alarm keeps the worker alive throughout analysis.
// ─────────────────────────────────────────

const KEEPALIVE_ALARM = 'analysis-keepalive';

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === KEEPALIVE_ALARM) {
    // Trivial read — enough to prevent the worker from going idle
    chrome.storage.local.get('lastPinProfileId');
  }
});

function startKeepalive() {
  chrome.alarms.create(KEEPALIVE_ALARM, { periodInMinutes: 0.4 }); // fires every ~24s
}

function stopKeepalive() {
  chrome.alarms.clear(KEEPALIVE_ALARM);
}

// ─────────────────────────────────────────
// MESSAGE HANDLER
// ─────────────────────────────────────────

interface PinImagePayload {
  imageUrl: string;
  sourceUrl: string;
  capturedAt: string;
}

interface PasteImagePayload {
  /** base64 string OR data: URI */
  base64: string;
  mimeType: string;
  capturedAt: string;
}

interface RetryAnalysisPayload {
  profileId: string;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PIN_IMAGE') {
    // Open the side panel *synchronously* in response to the user gesture
    // that triggered this message. Chrome preserves the gesture context
    // for the immediate onMessage callback, so this is the reliable window.
    tryOpenSidePanel(sender.tab?.id);

    handlePin(message.payload as PinImagePayload, sender)
      .then((result) => sendResponse({ ok: true, data: result }))
      .catch((err) => {
        console.error('[background] Pin failed:', err);
        sendResponse({ ok: false, error: String(err) });
      });
    return true; // keep channel open for async response
  }

  if (message.type === 'PASTE_IMAGE') {
    // Paste always happens inside the side panel itself, so it's already
    // open and visible — no need to call tryOpenSidePanel here. (Messages
    // sent from an extension page like the side panel never populate
    // sender.tab, unlike messages from a content script, so that call
    // would be an unconditional no-op anyway.)
    handlePaste(message.payload as PasteImagePayload)
      .then((result) => sendResponse({ ok: true, data: result }))
      .catch((err) => {
        console.error('[background] Paste failed:', err);
        sendResponse({ ok: false, error: String(err) });
      });
    return true;
  }

  if (message.type === 'RETRY_ANALYSIS') {
    const { profileId } = message.payload as RetryAnalysisPayload;
    handleRetryAnalysis(profileId)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => {
        console.error('[background] Retry failed:', err);
        sendResponse({ ok: false, error: String(err) });
      });
    return true;
  }
});

// ─────────────────────────────────────────
// PIN HANDLER
// ─────────────────────────────────────────

async function handlePin(
  payload: PinImagePayload,
  sender: chrome.runtime.MessageSender,
): Promise<{ profileId: string; analysisStatus: string }> {
  // Fetch image bytes (handles data URIs, https URLs, and tab-screenshot fallback)
  const { base64, mimeType: rawMime } = await fetchImageBytes(
    payload.imageUrl,
    sender.tab?.id,
  );

  return processImageBytes({
    base64,
    rawMime,
    sourceUrl: payload.sourceUrl,
    capturedAt: payload.capturedAt,
    thumbnailUrl: payload.imageUrl,
  });
}

async function handlePaste(
  payload: PasteImagePayload,
): Promise<{ profileId: string; analysisStatus: string }> {
  // The side panel already read the bytes from the clipboard and gave us base64.
  // Use a synthetic source descriptor; the thumbnail is the pasted image itself.
  const thumbnailUrl = payload.base64.startsWith('data:')
    ? payload.base64
    : `data:${payload.mimeType};base64,${payload.base64}`;

  return processImageBytes({
    base64: payload.base64,
    rawMime: payload.mimeType,
    sourceUrl: 'pasted:clipboard',
    capturedAt: payload.capturedAt,
    thumbnailUrl,
  });
}

interface ProcessImageArgs {
  /** Raw base64 (no data URI prefix) OR a data: URI */
  base64: string;
  rawMime: string;
  sourceUrl: string;
  capturedAt: string;
  /**
   * URL/data URI used for the side panel thumbnail. For pinned images this is
   * the original webpage URL; for pasted images it's a data URI.
   */
  thumbnailUrl: string;
}

/**
 * Shared pipeline that turns raw image bytes into a stored profile + kicks off
 * the Gemini analysis. Used by both Pin and Paste flows.
 */
async function processImageBytes(
  args: ProcessImageArgs,
): Promise<{ profileId: string; analysisStatus: string }> {
  // 1. API key + enabled blocks
  const storage = await chrome.storage.local.get(['geminiApiKey', 'enabledBlocks']);
  const apiKey: string | undefined = storage.geminiApiKey;
  if (!apiKey) {
    chrome.runtime.openOptionsPage();
    throw new Error('No Gemini API key configured. Please set your API key in the extension settings.');
  }
  const enabledBlocks: string[] | undefined = storage.enabledBlocks;
  const ai = new GoogleGenAI({ apiKey });

  // 2. Decode incoming base64 / data URI
  let imageBytes: Uint8Array;
  let inputMime: string;
  if (args.base64.startsWith('data:')) {
    const decoded = decodeDataUri(args.base64);
    imageBytes = decoded.bytes;
    inputMime = decoded.mimeType;
  } else {
    imageBytes = decodeBase64(args.base64);
    inputMime = args.rawMime || detectMimeFromBytes(imageBytes);
  }

  // 3. Preprocess (resize, format conversion, size validation)
  const processed = await preprocessImage(imageBytes, inputMime);

  // 4. Create initial profile entry
  const profileId = crypto.randomUUID();
  await setProfile(profileId, {
    id: profileId,
    imageUri: '', // filled in after upload
    sourceThumbnailUrl: args.thumbnailUrl,
    sourceUrl: args.sourceUrl,
    capturedAt: args.capturedAt,
    analysisStatus: 'pending',
  });
  await setFileMeta(profileId, { mimeType: processed.mimeType });

  // 5. Upload to Gemini File API
  const fileUri = await uploadToGeminiFileApi(processed.bytes, processed.mimeType, ai);
  await updateProfile(profileId, { imageUri: fileUri });

  // 6. Track latest profile so the side panel picks it up
  await chrome.storage.local.set({
    lastPinProfileId: profileId,
    lastPinImageUrl: args.thumbnailUrl,
  });
  console.log(`[background] Profile ${profileId} created → ${fileUri}`);

  // 7. Fire-and-forget analysis
  startKeepalive();
  runFullAnalysis(
    profileId,
    ai,
    enabledBlocks && enabledBlocks.length > 0 ? enabledBlocks : undefined,
  )
    .catch((err) => {
      console.error(`[background] Analysis failed for ${profileId}:`, err);
      updateProfile(profileId, { analysisStatus: 'failed' }).catch(console.error);
    })
    .finally(stopKeepalive);

  return { profileId, analysisStatus: 'pending' };
}

// ─────────────────────────────────────────
// RETRY HANDLER
// ─────────────────────────────────────────

async function handleRetryAnalysis(profileId: string): Promise<void> {
  const { geminiApiKey } = await chrome.storage.local.get('geminiApiKey');
  if (!geminiApiKey) throw new Error('No API key configured');

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  startKeepalive();
  await retryFailedStages(profileId, ai);
  stopKeepalive();
}

// ─────────────────────────────────────────
// IMAGE FETCHING HELPERS (unchanged from original)
// ─────────────────────────────────────────

interface FetchedImage {
  base64: string;
  mimeType: string;
}

/**
 * Fetch image bytes as base64.
 * Handles:
 *   - Inline data URIs (returned as-is)
 *   - Standard URLs (JPEG, PNG, WebP, GIF, SVG)
 *   - 403/404 fallback → captureVisibleTab screenshot
 */
async function fetchImageBytes(
  imageUrl: string,
  tabId: number | undefined,
): Promise<FetchedImage> {
  // Inline data URI — pass straight through
  if (imageUrl.startsWith('data:')) {
    const mimeType = imageUrl.split(';')[0].replace('data:', '');
    return { base64: imageUrl, mimeType };
  }

  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const mimeType = blob.type || 'image/jpeg';
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = bufferToBase64(new Uint8Array(arrayBuffer));

    return { base64, mimeType };
  } catch (err) {
    console.warn('[background] Direct fetch failed, falling back to screenshot:', err);
    return captureTabScreenshot(tabId);
  }
}

/**
 * Fallback: capture the visible tab as a PNG screenshot.
 */
async function captureTabScreenshot(
  tabId: number | undefined,
): Promise<FetchedImage> {
  void tabId; // tabId unused — captureVisibleTab uses the current window
  const dataUrl = await chrome.tabs.captureVisibleTab(
    undefined as unknown as number,
    { format: 'png' },
  );
  return { base64: dataUrl, mimeType: 'image/png' };
}

/**
 * Convert Uint8Array to base64 string without stack overflow on large buffers.
 */
function bufferToBase64(bytes: Uint8Array): string {
  const CHUNK = 8192;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}
