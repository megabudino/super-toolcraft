export type CreativeAppsKitDecisionArea =
  | "acceptance"
  | "canvas"
  | "controls"
  | "layers"
  | "panels"
  | "performance"
  | "persistence"
  | "reference-clone"
  | "renderer"
  | "runtime-shell"
  | "timeline"
  | "workflow";

export type CreativeAppsKitDecisionRuleLevel =
  | "default"
  | "escape-hatch"
  | "heuristic"
  | "invariant"
  | "recommendation";

export type CreativeAppsKitDecisionVerdict =
  | "keep-hard"
  | "keep-but-clarify"
  | "move-to-validator"
  | "relax-to-heuristic"
  | "remove-duplicate";

export type CreativeAppsKitDecisionEnforcement =
  | "acceptance-validator"
  | "browser-helper"
  | "cli-integrity-check"
  | "docs"
  | "performance-validator"
  | "runtime"
  | "schema-normalization"
  | "spec-checklist"
  | "starter-agents";

export type CreativeAppsKitDecisionRule = {
  area: CreativeAppsKitDecisionArea;
  currentConstraint: string;
  desiredBehavior: string;
  enforcement: readonly CreativeAppsKitDecisionEnforcement[];
  id: string;
  level: CreativeAppsKitDecisionRuleLevel;
  title: string;
  verdict: CreativeAppsKitDecisionVerdict;
};

