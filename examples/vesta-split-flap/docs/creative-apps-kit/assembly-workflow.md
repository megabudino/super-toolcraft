# Assembly Workflow

Build the app from the local Creative Apps Kit runtime copy. Do not recreate controls, panels, toolbar, canvas behavior, timeline, layers, or app chrome by hand.

Use:

- `@/creative-apps-kit/template-runtime` for schema, contracts, state, commands, history, canvas, panels, timeline, layers, toolbar, and tests.
- `@/creative-apps-kit/template-runtime/react` for `CreativeAppsKitApp` and hooks.
- `@/creative-apps-kit/template-runtime/styles.css` for runtime styles.
- `@/creative-apps-kit/ui` for visual components.

Declare the product with `defineCreativeAppsKit`. Render through `CreativeAppsKitApp`.

```tsx
import { defineCreativeAppsKit } from "@/creative-apps-kit/template-runtime";
import { CreativeAppsKitApp } from "@/creative-apps-kit/template-runtime/react";

const appSchema = defineCreativeAppsKit({
  canvas: { enabled: true, sizing: { mode: "intrinsic-media" }, upload: true },
  panels: {},
  toolbar: { history: true, radar: true, theme: true, zoom: true },
});

export function AppHome() {
  return <CreativeAppsKitApp schema={appSchema} />;
}
```

Routes must render `CreativeAppsKitApp` directly. Do not compose `CreativeAppsKitRoot`, `CanvasShell`, `ControlsPanel`, `LayersPanel`, `TimelinePanel`, or `ToolbarPanel` by hand in product routes. If a runtime surface has a performance or behavior issue, fix the shared runtime contract instead of replacing the surface with app-level UI.

Read `appSchema.assembly` before adding custom JSX. It lists enabled surfaces, capabilities, commands, and runtime assumptions.

The starter baseline is deliberately neutral. It must not include demo controls, prompt fields, timeline, or layers until the product behavior requires them. Use tests and docs fixtures to exercise component coverage; do not expose those fixtures in the starting product schema.

Once the folder is a real product, switch `src/app/app-acceptance.ts` from neutral readiness to:

```ts
export const appProductReadiness = {
  mode: "product",
  productName: "Product name",
  productSummary: "What the app creates or edits.",
  requestedBehavior: "The user-facing behavior this app must implement.",
} as const;
```

Do not leave `mode: "starter"` in a renamed product folder or after adding product controls, `canvasContent`, timeline, layers, or acceptance rows.

## Control Sections

Before writing the schema, make a Control Section Inventory. Each section needs a product entity or workflow stage, included targets, and a reason for grouping. Do not group by control type.

Bad section titles: `Controls`, `Settings`, `Options`, `Sliders`, `Inputs`, `Buttons`, `Color`, `Colors`.

Good section titles name the thing being edited: `Background`, `Object`, `Square 1 (Right)`, `Token Pattern`, `Motion`, `Tone Mapping`, `Export`.

If a color, slider, input, or selector edits the same entity as nearby controls, keep it in that entity section. Split only when the product has a real workflow split and cover that decision in acceptance.

Before choosing the concrete control type for each target, check `component-rules.md` and `schema-reference.md`. Built-in compound controls must stay compound: for example, typography with font choice, weight, size, and text rhythm uses `fontPicker`, not a plain `select` plus separate inputs/sliders. The product renderer and acceptance rows must cover every semantic value part of the chosen component.

## Figma Source

When the prompt provides a Figma URL, treat the Figma file as the design source of truth.

Required flow:

- Use Figma MCP/design context before implementation.
- Inspect the target node, layer tree, component instances, variants, text nodes, variables, styles, and assets.
- Recreate the design from the Figma structure and Creative Apps Kit runtime/component contracts.
- Use screenshots only for final visual QA after reading the file structure.

Do not implement a Figma design by eye from an image, screenshot, exported PNG, or rough visual memory. If the Figma URL is not node-specific, inspect the file/page metadata and choose the relevant node only when it is unambiguous; otherwise ask for a node-specific link.

