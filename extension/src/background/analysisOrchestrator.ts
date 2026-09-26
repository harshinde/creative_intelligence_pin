/**
 * Analysis orchestrator for the extension background service worker.
 * Adapted from backend/src/services/analysisService.ts.
 *
 * Key differences from the backend version:
 * 1. All store reads/writes use async profileStore functions (chrome.storage.local).
 * 2. Stage functions accept `ai: GoogleGenAI` as an explicit parameter.
 * 3. `crypto.randomUUID()` is used (no uuid package).
 * 4. The chrome.alarms keepalive is managed in background/index.ts, not here.
 */

import { analyzeImage, generateText } from './analyze';
import type { GoogleGenAI } from './geminiClient';
import { getProfile, getFileMeta, updateProfile } from './profileStore';
import { SUBJECT_MOOD_PROMPT } from './prompts/subjectMood';
import { COLOR_PROMPT } from './prompts/color';
import { COMPOSITION_PROMPT } from './prompts/composition';
import { VISUAL_STYLE_PROMPT } from './prompts/visualStyle';
import { TYPOGRAPHY_PROMPT } from './prompts/typography';
import { GRAPHIC_ELEMENTS_PROMPT } from './prompts/graphicElements';
import { buildDesignSummaryPrompt } from './prompts/designSummary';
import type {
  SubjectProfile,
  MoodProfile,
  ColorProfile,
  CompositionProfile,
  VisualStyleProfile,
  TypographyProfile,
  GraphicElementsProfile,
  ConfidenceLevel,
} from '@shared/types';

// ─────────────────────────────────────────
// RESULT INTERFACES
// ─────────────────────────────────────────

interface SubjectMoodResult {
  subject: SubjectProfile;
  mood: MoodProfile;
  confidence: {
    subject: ConfidenceLevel;
    mood: ConfidenceLevel;
    overall: ConfidenceLevel;
  };
}

interface ColorResult {
  color: ColorProfile;
  confidence: { color: ConfidenceLevel };
}

interface CompositionResult {
  composition: CompositionProfile;
  confidence: { composition: ConfidenceLevel };
}

interface VisualStyleResult {
  visualStyle: VisualStyleProfile;
  confidence: { visualStyle: ConfidenceLevel };
}

interface TypographyResult {
  typography: TypographyProfile | null;
  confidence: { typography: ConfidenceLevel | null };
}

interface GraphicElementsResult {
  graphicElements: GraphicElementsProfile;
  confidence: { graphicElements: ConfidenceLevel };
}

// ─────────────────────────────────────────
// ORCHESTRATOR
// ─────────────────────────────────────────

type StageRunner = (profileId: string, ai: GoogleGenAI) => Promise<void>;

const STAGES: Array<{ name: string; fn: StageRunner }> = [
  { name: 'subjectMood', fn: runSubjectMoodStage },
  { name: 'color', fn: runColorStage },
  { name: 'composition', fn: runCompositionStage },
  { name: 'visualStyle', fn: runVisualStyleStage },
  { name: 'typography', fn: runTypographyStage },
  { name: 'graphicElements', fn: runGraphicElementsStage },
  { name: 'designSummary', fn: runDesignSummaryStage },
];

/** Delay between Gemini API calls to respect rate limits (ms). */
const STAGE_DELAY_MS = 2000;
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Run all analysis stages sequentially.
 * Each stage is isolated — a failure in one does not block the next.
 * Writes results to chrome.storage.local after each stage so the side panel
 * receives live updates via chrome.storage.onChanged.
 *
 * @param enabledBlocks — optional list of stage names to run. If omitted, all stages run.
 *   Design summary always runs if at least one other block succeeded.
 */
