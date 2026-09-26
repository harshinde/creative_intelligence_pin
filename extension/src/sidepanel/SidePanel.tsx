// SidePanel — the Chrome side panel surface for Creative Intelligence Pin.
//
// This is the successor to Popup. It reuses every popup component 1:1 and
// adapts only the outer shell: fluid width, no forced maxHeight on the tab
// content, and a breakpoint-aware layout that gets richer at wider widths.
//
// The user's driving priority is "wider layout — richer views" — so most of
// the tweaks vs. Popup are about letting the panel breathe when Chrome gives
// it more room, not about adding new features. History / comparison / bounding
// boxes are Phase C.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PartialCreativeProfile } from '@shared/types';

import { colors, fonts, layout } from '../shared-ui/tokens';
import { copyText, copyRichText } from '../shared-ui/utils/clipboard';
import {
  formatProfileAsText,
  formatProfileAsHtml,
  formatProfileAsJSON,
} from '../shared-ui/utils/format';
import { confidenceToScore } from '../shared-ui/utils/mappings';
import {
  getImageFromDataTransfer,
  submitPastedImage,
} from '../shared-ui/utils/pasteImage';

import { ImageHero } from '../shared-ui/components/ImageHero';
import { TabBar, type TabKey } from '../shared-ui/components/TabBar';
import { Footer } from '../shared-ui/components/Footer';
import { EmptyState } from '../shared-ui/components/EmptyState';
import { SetupState } from '../shared-ui/components/SetupState';
import { StageProgress, type Stage } from '../shared-ui/components/StageProgress';
import { SettingsPanel } from '../shared-ui/components/SettingsPanel';

import { MoodTab } from '../shared-ui/tabs/MoodTab';
import { PaletteTab } from '../shared-ui/tabs/PaletteTab';
import { StructureTab } from '../shared-ui/tabs/StructureTab';

// ─── Stages (parallels service worker analysis order) ─────────────

const ALL_BLOCKS = [
  { key: 'subjectMood', label: 'Subject & Mood' },
  { key: 'color', label: 'Color' },
  { key: 'composition', label: 'Composition' },
  { key: 'visualStyle', label: 'Visual Style' },
  { key: 'typography', label: 'Typography' },
  { key: 'graphicElements', label: 'Graphic Elements' },
];

const STAGE_DEFS: { key: string; label: string }[] = [
  { key: 'subjectMood', label: 'Subject & Mood' },
  { key: 'color', label: 'Color' },
  { key: 'composition', label: 'Composition' },
  { key: 'visualStyle', label: 'Visual Style' },
  { key: 'typography', label: 'Typography' },
  { key: 'graphicElements', label: 'Graphic Elements' },
  { key: 'designSummary', label: 'Design Summary' },
];

// ─── Width breakpoint hook ────────────────────────────────────────
// The panel is user-resizable. We track its window width and expose a
// simple breakpoint so nested content can adapt (e.g. wider design
// summary column, roomier tab-content padding).

function useWindowWidth(): number {
  const [w, setW] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 380,
  );
  useEffect(() => {
    // Native resize events fire many times per second while the panel edge
    // is being dragged. Coalesce to at most one state update per animation
    // frame so a drag doesn't force dozens of full-tree re-renders/sec.
    let rafId: number | null = null;
    function onResize() {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        setW(window.innerWidth);
      });
    }
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);
  return w;
}

// ─── Component ────────────────────────────────────────────────────

