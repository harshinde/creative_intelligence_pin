// Mappings from enumerated CreativeProfile values to 0–100 spectrum positions
// + a short human-readable description. Each mapping is grounded in
// shared/types/index.ts so the spectrum bars never get out of sync with the data.

import type {
  EnergyLevel,
  FormalityLevel,
  ColorTemperature,
  SaturationProfile,
  ContrastLevel,
  ConfidenceLevel,
} from '@shared/types';

export interface SpectrumValue {
  value: number; // 0–100
  description: string;
}

// ─── Mood ──────────────────────────────────────────────

export function energyToSpectrum(v: EnergyLevel): SpectrumValue {
  switch (v) {
    case 'low':
      return { value: 22, description: 'low' };
    case 'medium':
      return { value: 52, description: 'medium' };
    case 'high':
      return { value: 82, description: 'high' };
  }
}

export function formalityToSpectrum(v: FormalityLevel): SpectrumValue {
  switch (v) {
    case 'casual':
      return { value: 22, description: 'casual' };
    case 'semi-formal':
      return { value: 55, description: 'semi-formal' };
    case 'formal':
      return { value: 82, description: 'formal' };
  }
}

export type NarrativeQuality =
  | 'storytelling'
  | 'statement'
  | 'decorative'
  | 'functional';

export function narrativeToSpectrum(v: NarrativeQuality): SpectrumValue {
  switch (v) {
    case 'functional':
      return { value: 15, description: 'functional' };
    case 'decorative':
      return { value: 38, description: 'decorative' };
    case 'statement':
      return { value: 62, description: 'statement' };
    case 'storytelling':
      return { value: 85, description: 'storytelling' };
  }
}

// ─── Color / Palette ───────────────────────────────────

export function temperatureToSpectrum(v: ColorTemperature): SpectrumValue {
  switch (v) {
    case 'cool':
      return { value: 22, description: 'cool dominant' };
    case 'neutral':
      return { value: 50, description: 'neutral' };
    case 'warm':
      return { value: 82, description: 'warm dominant' };
  }
}

export function saturationToSpectrum(v: SaturationProfile): SpectrumValue {
  switch (v) {
    case 'muted':
      return { value: 22, description: 'desaturated' };
    case 'pastel':
      return { value: 42, description: 'pastel' };
    case 'earthy':
      return { value: 55, description: 'earthy' };
    case 'vibrant':
      return { value: 85, description: 'vibrant' };
  }
}

export function contrastToSpectrum(v: ContrastLevel): SpectrumValue {
  switch (v) {
    case 'soft':
      return { value: 22, description: 'soft' };
    case 'medium':
      return { value: 50, description: 'medium' };
    case 'high':
      return { value: 82, description: 'high' };
  }
}

// ─── Composition / Structure ───────────────────────────

export function negativeSpaceToSpectrum(
  v: 'low' | 'medium' | 'high',
): SpectrumValue {
  switch (v) {
    case 'low':
      return { value: 22, description: 'dense' };
    case 'medium':
      return { value: 52, description: 'balanced' };
    case 'high':
      return { value: 82, description: 'spacious' };
  }
}

export function textRatioToSpectrum(ratio: number): SpectrumValue {
  // ratio is already 0–1
  const value = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  let description: string;
  if (value < 8) description = 'almost none';
  else if (value < 25) description = 'some text';
  else if (value < 55) description = 'mixed';
  else description = 'text heavy';
  return { value, description };
}

export function depthToSpectrum(hasDepthLayers: boolean): SpectrumValue {
  return hasDepthLayers
    ? { value: 72, description: 'layered' }
    : { value: 28, description: 'flat' };
}

// ─── Confidence ────────────────────────────────────────

/** Maps a ConfidenceLevel to a 0–100 score used for the footer dots & percentage. */
export function confidenceToScore(level: ConfidenceLevel | null | undefined): number {
  if (!level) return 0;
  switch (level) {
    case 'high':
      return 90;
    case 'medium':
      return 65;
    case 'low':
      return 35;
  }
}

/** Number of filled dots (out of 5) for a confidence score. */
export function confidenceToDots(score: number): number {
  return Math.max(0, Math.min(5, Math.round(score / 20)));
}

/** Token color name for a confidence level, used for per-section indicators. */
export function confidenceLevelColor(
  level: ConfidenceLevel | null | undefined,
): 'success' | 'accent' | 'danger' | 'textFaint' {
  switch (level) {
    case 'high':
      return 'success';
    case 'medium':
      return 'accent';
    case 'low':
      return 'danger';
    default:
      return 'textFaint';
  }
}
