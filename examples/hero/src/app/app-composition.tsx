import type { ToolcraftAppComposition } from "@/toolcraft/runtime/react";

import { appSchema } from "./app-schema";
import { handleHeroPanelAction } from "./hero-panel-actions";
import { HeroNativePreview } from "./hero-native-preview";
import { HERO_PREVIEW_SCENE_BOUNDS } from "./hero-preview-protocol";

export const appComposition: ToolcraftAppComposition = {
  canvasContent: <HeroNativePreview />,
  onPanelAction: handleHeroPanelAction,
  renderDefaultCanvasMedia: false,
  sceneBoundsProvider: () => [HERO_PREVIEW_SCENE_BOUNDS],
  schema: appSchema,
};
