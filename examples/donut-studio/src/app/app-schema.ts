import { defineToolcraft } from "@/toolcraft/runtime";

import { donutControlSections } from "./donut/donut-schema-sections";
import { DONUT_DEFAULTS } from "./donut/donut-values";

export const appSchema = defineToolcraft({
  canvas: {
    enabled: true,
    renderScale: {
      defaultValue: DONUT_DEFAULTS.renderScale,
      enabled: true,
      max: 2,
      min: 1,
      step: 0.25,
    },
    size: { height: 1080, unit: "px", width: 1920 },
    sizing: { mode: "editable-output" },
    upload: false,
  },
  export: {
    png: { background: "include" },
  },
  panels: {
    controls: {
      sections: donutControlSections,
      title: "Donut Studio",
    },
  },
  persistence: {
    include: ["values", "canvas", "panels"],
    key: "toolcraft:donut-studio:state:v2",
    storage: "localStorage",
    version: 2,
  },
  settingsTransfer: {
    appId: "donut-studio",
    enabled: "auto",
    fileName: "donut-studio-settings.json",
  },
  toolbar: {
    history: true,
    radar: true,
    theme: true,
    zoom: true,
  },
});
