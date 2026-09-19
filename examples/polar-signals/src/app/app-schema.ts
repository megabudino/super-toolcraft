import { canvasEditingModule, defineToolcraft, imageExportModule } from "@/toolcraft/runtime";
import { backgroundControls, flameControls } from "../flame/flame-controls";

import appDefaults from "./app-defaults.json" with { type: "json" };
import { appIdentity } from "./app-identity";

export const appSchema = defineToolcraft({
  defaults: appDefaults,
  base: {
    canvas: {
      enabled: true,
      upload: false,
      draggable: true,
      size: { width: 1920, height: 1080, unit: "px" },
      sizing: { defaultMode: "infinite", mode: "editable-output" },
      renderScale: true,
    },
    identity: appIdentity,
    panels: {
      controls: {
        sections: [
          { id: "runtime.setup", title: "Settings", controls: backgroundControls },
          { id: "flame", title: "Flame Graph", controls: flameControls },
          { id: "flame-actions", controls: { regenerate: {
            type: "panelActions", target: "flame.regenerate", label: false,
            applicability: { mode: "always" },
            actions: [{ label: "Regenerate", value: "regenerate", variant: "secondary" }],
          } } },
        ],
        title: "Controls",
      },
    },
    toolbar: {
      history: true,
      radar: true,
      theme: true,
      zoom: true,
    },
    persistence: { additionalValueTargets: ["flame.envelopes", "flame.seed"] },
    settingsTransfer: { additionalValueTargets: ["flame.envelopes", "flame.seed"] },
  },
  modules: [canvasEditingModule(), imageExportModule()],
});
