// /shared/types/index.ts
// Source of truth for all CreativeProfile types.
// Imported by both the Chrome extension and the backend.

// ─────────────────────────────────────────
// ENUMS & UNIONS
// ─────────────────────────────────────────

export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type EnergyLevel = 'low' | 'medium' | 'high';
export type FormalityLevel = 'formal' | 'semi-formal' | 'casual';
export type TonalRange = 'high_key' | 'low_key' | 'full_range' | 'mid_tone';
export type ColorTemperature = 'warm' | 'cool' | 'neutral';
export type SaturationProfile = 'muted' | 'vibrant' | 'pastel' | 'earthy';
export type ContrastLevel = 'high' | 'medium' | 'soft';
export type SymmetryType = 'symmetric' | 'asymmetric' | 'radial';
export type ColorRole = 'background' | 'foreground' | 'accent' | 'neutral' | 'decorative';
export type FontClassification = 'serif' | 'sans-serif' | 'display' | 'slab' | 'script' | 'monospace' | 'variable' | 'handwritten';
export type CornerLanguage = 'sharp' | 'rounded' | 'mixed';
export type IconStyle = 'outlined' | 'filled' | 'duotone' | 'hand-drawn' | '3d' | 'emoji' | 'flat';
export type VisualMedium = 'photography' | 'illustration' | '3d_render' | 'mixed_media' | 'collage' | 'ui_screenshot' | 'data_visualization' | 'typographic';
export type AnalysisStatus = 'pending' | 'processing' | 'complete' | 'failed';

export type AestheticMovement =
  | 'Bauhaus'
  | 'Swiss International'
  | 'Neo-Brutalist'
  | 'Minimalist'
  | 'Maximalist'
  | 'Memphis'
  | 'Y2K'
  | 'Japandi'
  | 'Dark Academia'
  | 'Solarpunk'
  | 'Editorial'
  | 'Corporate Clean'
  | 'Cyberpunk'
  | 'Cottagecore'
  | 'Flat Design'
  | 'Skeuomorphic'
  | 'Glassmorphism'
  | 'Art Deco'
  | 'Psychedelic'
  | 'Retro Futurism'
  | 'Organic Modern'
  | 'Streetwear';

// ─────────────────────────────────────────
// SUB-PROFILES
// ─────────────────────────────────────────

export interface SubjectProfile {
  primarySubject: string;           // e.g. "product shot", "portrait", "architectural detail"
  setting: string;                  // e.g. "studio, white background", "urban street, daylight"
  brandPresence: boolean;           // visible logo or wordmark detected
  brandName: string | null;         // inferred brand name if detectable
  culturalSignals: string[];        // e.g. ["Japanese", "Scandinavian", "West African"]
  narrativeQuality: 'storytelling' | 'statement' | 'decorative' | 'functional';
}

export interface MoodProfile {
  primary: string;                  // e.g. "serene", "bold", "melancholic"
  secondary: string[];              // supporting emotional undertones
  energyLevel: EnergyLevel;
  formality: FormalityLevel;
  sensoryAssociations: string[];    // e.g. ["warm", "rough", "quiet"]
  aspirational: boolean;            // true = aspirational/out-of-reach, false = accessible/relatable
}

export interface ColorSwatch {
  hex: string;
  role: ColorRole;
  name: string | null;              // human-readable color name e.g. "dusty rose"
}

export interface ColorProfile {
  palette: ColorSwatch[];           // ordered: dominant → supporting → accent → neutral
  harmony: string;                  // e.g. "analogous", "complementary", "triadic"
  temperature: ColorTemperature;
  saturationProfile: SaturationProfile;
  tonalRange: TonalRange;
  contrastLevel: ContrastLevel;
  emotionMapping: string[];         // psychological associations e.g. ["trust", "calm"]
  accessibilityNotes: string | null; // WCAG notes if text-on-color detected
}

export interface BoundingBox {
  yMin: number;   // normalized 0–1000
  xMin: number;
  yMax: number;
  xMax: number;
}

export interface LayoutRegion {
  label: string;                    // e.g. "headline_text", "hero_image", "cta_button"
  boundingBox: BoundingBox;
  visualWeight: 'primary' | 'secondary' | 'tertiary';
}

export interface CompositionProfile {
  layoutArchetype: string;          // e.g. "centered", "rule-of-thirds", "editorial-split"
  focalPoint: string;               // description of the dominant element
  symmetry: SymmetryType;
  negativeSpaceRatio: 'low' | 'medium' | 'high';
  hasDepthLayers: boolean;
  textToImageRatio: number;         // 0–1, proportion of canvas occupied by text
  detectedRegions: LayoutRegion[];  // from Gemini object detection
}