export async function runFullAnalysis(
  profileId: string,
  ai: GoogleGenAI,
  enabledBlocks?: string[],
): Promise<void> {
  const profile = await getProfile(profileId);
  if (!profile) {
    console.error(`[analysis] No profile found for ${profileId}`);
    return;
  }

  await updateProfile(profileId, { analysisStatus: 'processing', failedStages: [] });
  console.log(`[analysis] Processing ${profileId}...`);

  // Filter stages if user selected specific blocks (designSummary always included)
  const stagesToRun = enabledBlocks
    ? STAGES.filter((s) => enabledBlocks.includes(s.name) || s.name === 'designSummary')
    : STAGES;

  const failedStages: string[] = [];

  for (let i = 0; i < stagesToRun.length; i++) {
    const stage = stagesToRun[i];

    // Delay between stages to avoid Gemini API rate limits
    if (i > 0) await delay(STAGE_DELAY_MS);

    try {
      await stage.fn(profileId, ai);
      console.log(`[analysis] ${stage.name} complete for ${profileId}`);
    } catch (err) {
      console.error(`[analysis] ${stage.name} failed for ${profileId}:`, err);
      failedStages.push(stage.name);
      await updateProfile(profileId, { failedStages });
    }
  }

  // Determine final status
  const finalProfile = await getProfile(profileId);
  const hasAnyData =
    finalProfile?.subject ||
    finalProfile?.color ||
    finalProfile?.composition ||
    finalProfile?.visualStyle ||
    finalProfile?.typography !== undefined ||
    finalProfile?.graphicElements ||
    finalProfile?.designSummary;

  const analysisStatus = hasAnyData ? 'complete' : 'failed';
  await updateProfile(profileId, { analysisStatus, failedStages });
  console.log(`[analysis] ${analysisStatus === 'complete' ? 'Complete' : 'Failed'} for ${profileId}`);
}

/**
 * Retry only the stages that previously failed for a profile.
 */
export async function retryFailedStages(profileId: string, ai: GoogleGenAI): Promise<void> {
  const profile = await getProfile(profileId);
  if (!profile) {
    console.error(`[analysis] No profile found for ${profileId}`);
    return;
  }

  const failedNames = profile.failedStages ?? [];
  if (failedNames.length === 0) {
    console.log(`[analysis] No failed stages to retry for ${profileId}`);
    return;
  }

  const stagesToRetry = STAGES.filter((s) => failedNames.includes(s.name));
  if (stagesToRetry.length === 0) return;

  await updateProfile(profileId, { analysisStatus: 'processing', failedStages: [] });
  console.log(
    `[analysis] Retrying ${stagesToRetry.map((s) => s.name).join(', ')} for ${profileId}...`,
  );

  const stillFailed: string[] = [];

  for (let i = 0; i < stagesToRetry.length; i++) {
    const stage = stagesToRetry[i];

    if (i > 0) await delay(STAGE_DELAY_MS);

    try {
      await stage.fn(profileId, ai);
      console.log(`[analysis] ${stage.name} retry complete for ${profileId}`);
    } catch (err) {
      console.error(`[analysis] ${stage.name} retry failed for ${profileId}:`, err);
      stillFailed.push(stage.name);
    }
  }

  const finalProfile = await getProfile(profileId);
  const hasAnyData =
    finalProfile?.subject ||
    finalProfile?.color ||
    finalProfile?.composition ||
    finalProfile?.visualStyle ||
    finalProfile?.typography !== undefined ||
    finalProfile?.graphicElements ||
    finalProfile?.designSummary;

  const analysisStatus = hasAnyData ? 'complete' : 'failed';
  await updateProfile(profileId, { analysisStatus, failedStages: stillFailed });
  console.log(`[analysis] Retry ${analysisStatus} for ${profileId}`);
}

// ─────────────────────────────────────────
// STAGE: SUBJECT & MOOD
// ─────────────────────────────────────────

export async function runSubjectMoodStage(profileId: string, ai: GoogleGenAI): Promise<void> {
  const [profile, metadata] = await Promise.all([getProfile(profileId), getFileMeta(profileId)]);
  if (!profile || !metadata) throw new Error('Missing profile or metadata');

  const raw = await analyzeImage({
    fileUri: profile.imageUri!,
    mimeType: metadata.mimeType,
    prompt: SUBJECT_MOOD_PROMPT,
    ai,
  });

  const parsed = JSON.parse(raw) as SubjectMoodResult;
  validateSubjectMoodResult(parsed);

  await updateProfile(profileId, {
    subject: parsed.subject,
    mood: parsed.mood,
    confidence: {
      subject: parsed.confidence.subject,
      mood: parsed.confidence.mood,
      overall: parsed.confidence.overall,
    } as any,
  });
}

