import type { ToolcraftControlSectionInventoryEntry, ToolcraftProductReadiness } from "../app/acceptance/types";
import { geometryTargets, paintTargets } from "./flame-defaults";

export const flameSectionInventory = [
  { id: "runtime.setup", title: "Settings", entityId: "background", entity: "Output background",
    targets: ["export.includeBackground", "appearance.background"],
    groupingReason: "One output background; runtime relocates this source pair into Settings.",
    finiteSelectors: [{ target: "export.includeBackground", role: "parameter", reason: "Controls background visibility and PNG alpha; the runtime keeps its color editable in both states." }] },
  { id: "flame", title: "Flame Graph", entityId: "flame", entity: "Procedural flame graph",
    targets: [...geometryTargets.slice(0, 4), ...paintTargets],
    groupingReason: "Nine visible controls define one graph and one coherent reset scope; geometry precedes rank-based shading. Fixed canvas guides stay on the canvas.",
    finiteSelectors: [{ target: "flame.depth", role: "parameter", reason: "Changes the number of segments per column without gating any other control." }, { target: "flame.layout", role: "parameter", reason: "Changes growth origin and visible canvas guides; every panel parameter remains meaningful in both layouts." }] },
  { id: "runtime.image-export", title: "Image Export", entityId: "image-export", entity: "Raster image output", targets: ["export.image.format", "export.image.resolution"], groupingReason: "Runtime-owned image format and resolution govern one exported artifact.", finiteSelectors: [
    { target: "export.image.format", role: "parameter", reason: "Selects PNG alpha support or opaque JPEG encoding." },
    { target: "export.image.resolution", role: "parameter", reason: "Selects the output long-edge pixel size." },
  ] },
] as const satisfies readonly ToolcraftControlSectionInventoryEntry[];

export const flameReadiness: ToolcraftProductReadiness = {
  mode: "product", productName: "Polar Signals Flame Graph",
  productSummary: "Procedural flame graph artwork with editable envelopes and HSL segment shading.",
  requestedBehavior: "Fully transfer the supplied flame-graph application to Toolcraft while preserving its logic and behavior.",
  exportIntent: { image: { mode: "toolcraft-default" }, svg: { mode: "not-requested" }, video: { mode: "not-requested" } },
  viewInteraction: { mode: "non-spatial", reason: "The output is a two-dimensional raster graph with vertical envelope handles, not a three-dimensional scene." },
  interactionOwnership: [
    { id: "envelope-drag", target: "controls.setValue", capability: "direct-spatial-edit", surface: "canvas",
      evidence: { source: "reference", detail: "FlameGraphCanvas.tsx and live original: seven Y-only points on each visible guide shape the column boundaries." },
      reason: "Dragging on the artwork preserves spatial correspondence and the source's vertical constraints.",
      alternative: { surface: "panel", reason: "A panel point editor would duplicate the same direct manipulation." } },
    ...[...geometryTargets.slice(0, 4), ...paintTargets].map(target => ({
      id: `${target}-property`, target, capability: "property-edit" as const, surface: "panel" as const,
      selectionScope: { mode: "global" as const },
      evidence: { source: "reference" as const, detail: "Sidebar.tsx edits the whole graph's structure and shading." },
      reason: "These are global graph parameters with no selected entity.",
      alternative: { surface: "canvas" as const, reason: "Persistent value controls would obscure the generated artwork." },
    })),
    { id: "regenerate", target: "flame.regenerate", capability: "command", surface: "panel",
      evidence: { source: "reference", detail: "Sidebar Regenerate requests a new random arrangement without changing parameters or guides." },
      reason: "Sticky action remains reachable while editing.", alternative: { surface: "canvas", reason: "Generation is a command and has no spatial location." } },
  ],
};
