// Tiny clipboard helpers with a feedback callback.

export async function copyText(
  text: string,
  feedbackSetter: (msg: string | null) => void,
  successLabel = 'Copied!',
  timeoutMs = 1400,
): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    feedbackSetter(successLabel);
  } catch {
    feedbackSetter('Failed');
  }
  setTimeout(() => feedbackSetter(null), timeoutMs);
}

/**
 * Writes both a plain-text and an HTML representation of the same content
 * in a single clipboard operation. Rich-paste-aware destinations (Notion,
 * Google Docs, Slack, Gmail) pick up the HTML entry and render it properly;
 * plain-text-only destinations (Firefly Boards, terminals) fall back to the
 * plain-text entry — same click, better everywhere it can be, unchanged
 * everywhere it can't.
 *
 * Falls back to a plain-text-only write if `html` is omitted, or if the
 * rich write fails for any reason (unsupported browser, permissions, etc).
 */
export async function copyRichText(
  plainText: string,
  html: string | undefined,
  feedbackSetter: (msg: string | null) => void,
  successLabel = 'Copied!',
  timeoutMs = 1400,
): Promise<void> {
  try {
    if (html && 'write' in navigator.clipboard) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([plainText], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' }),
        }),
      ]);
    } else {
      await navigator.clipboard.writeText(plainText);
    }
    feedbackSetter(successLabel);
  } catch {
    // Rich write failed (unsupported browser, permissions, etc) — fall
    // back to a plain-text write rather than leaving the clipboard empty.
    try {
      await navigator.clipboard.writeText(plainText);
      feedbackSetter(successLabel);
    } catch {
      feedbackSetter('Failed');
    }
  }
  setTimeout(() => feedbackSetter(null), timeoutMs);
}