// ─────────────────────────────────────────
// STAGE: COLOR
// ─────────────────────────────────────────

export async function runColorStage(profileId: string, ai: GoogleGenAI): Promise<void> {
  const [profile, metadata] = await Promise.all([getProfile(profileId), getFileMeta(profileId)]);
  if (!profile || !metadata) throw new Error('Missing profile or metadata');

  const raw = await analyzeImage({
    fileUri: profile.imageUri!,
    mimeType: metadata.mimeType,
    prompt: COLOR_PROMPT,
    ai,
  });

  const parsed = JSON.parse(raw) as ColorResult;
  validateColorResult(parsed);

  await updateProfile(profileId, {
    color: parsed.color,
    confidence: { color: parsed.confidence.color } as any,
  });
}

// ─────────────────────────────────────────
// STAGE: COMPOSITION
// ─────────────────────────────────────────

export async function runCompositionStage(profileId: string, ai: GoogleGenAI): Promise<void> {
  const [profile, metadata] = await Promise.all([getProfile(profileId), getFileMeta(profileId)]);
  if (!profile || !metadata) throw new Error('Missing profile or metadata');

  const raw = await analyzeImage({
    fileUri: profile.imageUri!,
    mimeType: metadata.mimeType,
    prompt: COMPOSITION_PROMPT,
    ai,
  });

  const parsed = JSON.parse(raw) as CompositionResult;
  validateCompositionResult(parsed);

  await updateProfile(profileId, {
    composition: parsed.composition,
    confidence: { composition: parsed.confidence.composition } as any,
  });
}

// ─────────────────────────────────────────
// STAGE: VISUAL STYLE
// ─────────────────────────────────────────

export async function runVisualStyleStage(profileId: string, ai: GoogleGenAI): Promise<void> {
  const [profile, metadata] = await Promise.all([getProfile(profileId), getFileMeta(profileId)]);
  if (!profile || !metadata) throw new Error('Missing profile or metadata');

  const raw = await analyzeImage({
    fileUri: profile.imageUri!,
    mimeType: metadata.mimeType,
    prompt: VISUAL_STYLE_PROMPT,
    ai,
  });

  const parsed = JSON.parse(raw) as VisualStyleResult;
  validateVisualStyleResult(parsed);

  await updateProfile(profileId, {
    visualStyle: parsed.visualStyle,
    confidence: { visualStyle: parsed.confidence.visualStyle } as any,
  });
}

// ─────────────────────────────────────────
// STAGE: TYPOGRAPHY
// ─────────────────────────────────────────

export async function runTypographyStage(profileId: string, ai: GoogleGenAI): Promise<void> {
  const [profile, metadata] = await Promise.all([getProfile(profileId), getFileMeta(profileId)]);
  if (!profile || !metadata) throw new Error('Missing profile or metadata');

  const raw = await analyzeImage({
    fileUri: profile.imageUri!,
    mimeType: metadata.mimeType,
    prompt: TYPOGRAPHY_PROMPT,
    ai,
  });

  const parsed = JSON.parse(raw) as TypographyResult;

  // null means no text detected — valid result, not a failure
  if (parsed.typography === null) {
    await updateProfile(profileId, {
      typography: null,
      confidence: { typography: null } as any,
    });
    return;
  }

  validateTypographyResult(parsed);

  await updateProfile(profileId, {
    typography: parsed.typography,
    confidence: { typography: parsed.confidence.typography } as any,
  });
}

// ─────────────────────────────────────────
// STAGE: GRAPHIC ELEMENTS
// ─────────────────────────────────────────

export async function runGraphicElementsStage(
  profileId: string,
  ai: GoogleGenAI,
): Promise<void> {
  const [profile, metadata] = await Promise.all([getProfile(profileId), getFileMeta(profileId)]);
  if (!profile || !metadata) throw new Error('Missing profile or metadata');

  const raw = await analyzeImage({
    fileUri: profile.imageUri!,
    mimeType: metadata.mimeType,
    prompt: GRAPHIC_ELEMENTS_PROMPT,
    ai,
  });

  const parsed = JSON.parse(raw) as GraphicElementsResult;
  validateGraphicElementsResult(parsed);

  await updateProfile(profileId, {
    graphicElements: parsed.graphicElements,
    confidence: { graphicElements: parsed.confidence.graphicElements } as any,
  });
}

