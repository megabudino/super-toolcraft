import { defineToolcraft } from "@/toolcraft/runtime";

import { grassControlSections } from "./grass/grass-controls";

export const appSchema = defineToolcraft({
  canvas: {
    draggable: true,
    enabled: true,
    renderScale: {
      defaultValue: 2,
      enabled: true,
      max: 2,
      min: 1,
      step: 0.1,
    },
    size: { height: 1080, unit: "px", width: 1920 },
    sizing: { mode: "editable-output" },
    upload: false,
  },
  panels: {
    controls: {
      sections: grassControlSections,
      title: "Grass World",
    },
  },
  persistence: {
    include: ["values", "canvas", "media", "panels"],
    key: "toolcraft:grass-world:state:v22",
    storage: "localStorage",
    version: 22,
  },
  settingsTransfer: "auto",
  toolbar: {
    history: true,
    radar: true,
    theme: true,
    zoom: true,
  },
});