## Product Output

Use `canvasContent` only for product output: WebGL, Canvas 2D, SVG, DOM product text, shader previews, generated previews, export previews, or product editing handles.

```tsx
<CreativeAppsKitApp
  canvasContent={<ProductRenderer />}
  renderDefaultCanvasMedia={false}
  schema={appSchema}
/>
```

`canvasContent` must not contain app UI: buttons, forms, CTAs, upload prompts, helper text, settings, menus, labels, placeholder copy, or empty-state instructions.

Product text rendered as DOM must be marked with `data-creative-apps-kit-product-output` or `data-creative-apps-kit-product-text`. Product editing handles must be textless overlays, write to runtime state, and stay out of export/copy output.

Preserve the runtime canvas surface. Product renderers may draw their own output background, but must not hide, replace, or make the Creative Apps Kit canvas backing transparent.

## Reference Runtime Clone

When porting an existing app, use `transferMode: "reference-runtime-clone"` unless the user explicitly asks for redesign.

Preserve the reference runtime as source of truth:

- animation loop and time ownership;
- refs and mutable renderer state;
- particles, objects, connections, spawn cadence, and lifetime rules;
- pause/resume, restart, progress, export, and copy semantics;
- canvas sizing and media lifecycle;
- control-to-renderer mapping.

Creative Apps Kit still owns the shell: schema, controls, canvas, panels, toolbar, file upload, sticky footer actions, and `canvasContent`.

Do not iframe the reference, replace the route with copied original UI, or rebuild the app as a different shell.

## Animation Intent

Before adding animation controls, write an Animation Intent Inventory. Classify the animation as playback timeline, keyframes timeline, custom reference timeline, or autonomous decorative output.

If the user asks for product animation, use the top playback timeline by default. Use no timeline only when the animation is self-running output with no user-facing play/pause, scrub, duration, loop, restart, progress, or export-at-time behavior. In that case, declare `appTransferMode.animationIntent.mode = "autonomous"` and list the absent transport behavior in `behaviorCoverage`.

Do not replace `TimelinePanel` with an app-level playback, transport, or timeline panel to work around performance. Playback/keyframe timeline UI is runtime-owned. Custom timeline UI is allowed only when a reference app has non-Creative-Apps-Kit timeline behavior and `appTransferMode.referenceTimeline.mode` is `"custom-reference-timeline"` with browser-backed `referenceTimelineCoverage`.

Animated preview renderers must prioritize viewport interactions. During canvas drag, pan, pinch, zoom, and radar/center, suspend or coalesce non-essential animation work, then resume from the correct timeline or autonomous time without changing the user's play/pause state.

## Canvas Sizing And Background

A base/default size in the prompt is the initial output size. It does not remove user-facing size controls. Use `editable-output` unless the reference or product explicitly locks dimensions, and cover any `fixed-output` choice with `canvasSizingCoverage: "fixed-output-size"`.

Every product app exposes output background controls:

- `appearance.background` or `scene.background` as a schema `color` control;
- `export.includeBackground` as a `switch`, `checkbox`, `select`, or `segmented` control.

Preview, PNG export, and video export read the background color runtime value. PNG export passes the include-background runtime value to the export helper. Turning `export.includeBackground` off makes only PNG output transparent; live preview, workspace canvas backing, and video output keep the background.

Every product app needs output delivery in sticky footer `panelActions`. Still-output apps expose `Export PNG`. Animated apps expose `Export Video` and `Export PNG`. Clipboard copy is optional and never replaces export. If an odd number of footer actions leaves one action alone in the final row, that final action spans the full row.

For complex apps with many controls or sections, use schema `settingsTransfer: "auto"` or `true` for settings import/export. Do not put Import Settings or Export Settings in sticky footer `panelActions`; runtime inserts the Settings section first.

Animated apps with `Export Video` must include a separate `Video Export` controls section with at least:

- `export.video.format` as `select` or `segmented`, with `auto`, `webm`, and `mp4` baseline options;
- `export.video.quality` as `select` or `segmented`, with a high-quality target such as `high`, `4k`, or `source`.