// ─────────────────────────────────────────
// STAGE: DESIGN SUMMARY
// ─────────────────────────────────────────

export async function runDesignSummaryStage(profileId: string, ai: GoogleGenAI): Promise<void> {
  const profile = await getProfile(profileId);
  if (!profile) throw new Error('Missing profile');

  // Only generate summary if at least one analysis block has data
  const hasData =
    profile.subject ||
    profile.color ||
    profile.composition ||
    profile.visualStyle ||
    profile.typography !== undefined ||
    profile.graphicElements;
  if (!hasData) throw new Error('No analysis data to summarize');

  const prompt = buildDesignSummaryPrompt(profile);
  const raw = await generateText(prompt, ai);
  const parsed = JSON.parse(raw) as { designSummary: string };

  if (!parsed.designSummary || typeof parsed.designSummary !== 'string') {
    throw new Error('Invalid designSummary: must be a non-empty string');
  }

  await updateProfile(profileId, { designSummary: parsed.designSummary });
}

// ─────────────────────────────────────────
// VALIDATION (identical to backend)
// ─────────────────────────────────────────

const VALID_CONFIDENCE = new Set(['high', 'medium', 'low']);
const VALID_NARRATIVE = new Set(['storytelling', 'statement', 'decorative', 'functional']);
const VALID_ENERGY = new Set(['low', 'medium', 'high']);
const VALID_FORMALITY = new Set(['formal', 'semi-formal', 'casual']);
const VALID_COLOR_ROLE = new Set(['background', 'foreground', 'accent', 'neutral', 'decorative']);
const VALID_TEMPERATURE = new Set(['warm', 'cool', 'neutral']);
const VALID_SATURATION = new Set(['muted', 'vibrant', 'pastel', 'earthy']);
const VALID_TONAL_RANGE = new Set(['high_key', 'low_key', 'full_range', 'mid_tone']);
const VALID_CONTRAST = new Set(['high', 'medium', 'soft']);
const VALID_ICON_STYLE = new Set(['outlined', 'filled', 'duotone', 'hand-drawn', '3d', 'emoji', 'flat']);
const VALID_ICON_WEIGHT = new Set(['thin', 'regular', 'bold']);
const VALID_CORNER_LANGUAGE = new Set(['sharp', 'rounded', 'mixed']);
const VALID_FUNCTIONAL_VS_DECORATIVE = new Set(['mostly-functional', 'mostly-decorative', 'balanced']);
const VALID_FONT_CLASSIFICATION = new Set(['serif', 'sans-serif', 'display', 'slab', 'script', 'monospace', 'variable', 'handwritten']);
const VALID_SPACING_FEEL = new Set(['tight', 'normal', 'airy']);
const VALID_MEDIUM = new Set(['photography', 'illustration', '3d_render', 'mixed_media', 'collage', 'ui_screenshot', 'data_visualization', 'typographic']);
const VALID_AESTHETIC_MOVEMENT = new Set(['Bauhaus', 'Swiss International', 'Neo-Brutalist', 'Minimalist', 'Maximalist', 'Memphis', 'Y2K', 'Japandi', 'Dark Academia', 'Solarpunk', 'Editorial', 'Corporate Clean', 'Cyberpunk', 'Cottagecore', 'Flat Design', 'Skeuomorphic', 'Glassmorphism', 'Art Deco', 'Psychedelic', 'Retro Futurism', 'Organic Modern', 'Streetwear']);
const VALID_SYMMETRY = new Set(['symmetric', 'asymmetric', 'radial']);
const VALID_NEGATIVE_SPACE = new Set(['low', 'medium', 'high']);
const VALID_VISUAL_WEIGHT = new Set(['primary', 'secondary', 'tertiary']);
const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