export const CREATIVE_APPS_KIT_DECISION_CONTRACT = [
  {
    area: "runtime-shell",
    currentConstraint: "Apps must assemble through defineCreativeAppsKit and CreativeAppsKitApp.",
    desiredBehavior:
      "Generated apps use the Creative Apps Kit runtime shell and keep product-specific rendering inside supported extension points.",
    enforcement: ["cli-integrity-check", "starter-agents", "spec-checklist"],
    id: "runtime-shell-required",
    level: "invariant",
    title: "Creative Apps Kit runtime shell is required",
    verdict: "keep-hard",
  },
  {
    area: "canvas",
    currentConstraint:
      "canvasContent must not contain buttons, forms, CTAs, helper text, upload prompts, menus, or settings UI.",
    desiredBehavior:
      "Canvas renders only product result, source material, renderer output, and valid product editing handles.",
    enforcement: ["browser-helper", "starter-agents", "spec-checklist"],
    id: "canvas-no-app-ui",
    level: "invariant",
    title: "Canvas contains product output, not app UI",
    verdict: "move-to-validator",
  },
  {
    area: "canvas",
    currentConstraint:
      "The Creative Apps Kit canvas shell owns the visible workspace backing behind product output.",
    desiredBehavior:
      "Generated apps preserve the runtime canvas surface and do not replace, hide, or make the shell backing transparent when product renderers customize their own background.",
    enforcement: ["browser-helper", "starter-agents", "spec-checklist"],
    id: "canvas-surface-preserved",
    level: "invariant",
    title: "Canvas backing stays runtime-owned",
    verdict: "move-to-validator",
  },
  {
    area: "canvas",
    currentConstraint:
      "Product editing handles may live on the canvas when they manipulate visible product geometry.",
    desiredBehavior:
      "AI chooses canvas handles only for direct geometry or parameter manipulation and keeps handles tokenized, textless, export-excluded, and runtime-bound.",
    enforcement: ["browser-helper", "acceptance-validator", "spec-checklist"],
    id: "canvas-handle-placement",
    level: "heuristic",
    title: "Canvas handle placement is product-dependent",
    verdict: "keep-but-clarify",
  },
  {
    area: "panels",
    currentConstraint: "PanelHost owns drag, snap, and double-click reset behavior.",
    desiredBehavior:
      "Any rendered application panel preserves runtime panel mechanics and does not recreate panel dragging locally.",
    enforcement: ["runtime", "browser-helper", "starter-agents"],
    id: "panel-host-behavior",
    level: "invariant",
    title: "Panel mechanics stay runtime-owned",
    verdict: "keep-hard",
  },
  {
    area: "layers",
    currentConstraint:
      "Layers are optional and should appear only for multiple editable entities, grouping, visibility, selection, or reorder workflows.",
    desiredBehavior:
      "AI decides whether the product needs layers; single-layer apps do not render a layers panel.",
    enforcement: ["starter-agents", "spec-checklist"],
    id: "layers-enable-only-when-needed",
    level: "heuristic",
    title: "Layer enablement is product-dependent",
    verdict: "keep-but-clarify",
  },
  {
    area: "layers",
    currentConstraint:
      "Once layers are enabled, selection, visibility, reorder, grouping, media lifecycle, and selected-layer controls must work through the real LayersPanel UI.",
    desiredBehavior:
      "Layer-enabled apps prove real layer interactions and product output changes instead of dispatching layer commands directly in browser tests.",
    enforcement: ["acceptance-validator", "browser-helper", "performance-validator"],
    id: "layers-enabled-behavior",
    level: "invariant",
    title: "Enabled layers must fully work",
    verdict: "keep-hard",
  },
  {
    area: "timeline",
    currentConstraint:
      "Timeline is optional, but animated products must first classify animation intent as product transport, editable keyframes, custom reference timeline, or autonomous decorative output.",
    desiredBehavior:
      "AI writes an Animation Intent Inventory before choosing no timeline, playback, keyframes, or custom reference timeline; user-requested product animation defaults to playback unless explicitly justified as autonomous output.",
    enforcement: ["starter-agents", "spec-checklist"],
    id: "timeline-mode-choice",
    level: "heuristic",
    title: "Timeline mode is chosen from behavior",
    verdict: "keep-but-clarify",
  },
  {
    area: "timeline",
    currentConstraint:
      "Enabled timeline modes must control renderer time, pause, scrub, duration, loop, and keyframe evaluation where relevant.",
    desiredBehavior:
      "Playback and keyframe apps prove runtime timeline state controls visible and exported output, and renderer cycle duration follows state.timeline.durationSeconds.",
    enforcement: ["acceptance-validator", "browser-helper", "performance-validator"],
    id: "timeline-enabled-behavior",
    level: "invariant",
    title: "Enabled timelines must drive output",
    verdict: "keep-hard",
  },
  {
    area: "controls",
    currentConstraint:
      "Every visible schema control must bind to runtime state, reset from schema defaults, and have acceptance and browser coverage.",
    desiredBehavior:
      "Controls are not decorative; each visible control proves its product responsibility through runtime and output observables.",
    enforcement: ["acceptance-validator", "browser-helper"],
    id: "controls-product-coverage",
    level: "invariant",
    title: "Visible controls must affect the product",
    verdict: "keep-hard",
  },
  {
    area: "controls",
    currentConstraint:
      "Product-output apps expose final output delivery through sticky footer panelActions.",
    desiredBehavior:
      "Static products include Export PNG; animated products include Export Video and Export PNG. Copy can be secondary, but it does not replace export. Product apps expose Background and Include background controls; standard export helpers own runtime PNG transparency and retina dimensions, while live preview, workspace canvas backing, and video keep the background.",
    enforcement: ["acceptance-validator", "performance-validator", "browser-helper", "starter-agents"],
    id: "output-export-required",
    level: "invariant",
    title: "Product output always has export",
    verdict: "move-to-validator",
  },
  {
    area: "controls",
    currentConstraint:
      "Labels, color placement, section grouping, selector order, and inline density need product-aware decisions.",
    desiredBehavior:
      "Apps define a Control Section Inventory before schema authoring: every controls section has a product entity or workflow stage, related targets stay together, and sections are not named after UI component types.",
    enforcement: ["acceptance-validator", "schema-normalization", "docs", "starter-agents"],
    id: "controls-layout-heuristics",
    level: "heuristic",
    title: "Control layout remains product-aware",
    verdict: "keep-but-clarify",
  },
  {
    area: "renderer",
    currentConstraint:
      "Custom renderers must declare rendererTechnique and rendererTechnique.layers when product output uses semantic layers or mixed rendering.",
    desiredBehavior:
      "AI chooses rendering technology from product output semantics, fidelity, reference behavior, and performance, then proves that choice in typed config and browser tests.",
    enforcement: ["performance-validator", "browser-helper", "spec-checklist"],
    id: "renderer-technique-inventory",
    level: "default",
    title: "Renderer technique is a typed decision",
    verdict: "keep-but-clarify",
  },
  {
    area: "reference-clone",
    currentConstraint:
      "Reference-runtime-clone mode preserves the reference runtime as source of truth unless a redesign is explicit.",
    desiredBehavior:
      "Ported apps keep reference loops, mutable state, transport semantics, media lifecycle, and export behavior before Creative Apps Kit refinements.",
    enforcement: ["acceptance-validator", "browser-helper", "starter-agents"],
    id: "reference-clone-source-of-truth",
    level: "invariant",
    title: "Reference clone preserves behavior",
    verdict: "keep-hard",
  },
  {
    area: "acceptance",
    currentConstraint:
      "Acceptance coverage must prove product responsibility, not only typecheck, component existence, runtime mutation, or shader uniform presence.",
    desiredBehavior:
      "Generated apps fail when a visible entity is disconnected from runtime state, product output, export output, or command side effects.",
    enforcement: ["acceptance-validator", "browser-helper"],
    id: "acceptance-product-observable",
    level: "invariant",
    title: "Acceptance needs product observables",
    verdict: "keep-hard",
  },
  {
    area: "performance",
    currentConstraint:
      "Performance coverage currently asks every visible non-action control for a performance scenario.",
    desiredBehavior:
      "Heavy workload controls get min/default/max workload coverage; ordinary controls get lightweight responsiveness coverage so they cannot hang or break input. Animated previews suspend or coalesce non-essential animation work during canvas drag, pan, pinch, zoom, and radar/center interactions without changing user playback state. Major post-generation iterations that touch renderer workload, animation, canvas behavior, layers, timeline/keyframes, or broad control wiring must run the performance gate before completion. Browser performance tests read budgets from typed performance config and run sequentially for stable measurements.",
    enforcement: ["performance-validator", "browser-helper", "starter-agents"],
    id: "performance-coverage-levels",
    level: "invariant",
    title: "Performance coverage has workload and responsiveness levels",
    verdict: "keep-but-clarify",
  },
  {
    area: "persistence",
    currentConstraint:
      "Persistence policy must be deliberate; generated apps should not write runtime state to localStorage directly.",
    desiredBehavior:
      "AI states whether persistence exists, what is persisted, and how reset, import, clear, and new media affect stored state.",
    enforcement: ["starter-agents", "spec-checklist"],
    id: "persistence-policy-explicit",
    level: "default",
    title: "Persistence is explicit app policy",
    verdict: "keep-but-clarify",
  },
  {
    area: "workflow",
    currentConstraint:
      "Template app work must use brainstorming, writing-plans, systematic-debugging, and browser verification when the environment supports those skills.",
    desiredBehavior:
      "Workflow skills guide the generation process, while product implementation plans stay focused on app files, tests, build, and browser verification.",
    enforcement: ["starter-agents", "docs"],
    id: "workflow-required",
    level: "invariant",
    title: "Required workflow stays part of the contract",
    verdict: "remove-duplicate",
  },
] as const satisfies readonly CreativeAppsKitDecisionRule[];

export function getCreativeAppsKitDecisionRule(
  id: string,
): CreativeAppsKitDecisionRule | undefined {
  return CREATIVE_APPS_KIT_DECISION_CONTRACT.find((rule) => rule.id === id);
}

export function getCreativeAppsKitDecisionRulesByArea(
  area: CreativeAppsKitDecisionArea,
): CreativeAppsKitDecisionRule[] {
  return CREATIVE_APPS_KIT_DECISION_CONTRACT.filter((rule) => rule.area === area);
}