export interface VisualStyleProfile {
  medium: VisualMedium;
  illustrationStyle: string | null; // e.g. "flat vector", "hand-drawn", "isometric"
  photographyStyle: string | null;  // e.g. "studio", "lifestyle", "architectural"
  renderingStyle: string | null;    // e.g. "photorealistic", "clay render" (for 3D)
  aestheticMovements: AestheticMovement[];
  designEra: string;                // e.g. "mid-2010s flat design", "early 2020s neo-brutalism"
  texturePresence: string[];        // e.g. ["grain", "paper", "gloss"]
}

export interface DetectedFont {
  classification: FontClassification;
  likelyName: string | null;        // from Gemini inference
  confirmedName: string | null;     // from WhatTheFont API lookup
  role: string;                     // e.g. "headline", "body", "caption"
  weightDescription: string;        // e.g. "bold", "light", "regular"
}

export interface TypographyProfile {
  present: true;
  fontsDetected: DetectedFont[];
  hierarchyLevels: number;          // number of distinct type hierarchy levels
  typographicTone: string;          // e.g. "editorial", "corporate", "playful"
  treatments: string[];             // e.g. ["outlined", "gradient", "text-on-texture"]
  capitalizationStyle: string;      // e.g. "all-caps", "title-case", "lowercase-stylistic"
  spacingFeel: 'tight' | 'normal' | 'airy';
  textImageRelationship: string;    // e.g. "overlaid", "panel-separated", "integrated"
}

export interface GraphicElementsProfile {
  iconStyle: IconStyle | null;
  iconWeight: 'thin' | 'regular' | 'bold' | null;
  cornerLanguage: CornerLanguage | null;
  patternPresent: boolean;
  patternDescription: string | null;
  decorativeDevices: string[];      // e.g. ["badges", "rules", "underlines", "speech bubbles"]
  functionalVsDecorative: 'mostly-functional' | 'mostly-decorative' | 'balanced' | null;
}

// ─────────────────────────────────────────
// CONFIDENCE SCORES
// ─────────────────────────────────────────

export interface ConfidenceScores {
  subject: ConfidenceLevel;
  mood: ConfidenceLevel;
  color: ConfidenceLevel;
  composition: ConfidenceLevel;
  visualStyle: ConfidenceLevel;
  typography: ConfidenceLevel | null;
  graphicElements: ConfidenceLevel;
  overall: ConfidenceLevel;
}

/** Sections that carry an independent confidence level (excludes `overall`). */
export type ConfidenceSection =
  | 'subject'
  | 'mood'
  | 'color'
  | 'composition'
  | 'visualStyle'
  | 'typography'
  | 'graphicElements';

/**
 * Short human-readable notes explaining *why* a section was less than fully
 * confident. Only populated for medium/low sections; kept separate from
 * ConfidenceScores so the enum shape and merge logic stay untouched, and so
 * profiles stored before this field existed remain valid.
 */
export type ConfidenceNotes = Partial<Record<ConfidenceSection, string>>;

// ─────────────────────────────────────────
// ROOT CREATIVE PROFILE
// ─────────────────────────────────────────

export interface CreativeProfile {
  id: string;                       // uuid generated at capture time
  imageUri: string;                 // Gemini File API URI
  sourceThumbnailUrl: string;       // original image URL from the page
  sourceUrl: string;                // page URL the image was captured from
  capturedAt: string;               // ISO 8601 timestamp
  analysisStatus: AnalysisStatus;
  subject: SubjectProfile;
  mood: MoodProfile;
  color: ColorProfile;
  composition: CompositionProfile;
  visualStyle: VisualStyleProfile;
  typography: TypographyProfile | null;  // null if no text detected
  graphicElements: GraphicElementsProfile;
  designSummary: string;            // AI-generated one-paragraph design brief
  confidence: ConfidenceScores;
  confidenceNotes?: ConfidenceNotes; // why a section was medium/low confidence
  failedStages?: string[];          // names of stages that failed (for retry UI)
}

// ─────────────────────────────────────────
// API CONTRACTS
// ─────────────────────────────────────────

// POST /api/pin — sent from extension to backend
export interface PinRequest {
  imageUrl: string;
  sourceUrl: string;
  capturedAt: string;
}

// POST /api/pin — response from backend
export interface PinResponse {
  profileId: string;
  fileUri?: string;
  analysisStatus: AnalysisStatus;
  message: string;
}

// GET /api/profile/:id — response from backend (full profile)
export interface ProfileResponse {
  profile: CreativeProfile;
}

// GET /api/profile/:id — response during progressive loading
export interface PartialProfileResponse {
  profile: PartialCreativeProfile;
}

// Partial profile used during progressive loading in the popup
export type PartialCreativeProfile = Partial<CreativeProfile> & {
  id: string;
  analysisStatus: AnalysisStatus;
};