Use standard export helpers. `createCreativeAppsKitPngExportCanvas` applies retina sizing and accepts `includeBackground` for runtime PNG transparency. Do not rely on static `export.png.background` alone when the UI exposes background controls. Video export keeps background and still uses `getCreativeAppsKitRetinaExportSize`.

Video export must choose the actual MIME/container with `MediaRecorder.isTypeSupported(...)` or an explicit encoder/transcoder capability check. `MOV` and `ProRes` are allowed only when the app provides a custom encoder/transcoder and proves it with acceptance plus performance coverage. Treat `4K` as an export quality target, not a hardcoded canvas lock. Browser acceptance must load the exported blob as a video, wait for metadata, and compare `video.duration` with the edited timeline duration; `blobSize > 0` is not enough.

## Verification Tiers

Before every edit, classify the change by blast radius and write the planned checks in the implementation note or plan:

```md
Verification tier: Tier N
Reason: <changed surface and expected blast radius>
Run: <commands and browser checks>
Skip: <checks not needed for this pass and why>
```

Use these tiers:

| Tier | Use When | Required Checks |
| --- | --- | --- |
| Tier 0 — docs/copy | Documentation, comments, copy, labels, or titles change without schema targets, values, runtime behavior, renderer output, or layout mechanics. | Targeted docs/typecheck or targeted app test. Browser is not required unless visual text fitting is the risk. |
| Tier 1 — local control presentation | One control or panel visual state changes: spacing, hover, focus, disabled, marker visibility, label fit, or component variant display. Runtime state shape and product renderer are unchanged. | Targeted unit/component test plus one focused browser check for the affected control or panel. |
| Tier 2 — schema/product behavior | Controls, sections, defaults, persistence, panel actions, export actions, acceptance rows, or product behavior mapping changes. | `pnpm verify:quick` plus relevant browser acceptance. Run perf only when the changed control affects renderer workload or responsiveness. |
| Tier 3 — renderer/canvas/runtime feature | Custom renderer, animation loop, canvas sizing, upload/media, timeline, layers, toolbar, export bytes, WebGL/Canvas/SVG output, zoom, radar, history, heavy control behavior changes, or a post-generation iteration that touches renderer workload or viewport stability. | `pnpm verify:quick`, targeted browser acceptance, and relevant `pnpm verify:perf` scenarios for touched workload/viewport/export paths. |
| Tier 4 — final delivery/template architecture | Fresh generated app completion, folder export, commit-ready delivery, dependency changes, runtime/template/contract/CLI changes, broad refactors, or major post-generation iterations that rewrite renderer, canvas, animation, timeline/keyframes, layers, media, export, or control mapping. | Fresh folders run `pnpm install` once, then `pnpm verify:final`, then start `pnpm dev` to provide the local URL. |

Choose the tier by blast radius, not by line count. If uncertain, move one tier higher, not automatically to Tier 4.

Do not rerun `pnpm install` after every edit. Run it after fresh export, dependency changes, lockfile changes, or a missing package error.

Use `pnpm verify:ui` when a tier calls for the browser acceptance suite without the performance suite. Use a focused named Playwright test instead when only one entity changed and the relevant test is already known.

Major iterations after a working app exists must not skip performance. Adding animation/keyframes/layers, replacing renderer technique, changing canvas behavior, changing many controls at once, or rewriting product output is Tier 3 or Tier 4. Run `pnpm verify:perf` or `pnpm verify:final` before reporting completion.

For final delivery, run:

```bash
pnpm verify:final
pnpm dev
```

Browser verification must use the real Creative Apps Kit shell plus renderer output. `pnpm verify:final` runs the full static, build, browser, and browser performance gate. `pnpm dev` is intentionally separate because it keeps the local server running.

Do not stop existing local servers to free `3002`. `pnpm dev`, `pnpm preview`, and browser verification prefer `3002`, then automatically use the next free port when it is occupied.