function validateSubjectMoodResult(result: SubjectMoodResult): void {
  if (!result.subject || typeof result.subject.primarySubject !== 'string')
    throw new Error('Invalid subject: missing primarySubject');
  if (!result.mood || typeof result.mood.primary !== 'string')
    throw new Error('Invalid mood: missing primary');
  if (result.subject.narrativeQuality && !VALID_NARRATIVE.has(result.subject.narrativeQuality))
    throw new Error(`Invalid narrativeQuality: ${result.subject.narrativeQuality}`);
  if (!VALID_ENERGY.has(result.mood.energyLevel))
    throw new Error(`Invalid energyLevel: ${result.mood.energyLevel}`);
  if (!VALID_FORMALITY.has(result.mood.formality))
    throw new Error(`Invalid formality: ${result.mood.formality}`);
  if (
    !VALID_CONFIDENCE.has(result.confidence.subject) ||
    !VALID_CONFIDENCE.has(result.confidence.mood) ||
    !VALID_CONFIDENCE.has(result.confidence.overall)
  )
    throw new Error('Invalid confidence levels');
}

function validateColorResult(result: ColorResult): void {
  if (!result.color) throw new Error('Missing color profile');
  const { palette, harmony, temperature, saturationProfile, tonalRange, contrastLevel, emotionMapping } = result.color;
  if (!Array.isArray(palette) || palette.length === 0)
    throw new Error('Invalid palette: must be a non-empty array');
  for (const swatch of palette) {
    if (!HEX_REGEX.test(swatch.hex)) throw new Error(`Invalid hex value: ${swatch.hex}`);
    if (!VALID_COLOR_ROLE.has(swatch.role)) throw new Error(`Invalid color role: ${swatch.role}`);
  }
  if (!harmony || typeof harmony !== 'string') throw new Error('Missing harmony');
  if (!VALID_TEMPERATURE.has(temperature)) throw new Error(`Invalid temperature: ${temperature}`);
  if (!VALID_SATURATION.has(saturationProfile)) throw new Error(`Invalid saturationProfile: ${saturationProfile}`);
  if (!VALID_TONAL_RANGE.has(tonalRange)) throw new Error(`Invalid tonalRange: ${tonalRange}`);
  if (!VALID_CONTRAST.has(contrastLevel)) throw new Error(`Invalid contrastLevel: ${contrastLevel}`);
  if (!Array.isArray(emotionMapping) || emotionMapping.length === 0)
    throw new Error('Invalid emotionMapping: must be a non-empty array');
  if (!VALID_CONFIDENCE.has(result.confidence.color))
    throw new Error('Invalid color confidence level');
}

function validateCompositionResult(result: CompositionResult): void {
  if (!result.composition) throw new Error('Missing composition profile');
  const { layoutArchetype, focalPoint, symmetry, negativeSpaceRatio, textToImageRatio, detectedRegions } = result.composition;
  if (!layoutArchetype || typeof layoutArchetype !== 'string') throw new Error('Missing layoutArchetype');
  if (!focalPoint || typeof focalPoint !== 'string') throw new Error('Missing focalPoint');
  if (!VALID_SYMMETRY.has(symmetry)) throw new Error(`Invalid symmetry: ${symmetry}`);
  if (!VALID_NEGATIVE_SPACE.has(negativeSpaceRatio)) throw new Error(`Invalid negativeSpaceRatio: ${negativeSpaceRatio}`);
  if (typeof textToImageRatio !== 'number' || textToImageRatio < 0 || textToImageRatio > 1)
    throw new Error(`Invalid textToImageRatio: ${textToImageRatio}`);
  if (!Array.isArray(detectedRegions) || detectedRegions.length === 0)
    throw new Error('Invalid detectedRegions: must be a non-empty array');
  for (const region of detectedRegions) {
    if (!region.label || typeof region.label !== 'string') throw new Error('Invalid region: missing label');
    if (!VALID_VISUAL_WEIGHT.has(region.visualWeight)) throw new Error(`Invalid visualWeight: ${region.visualWeight}`);
    const bb = region.boundingBox;
    if (!bb || typeof bb.yMin !== 'number' || typeof bb.xMin !== 'number' || typeof bb.yMax !== 'number' || typeof bb.xMax !== 'number')
      throw new Error('Invalid boundingBox: missing coordinates');
    if (bb.yMin >= bb.yMax || bb.xMin >= bb.xMax) throw new Error('Invalid boundingBox: min must be less than max');
  }
  if (!VALID_CONFIDENCE.has(result.confidence.composition))
    throw new Error('Invalid composition confidence level');
}