export function SidePanel() {
  const width = useWindowWidth();
  const isRoomy = width >= layout.roomyBreakpoint;

  const [profile, setProfile] = useState<PartialCreativeProfile | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyChecked, setApiKeyChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('mood');
  const [showSettings, setShowSettings] = useState(false);
  const [enabledBlocks, setEnabledBlocks] = useState<string[]>(
    ALL_BLOCKS.map((b) => b.key),
  );
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [pasteFeedback, setPasteFeedback] = useState<string | null>(null);

  // ─── Load initial state ───
  useEffect(() => {
    chrome.storage.local
      .get(['enabledBlocks', 'geminiApiKey'])
      .then((result) => {
        if (Array.isArray(result.enabledBlocks)) {
          setEnabledBlocks(result.enabledBlocks);
        }
        setApiKey(result.geminiApiKey || null);
        setApiKeyChecked(true);
      });
  }, []);

  // ─── Load + subscribe to profile updates ───
  // profileIdRef mirrors the current profileId so the onChanged listener can
  // check relevance synchronously, without a chrome.storage round-trip on
  // every storage write elsewhere in the extension (settings toggles, API
  // key save/clear, etc).
  const profileIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    let active = true;

    async function start() {
      const result = await chrome.storage.local.get([
        'lastPinProfileId',
        'lastPinImageUrl',
      ]);
      if (result.lastPinImageUrl) setImageUrl(result.lastPinImageUrl);

      const profileId: string | undefined = result.lastPinProfileId;
      profileIdRef.current = profileId;
      if (!profileId) {
        setLoading(false);
        return;
      }

      const stored = await chrome.storage.local.get(`profile:${profileId}`);
      const current = stored[`profile:${profileId}`] as PartialCreativeProfile | undefined;
      if (current) {
        setProfile(current);
        if (current.sourceThumbnailUrl) setImageUrl(current.sourceThumbnailUrl);
      }
      setLoading(false);
    }

    start();

    function onChanged(
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) {
      if (area !== 'local' || !active) return;

      // A new pin/paste updates lastPinProfileId itself — pick that up
      // directly instead of waiting for a follow-up storage read.
      if (changes.lastPinProfileId) {
        profileIdRef.current = changes.lastPinProfileId.newValue as string | undefined;
      }

      const profileId = profileIdRef.current;
      if (!profileId) return;
      const key = `profile:${profileId}`;
      if (!changes[key]) return;
      const updated = changes[key].newValue as PartialCreativeProfile | undefined;
      if (updated) {
        setProfile(updated);
        if (updated.sourceThumbnailUrl) setImageUrl(updated.sourceThumbnailUrl);
        setLoading(false);
      }
    }

    chrome.storage.onChanged.addListener(onChanged);
    return () => {
      active = false;
      chrome.storage.onChanged.removeListener(onChanged);
    };
  }, []);

  // ─── Global paste listener ───
  useEffect(() => {
    async function onPaste(e: ClipboardEvent) {
      const file = getImageFromDataTransfer(e.clipboardData);
      if (!file) return;
      e.preventDefault();
      setPasteFeedback('Sending pasted image…');
      try {
        await submitPastedImage(file);
        setPasteFeedback(null);
      } catch (err) {
        setPasteFeedback(err instanceof Error ? err.message : String(err));
        setTimeout(() => setPasteFeedback(null), 3500);
      }
    }
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, []);

  // ─── Derived state ───

  const isProcessing =
    profile &&
    (profile.analysisStatus === 'pending' || profile.analysisStatus === 'processing');
  const isComplete = profile?.analysisStatus === 'complete';
  const hasFailed = !!(profile?.failedStages && profile.failedStages.length > 0);

  const stages = useMemo<Stage[]>(() => {
    if (!profile) return [];
    return STAGE_DEFS.map((def) => {
      const failed = profile.failedStages?.includes(def.key);
      const done = hasStageData(profile, def.key);
      let status: Stage['status'];
      if (failed) status = 'failed';
      else if (done) status = 'done';
      else status = 'queued';
      return { key: def.key, label: def.label, status };
    });
  }, [profile]);

  const stagesWithRunning = useMemo<Stage[]>(() => {
    if (!isProcessing) return stages;
    const runningIdx = stages.findIndex(
      (s) => s.status !== 'done' && s.status !== 'failed',
    );
    if (runningIdx === -1) return stages;
    return stages.map((s, i) => (i === runningIdx ? { ...s, status: 'running' } : s));
  }, [stages, isProcessing]);

  const completedStages = stages.filter((s) => s.status === 'done').length;
  const totalStages = stages.length;
  const progress = totalStages > 0 ? completedStages / totalStages : 0;
  const etaSeconds = isProcessing
    ? Math.max(0, Math.round((totalStages - completedStages) * 7))
    : undefined;

  const currentStatusLabel = (() => {
    if (!isProcessing) return undefined;
    const running = stagesWithRunning.find((s) => s.status === 'running');
    if (!running) return 'Analyzing image…';
    return `Analyzing ${running.label.toLowerCase()}…`;
  })();

  const confidenceScore = confidenceToScore(profile?.confidence?.overall);

  // ─── Handlers ───

  function toggleBlock(key: string) {
    setEnabledBlocks((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      chrome.storage.local.set({ enabledBlocks: next });
      return next;
    });
  }

  function handleOpenSettings() {
    chrome.runtime.openOptionsPage();
  }

  function handleCopyBrief() {
    if (!profile) return;
    copyRichText(
      formatProfileAsText(profile),
      formatProfileAsHtml(profile),
      setCopyFeedback,
      '✓ brief',
    );
  }

  function handleCopyJSON() {
    if (!profile) return;
    copyText(formatProfileAsJSON(profile), setCopyFeedback, '✓ JSON');
  }

  async function handleRetry() {
    if (!profile?.id) return;
    try {
      await chrome.runtime.sendMessage({
        type: 'RETRY_ANALYSIS',
        payload: { profileId: profile.id },
      });
    } catch {
      /* errors surfaced via storage listener */
    }
  }

  // ─── Render branches ───

  const isFirstRun = apiKeyChecked && !apiKey;
  const hasNoPin = !loading && !profile;

  // Content inside the panel is capped for readability — full-bleed at narrow
  // widths, comfortably centered with generous horizontal breathing at wider.
  const contentMaxWidth = layout.contentMaxWidth;
  const outerPadX = isRoomy ? 24 : 0;

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: colors.bg,
        color: colors.textPrimary,
        fontFamily: fonts.sans,
        position: 'relative',
      }}
    >
      <style>{`@keyframes ci-spin { to { transform: rotate(360deg); } }`}</style>

      {/* Content column — capped so it reads well when Chrome is 700+ px wide */}
      <div
        style={{
          maxWidth: contentMaxWidth,
          margin: '0 auto',
          padding: `0 ${outerPadX}px`,
        }}
      >
        {/* API key not set */}
        {isFirstRun && (
          <>
            <HeaderBar onSettings={handleOpenSettings} showSettings={false} />
            <SetupState onOpenSettings={handleOpenSettings} />
          </>
        )}

        {/* Paste toast — floats over everything */}
        {pasteFeedback && (
          <div
            style={{
              position: 'fixed',
              top: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 20,
              padding: '8px 14px',
              background: colors.accentBg,
              border: `1px solid ${colors.accentBorder}`,
              borderRadius: 6,
              fontFamily: fonts.mono,
              fontSize: 10,
              color: colors.accent,
              textAlign: 'center',
              backdropFilter: 'blur(8px)',
            }}
          >
            {pasteFeedback}
          </div>
        )}

        {/* No pin yet */}
        {!isFirstRun && hasNoPin && (
          <>
            <HeaderBar onSettings={handleOpenSettings} showSettings={true} />
            <EmptyState onPasted={() => setPasteFeedback('Sending pasted image…')} />
          </>
        )}

        {/* Have a pin */}
        {!isFirstRun && profile && (
          <>
            <ImageHero
              imageUrl={imageUrl}
              sourceUrl={profile.sourceUrl}
              analyzing={!!isProcessing}
              progress={progress}
              statusLabel={currentStatusLabel}
            />

            {/* Design summary band — max-width 60ch keeps prose readable when
                the panel is very wide. Wider than 40em is a legibility problem. */}
            <div
              style={{
                padding: '14px 16px 12px',
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <div style={{ flex: 1, maxWidth: `${layout.proseMaxWidthCh}ch` }}>
                {profile.designSummary ? (
                  <p
                    style={{
                      fontFamily: fonts.sans,
                      fontSize: 12,
                      color: colors.textBody,
                      lineHeight: 1.55,
                      margin: 0,
                    }}
                  >
                    {profile.designSummary}
                  </p>
                ) : (
                  <p
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: 10,
                      color: colors.textMuted,
                      margin: 0,
                    }}
                  >
                    {isProcessing ? 'Generating brief…' : 'No brief available.'}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowSettings(true)}
                title="Settings"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: colors.textMuted,
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: 2,
                  lineHeight: 1,
                  flexShrink: 0,
                }}
                aria-label="Open settings"
              >
                ⚙
              </button>
            </div>

            <TabBar active={activeTab} onChange={setActiveTab} />

            {/*
              Tab content — unlike the popup this has no forced maxHeight.
              The side panel is scrollable at the browser level and users
              can resize it; no need to jail the content in a 320 px scroll.
            */}
            <div
              style={{
                padding: isRoomy ? '20px 20px 8px' : '16px 16px 8px',
              }}
            >
              {isProcessing && completedStages < 2 ? (
                <StageProgress stages={stagesWithRunning} etaSeconds={etaSeconds} />
              ) : (
                <>
                  {activeTab === 'mood' && (
                    <MoodTab mood={profile.mood} subject={profile.subject} />
                  )}
                  {activeTab === 'palette' && <PaletteTab color={profile.color} />}
                  {activeTab === 'structure' && (
                    <StructureTab
                      composition={profile.composition}
                      visualStyle={profile.visualStyle}
                      typography={profile.typography}
                      graphicElements={profile.graphicElements}
                    />
                  )}
                </>
              )}

              {/* Failed-stage retry banner */}
              {isComplete && hasFailed && (
                <div
                  style={{
                    marginTop: 16,
                    padding: '10px 12px',
                    background: 'rgba(217,106,106,0.08)',
                    border: `1px solid rgba(217,106,106,0.3)`,
                    borderRadius: 6,
                  }}
                >
                  <div
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: 10,
                      color: colors.danger,
                      marginBottom: 6,
                    }}
                  >
                    Failed: {(profile.failedStages ?? []).join(', ')}
                  </div>
                  <button
                    onClick={handleRetry}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${colors.danger}`,
                      color: colors.danger,
                      fontFamily: fonts.mono,
                      fontSize: 10,
                      padding: '4px 10px',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    RETRY FAILED
                  </button>
                </div>
              )}
            </div>

            <Footer
              confidenceScore={confidenceScore}
              onCopyBrief={handleCopyBrief}
              onCopyJSON={handleCopyJSON}
              feedback={copyFeedback}
              ready={!!isComplete || !!profile.designSummary}
            />
          </>
        )}
      </div>

      {/* Settings overlay */}
      {showSettings && profile && (
        <SettingsPanel
          blocks={ALL_BLOCKS}
          enabled={enabledBlocks}
          onToggle={toggleBlock}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

function hasStageData(profile: PartialCreativeProfile, key: string): boolean {
  switch (key) {
    case 'subjectMood':
      return !!(profile.subject && profile.mood);
    case 'color':
      return !!profile.color;
    case 'composition':
      return !!profile.composition;
    case 'visualStyle':
      return !!profile.visualStyle;
    case 'typography':
      return profile.typography !== undefined; // null is a valid completed result
    case 'graphicElements':
      return !!profile.graphicElements;
    case 'designSummary':
      return !!profile.designSummary;
    default:
      return false;
  }
}

// ─── Top header bar ───────────────────────────────────────────────

function HeaderBar({
  onSettings,
  showSettings,
}: {
  onSettings: () => void;
  showSettings: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 16px',
        background: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: 10,
          color: colors.textPrimary,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}
      >
        Creative Intelligence
      </div>
      {showSettings && (
        <button
          onClick={onSettings}
          title="Settings"
          style={{
            background: 'transparent',
            border: 'none',
            color: colors.textMuted,
            cursor: 'pointer',
            fontSize: 14,
            padding: 2,
            lineHeight: 1,
          }}
          aria-label="Open settings"
        >
          ⚙
        </button>
      )}
    </div>
  );
}
