// Content script: detect images on hover and offer an "Analyze" button.
//
// Notable cases this script handles:
//   1. Plain <img> elements in the document's light DOM (the easy case)
//   2. <img> elements buried inside open Shadow DOM trees — common in modern
//      Adobe web apps like Firefly Boards, Express, and Workfront that use
//      Lightning Web Components / Spectrum Web Components extensively. We use
//      Event.composedPath() to look past Shadow DOM event retargeting.
//
// Closed Shadow DOM is intentionally unsupported — there is no way for a
// content script to reach inside a closed shadow root.

const MIN_IMAGE_DIMENSION = 80; // skip favicons, tracking pixels, and tiny UI glyphs

let overlay: HTMLDivElement | null = null;
let currentTarget: HTMLImageElement | null = null;

/** Find the first HTMLImageElement in the event's composed path, if any. */
function findImageInPath(e: Event): HTMLImageElement | null {
  const path = e.composedPath();
  for (const node of path) {
    if (node instanceof HTMLImageElement) {
      return node;
    }
  }
  return null;
}

/** Whether an image is big enough to be worth analyzing. */
function isAnalyzable(img: HTMLImageElement): boolean {
  const rect = img.getBoundingClientRect();
  return rect.width >= MIN_IMAGE_DIMENSION && rect.height >= MIN_IMAGE_DIMENSION;
}

function showPin(img: HTMLImageElement) {
  if (img === currentTarget && overlay) return; // already showing for this image
  removePin();

  currentTarget = img;
  const rect = img.getBoundingClientRect();

  overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: ${rect.top + 8}px;
    left: ${rect.left + 8}px;
    z-index: 2147483647;
    pointer-events: auto;
  `;

  const button = document.createElement('button');
  button.textContent = 'Analyze';
  button.style.cssText = `
    padding: 6px 12px;
    background: #ED2224;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    font-family: sans-serif;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.25);
  `;

  button.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!currentTarget) return;

    chrome.runtime.sendMessage({
      type: 'PIN_IMAGE',
      payload: {
        imageUrl: currentTarget.src,
        sourceUrl: window.location.href,
        capturedAt: new Date().toISOString(),
      },
    });

    removePin();
  });

  overlay.appendChild(button);
  document.body.appendChild(overlay);
}

function removePin() {
  overlay?.remove();
  overlay = null;
  currentTarget = null;
}

document.addEventListener(
  'mouseover',
  (e) => {
    const img = findImageInPath(e);
    if (img && isAnalyzable(img)) {
      showPin(img);
    }
  },
  // Use capture phase so we see the event before any inner Shadow DOM
  // listeners can stopPropagation on it.
  true,
);

document.addEventListener(
  'mouseout',
  (e) => {
    if (!overlay) return;

    // If we're moving into our own overlay or another image, keep the button.
    const related = e.relatedTarget as Node | null;
    if (related) {
      if (overlay.contains(related) || related === overlay) return;
      // If the relatedTarget is itself or contains an <img>, leave the button up;
      // a fresh mouseover on the new image will repaint anyway.
      const relPath: EventTarget[] = (e as MouseEvent).composedPath ? (e as MouseEvent).composedPath() : [];
      for (const node of relPath) {
        if (node instanceof HTMLImageElement) return;
      }
    }
    removePin();
  },
  true,
);
