import type { ToolcraftAppComposition } from "@/toolcraft/runtime/react";
import { getToolcraftFiniteArtboardRect } from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import { applyHeroPreset, getHeroPresetIdForAction } from "./domain/presets";
import { HeroWebsitePreview } from "./hero-website-preview";
import { heroRendererPipelineRegistration } from "./renderer/hero-pipeline";

export const appComposition: ToolcraftAppComposition = {
  canvasContent: <HeroWebsitePreview />,
  modelPresentation: { mode: "runtime" },
  onPanelAction: ({ action, dispatch }) => {
    const presetId = getHeroPresetIdForAction(action.value);
    if (presetId) applyHeroPreset(dispatch, presetId);
  },
  rendererPipelineRegistration: heroRendererPipelineRegistration,
  sceneBoundsProvider: ({ state }) => [getToolcraftFiniteArtboardRect(state.canvas.size)],
  schema: appSchema,
};
