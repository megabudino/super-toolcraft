import { defineToolcraft } from "@/toolcraft/runtime";

import { appIdentity } from "./app-identity";
import { backgroundSection } from "./domain/background";
import { cameraSection } from "./domain/camera";
import { hazeSection } from "./domain/haze";
import { lightSection } from "./domain/light";
import { masksSection } from "./domain/masks";
import { materialSection } from "./domain/material";
import { FLOW_DURATION_SECONDS, flowSection } from "./domain/flow";
import { postSection } from "./domain/post";
import { presetsSection } from "./domain/presets";
import { ribSection } from "./domain/rib";
import { skySection } from "./domain/sky";
import { structureSection } from "./domain/structure";
import { wavePlacementSection } from "./domain/wave-placement";
import { heroPreviewControlSections } from "./hero-preview-controls";

export const appSchema = defineToolcraft({
  canvas: {
    enabled: true,
    renderScale: { step: 0.25 },
    size: { height: 1200, unit: "px", width: 2400 },
    sizing: {
      mode: "editable-output",
    },
    upload: true,
  },
  identity: appIdentity,
  persistence: {
    // The previously published background-only editor used a different document.
    // Keep its saved workspace untouched instead of loading it into this hero.
    key: "toolcraft:work-with-masks-hero:state:v2",
    version: 2,
    storage: "localStorage",
    include: [],
  },
  panels: {
    controls: {
      sections: [
        ...heroPreviewControlSections,
        wavePlacementSection,
        presetsSection,
        backgroundSection,
        structureSection,
        ribSection,
        cameraSection,
        lightSection,
        skySection,
        materialSection,
        postSection,
        hazeSection,
        flowSection,
        masksSection,
      ],
      title: "Controls",
    },
    timeline: {
      defaultDurationSeconds: FLOW_DURATION_SECONDS,
      enabled: true,
      mode: "playback",
    },
  },
  toolbar: {
    history: true,
    radar: true,
    theme: true,
    zoom: true,
  },
});