function validateVisualStyleResult(result: VisualStyleResult): void {
  if (!result.visualStyle) throw new Error('Missing visualStyle profile');
  const { medium, aestheticMovements, designEra, texturePresence } = result.visualStyle;
  if (!VALID_MEDIUM.has(medium)) throw new Error(`Invalid medium: ${medium}`);
  if (!Array.isArray(aestheticMovements) || aestheticMovements.length === 0)
    throw new Error('Invalid aestheticMovements: must be a non-empty array');
  for (const movement of aestheticMovements) {
    if (!VALID_AESTHETIC_MOVEMENT.has(movement)) throw new Error(`Invalid aestheticMovement: ${movement}`);
  }
  if (!designEra || typeof designEra !== 'string') throw new Error('Missing designEra');
  if (!Array.isArray(texturePresence)) throw new Error('Invalid texturePresence: must be an array');
  if (!VALID_CONFIDENCE.has(result.confidence.visualStyle))
    throw new Error('Invalid visualStyle confidence level');
}

function validateTypographyResult(result: TypographyResult): void {
  const typo = result.typography!;
  if (!Array.isArray(typo.fontsDetected) || typo.fontsDetected.length === 0)
    throw new Error('Invalid fontsDetected: must be a non-empty array');
  for (const font of typo.fontsDetected) {
    if (!VALID_FONT_CLASSIFICATION.has(font.classification))
      throw new Error(`Invalid font classification: ${font.classification}`);
    if (!font.role || typeof font.role !== 'string') throw new Error('Invalid font: missing role');
  }
  if (typeof typo.hierarchyLevels !== 'number' || typo.hierarchyLevels < 1)
    throw new Error(`Invalid hierarchyLevels: ${typo.hierarchyLevels}`);
  if (!typo.typographicTone || typeof typo.typographicTone !== 'string')
    throw new Error('Missing typographicTone');
  if (!VALID_SPACING_FEEL.has(typo.spacingFeel)) throw new Error(`Invalid spacingFeel: ${typo.spacingFeel}`);
  if (!Array.isArray(typo.treatments)) throw new Error('Invalid treatments: must be an array');
  if (!result.confidence.typography || !VALID_CONFIDENCE.has(result.confidence.typography))
    throw new Error('Invalid typography confidence level');
}

function validateGraphicElementsResult(result: GraphicElementsResult): void {
  if (!result.graphicElements) throw new Error('Missing graphicElements profile');
  const ge = result.graphicElements;
  if (ge.iconStyle !== null && !VALID_ICON_STYLE.has(ge.iconStyle))
    throw new Error(`Invalid iconStyle: ${ge.iconStyle}`);
  if (ge.iconWeight !== null && !VALID_ICON_WEIGHT.has(ge.iconWeight))
    throw new Error(`Invalid iconWeight: ${ge.iconWeight}`);
  if (ge.cornerLanguage !== null && !VALID_CORNER_LANGUAGE.has(ge.cornerLanguage))
    throw new Error(`Invalid cornerLanguage: ${ge.cornerLanguage}`);
  if (typeof ge.patternPresent !== 'boolean') throw new Error('Invalid patternPresent: must be a boolean');
  if (!Array.isArray(ge.decorativeDevices)) throw new Error('Invalid decorativeDevices: must be an array');
  if (ge.functionalVsDecorative !== null && !VALID_FUNCTIONAL_VS_DECORATIVE.has(ge.functionalVsDecorative))
    throw new Error(`Invalid functionalVsDecorative: ${ge.functionalVsDecorative}`);
  if (!VALID_CONFIDENCE.has(result.confidence.graphicElements))
    throw new Error('Invalid graphicElements confidence level');
}
