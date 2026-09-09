import { defineToolcraft } from "@/toolcraft/runtime";

import { frozenControlSections } from "./frozen/frozen-controls";
import {
  frozenDefaultMediaAssets,
  frozenDefaultSceneValues,
} from "./frozen/frozen-default-scene";

export const appSchema = defineToolcraft({
  canvas: {
    enabled: true,
    renderScale: {
      defaultValue: frozenDefaultSceneValues["canvas.renderScale"],
      enabled: true,
      max: 2,
      min: 1,
      step: 0.5,
    },
    size: { height: 1080, unit: "px", width: 1920 },
    sizing: { mode: "editable-output" },
    upload: true,
  },
  media: {
    defaultAssets: frozenDefaultMediaAssets,
  },
  panels: {
    controls: {
      sections: frozenControlSections,
      title: "Frozen Matter",
    },
  },
  persistence: {
    include: ["values", "canvas", "panels", "media"],
    key: "toolcraft:frozen-matter:state:v5",
    storage: "localStorage",
    version: 5,
  },
  settingsTransfer: "auto",
  toolbar: {
    history: true,
    radar: true,
    theme: true,
    zoom: true,
  },
});
