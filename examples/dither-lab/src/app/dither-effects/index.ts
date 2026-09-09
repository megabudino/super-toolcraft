import type { DitherEffectStyle } from "../dither-types";
import { renderCharacters } from "./ascii";
import { renderBayer, renderDitherBlend, renderNoiseDither } from "./dither";
import {
  renderCrossStitch,
  renderDots,
  renderDotsPreviewPhase,
  renderHalftone,
  renderHexGrid,
  renderLattice,
  renderLed,
  renderLego,
  renderPixelArt,
  renderVoxel,
} from "./grid";
import { createCharacterPlan, createDitherPlan, createGridPlan } from "./plans";
import type { DitherEffectDefinition } from "./types";

const effectDefinitions: Record<
  Exclude<DitherEffectStyle, "none">,
  DitherEffectDefinition
> = {
  bayer: { createPlan: createDitherPlan, id: "bayer", render: renderBayer },
  characters: {
    createPlan: createCharacterPlan,
    id: "characters",
    render: renderCharacters,
  },
  "cross-stitch": {
    createPlan: createGridPlan,
    id: "cross-stitch",
    render: renderCrossStitch,
  },
  "dither-blend": {
    createPlan: createDitherPlan,
    id: "dither-blend",
    render: renderDitherBlend,
  },
  dots: {
    createPlan: createGridPlan,
    id: "dots",
    previewPhaseCount: 2,
    render: renderDots,
    renderPreviewPhase: renderDotsPreviewPhase,
  },
  "hex-grid": {
    createPlan: createGridPlan,
    id: "hex-grid",
    render: renderHexGrid,
  },
  halftone: {
    createPlan: createGridPlan,
    id: "halftone",
    render: renderHalftone,
  },
  lattice: {
    createPlan: createGridPlan,
    id: "lattice",
    render: renderLattice,
  },
  led: { createPlan: createGridPlan, id: "led", render: renderLed },
  lego: { createPlan: createGridPlan, id: "lego", render: renderLego },
  "noise-dither": {
    createPlan: createDitherPlan,
    id: "noise-dither",
    render: renderNoiseDither,
  },
  "pixel-art": {
    createPlan: createGridPlan,
    id: "pixel-art",
    render: renderPixelArt,
  },
  voxel: { createPlan: createGridPlan, id: "voxel", render: renderVoxel },
};

export function getDitherEffectDefinition(
  style: DitherEffectStyle,
): DitherEffectDefinition | null {
  return style === "none" ? null : effectDefinitions[style];
}

export type {
  DitherEffectDefinition,
  DitherEffectPlan,
  DitherEffectRenderContext,
} from "./types";
