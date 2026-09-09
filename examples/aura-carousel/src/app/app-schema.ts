import { defineToolcraft } from "@/toolcraft/runtime";

import { appIdentity } from "./app-identity";
import { dispersionCarouselControlSections } from "./dispersion-carousel/dispersion-carousel-schema-sections";
import { DISPERSION_CAROUSEL_DEFAULT_CANVAS_SIZE } from "./dispersion-carousel/dispersion-carousel-values";

export const appSchema = defineToolcraft({
  canvas: {
    enabled: true,
    renderScale: true,
    size: {
      height: DISPERSION_CAROUSEL_DEFAULT_CANVAS_SIZE.height,
      unit: "px",
      width: DISPERSION_CAROUSEL_DEFAULT_CANVAS_SIZE.width,
    },
    sizing: { mode: "editable-output" },
    upload: false,
  },
  export: {
    png: { background: "include" },
  },
  identity: appIdentity,
  panels: {
    controls: {
      sections: dispersionCarouselControlSections,
      title: "Aura Carousel",
    },
  },
  persistence: {
    additionalValueTargets: ["carousel.scroll"],
    include: ["values", "canvas", "panels"],
    key: "toolcraft:aura-carousel:state:v8",
    storage: "localStorage",
    version: 8,
  },
  settingsTransfer: {
    additionalValueTargets: ["carousel.scroll"],
    appId: "aura-carousel",
    enabled: "auto",
    fileName: "aura-carousel-settings.json",
  },
  toolbar: {
    history: true,
    radar: true,
    theme: true,
    zoom: true,
  },
});
