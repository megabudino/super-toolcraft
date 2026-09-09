import type {
  DitherEffectStyle,
  DitherRenderDimensions,
  DitherRenderMode,
  DitherRenderSettings,
} from "../dither-types";

export type DitherEffectPlan = {
  contextScaleX: number;
  contextScaleY: number;
  outputHeight: number;
  outputWidth: number;
  renderSize: number;
  sampleHeight: number;
  sampleWidth: number;
};

export type DitherEffectPlanInput = DitherRenderDimensions & {
  renderMode: DitherRenderMode;
  settings: DitherRenderSettings;
};

export type DitherEffectRenderContext = {
  context: CanvasRenderingContext2D;
  cssHeight: number;
  cssWidth: number;
  outputHeight: number;
  outputWidth: number;
  renderMode: DitherRenderMode;
  scaleX: number;
  scaleY: number;
  settings: DitherRenderSettings;
  snapshot: ImageData;
};

export type DitherEffectDefinition = {
  createPlan: (input: DitherEffectPlanInput) => DitherEffectPlan;
  id: Exclude<DitherEffectStyle, "none">;
  previewPhaseCount?: number;
  render: (context: DitherEffectRenderContext) => void;
  renderPreviewPhase?: (
    context: DitherEffectRenderContext,
    phaseIndex: number,
    phaseCount: number,
  ) => void;
};
