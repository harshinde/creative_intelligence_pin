import { useState } from 'react';
import { colors, fonts } from '../tokens';
import { copyText, copyRichText } from '../utils/clipboard';

export interface SectionCopyButtonsProps {
  /** Pre-formatted brief text (key: value lines). */
  brief: string;
  /**
   * Optional HTML sibling of `brief`. When present, the "brief" button
   * writes both representations in one clipboard operation — rich-paste
   * destinations (Notion, Docs, Slack) render the HTML; plain-text
   * destinations (Firefly Boards, terminals) fall back to `brief` unchanged.
   */
  html?: string;
  /** Object that will be JSON.stringified for the JSON button. */
  json: unknown;
  /** What to call this section in the copy feedback toast (e.g. "subject"). */
  label?: string;
}

/**
 * Two tiny pill buttons — "brief" and "JSON" — that sit at the end of a
 * section header row. Click → copy → button text briefly turns into "✓ copied".
 *
 * Used at the title of each sub-section (Subject, Visual Style, Typography,
 * Graphic Elements, etc.) so users can grab just the slice they want without
 * needing to take the whole profile.
 */
export function SectionCopyButtons({ brief, html, json, label }: SectionCopyButtonsProps) {
  const [feedback, setFeedback] = useState<{ which: 'brief' | 'json'; text: string } | null>(null);

  function onCopy(which: 'brief' | 'json') {
    const setThis = (msg: string | null) => {
      if (msg) setFeedback({ which, text: msg });
      else setFeedback(null);
    };
    if (which === 'brief') {
      copyRichText(brief, html, setThis, '✓ brief');
    } else {
      copyText(JSON.stringify(json, null, 2), setThis, '✓ JSON');
    }
  }

  return (
    <div style={{ display: 'flex', gap: 4 }} aria-label={label ? `Copy ${label}` : 'Copy section'}>
      <Pill onClick={() => onCopy('brief')}>
        {feedback?.which === 'brief' ? feedback.text : 'brief'}
      </Pill>
      <Pill onClick={() => onCopy('json')}>
        {feedback?.which === 'json' ? feedback.text : 'JSON'}
      </Pill>
    </div>
  );
}

function Pill({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: `1px solid ${colors.border}`,
        color: colors.textBody,
        fontFamily: fonts.mono,
        fontSize: 9,
        padding: '3px 7px',
        borderRadius: 3,
        cursor: 'pointer',
        textTransform: 'lowercase',
        letterSpacing: '0.02em',
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}
