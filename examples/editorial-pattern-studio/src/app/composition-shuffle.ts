import { editorialTemplateOptions } from "./editorial-templates";
import { createAccessiblePosterPalette } from "./palette-harmonies";
import { equationOptions, type EquationId } from "./pattern-equations";

export type CurrentComposition = {
  background: string;
  colorA: string;
  colorB: string;
  colorC: string;
  coupling: number;
  detailInk: string;
  headlineInk: string;
  phase: number;
  preset: EquationId;
  resonance: number;
  ruleInk: string;
  symmetry: number;
  templateId: string;
  warp: number;
};

export type CompositionShuffleValues = Readonly<Record<string, string | number | boolean>>;

export type CompositionShuffleOptions = {
  preserveColors?: boolean;
};

function createSeed(parts: readonly (number | string)[]): number {
  let hash = 2_166_136_261;
  for (const character of parts.join("|")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0 || 0x6d2b79f5;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function pickDifferent<T>(options: readonly T[], current: T, random: () => number): T {
  if (options.length < 2) {
    return options[0] ?? current;
  }
  const currentIndex = Math.max(0, options.indexOf(current));
  const offset = 1 + Math.floor(random() * (options.length - 1));
  return options[(currentIndex + offset) % options.length] ?? options[0] ?? current;
}

function pickDifferentInteger(
  min: number,
  max: number,
  current: number,
  random: () => number,
): number {
  const range = max - min + 1;
  const normalizedCurrent = Math.min(max, Math.max(min, Math.round(current)));
  const offset = 1 + Math.floor(random() * (range - 1));
  return min + ((normalizedCurrent - min + offset) % range);
}

export function createCompositionShuffle(
  current: CurrentComposition,
  options: CompositionShuffleOptions = {},
): CompositionShuffleValues {
  const seed = createSeed([
    current.templateId,
    current.preset,
    current.symmetry,
    current.resonance,
    current.coupling,
    current.phase,
    current.warp,
    current.background,
    current.headlineInk,
    current.detailInk,
    current.ruleInk,
    current.colorA,
    current.colorB,
    current.colorC,
  ]);
  const random = createRandom(seed);
  const template = pickDifferent(
    editorialTemplateOptions.map(({ value }) => value),
    current.templateId,
    random,
  );
  const preset = pickDifferent(
    equationOptions.map(({ value }) => value),
    current.preset,
    random,
  );
  const compositionValues: CompositionShuffleValues = {
    "editorial.customCopy": false,
    "editorial.template": template,
    "pattern.coupling": pickDifferentInteger(0, 100, current.coupling, random),
    "pattern.phase": pickDifferentInteger(-180, 180, current.phase, random),
    "pattern.preset": preset,
    "pattern.resonance": pickDifferentInteger(1, 16, current.resonance, random),
    "pattern.symmetry": pickDifferentInteger(2, 16, current.symmetry, random),
    "pattern.warp": pickDifferentInteger(0, 100, current.warp, random),
  };

  if (options.preserveColors) {
    return compositionValues;
  }

  const palette = createAccessiblePosterPalette(seed ^ 0xa511e9b3);
  return {
    "appearance.background": palette.background,
    "appearance.detail": palette.detail,
    "appearance.headline": palette.headline,
    "appearance.rule": palette.rule,
    ...compositionValues,
    "export.includeBackground": true,
    "pattern.colorA": palette.lines[0],
    "pattern.colorB": palette.lines[1],
    "pattern.colorC": palette.lines[2],
  };
}
