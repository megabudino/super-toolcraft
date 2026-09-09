# Schema Reference

Edit `src/app/app-schema.ts` as the public product surface.

## Runtime Shape

- Use `defineCreativeAppsKit`.
- Configure `canvas`, `panels`, `toolbar`, and `panelActions` through the schema instead of composing those surfaces by hand.
- Use `settingsTransfer: "auto"` for complex apps that should let users import/export control settings.
- Bind every control to a schema `target`.
- Use `defaultValue` for reset behavior.
- Use `disabled: true` only when the control is intentionally unavailable; the runtime renders the disabled visual and interaction state.
- Use `visibleWhen: { target, equals }` or `visibleWhen: { target, notEquals }` when a control or section exists only for a specific template, type, or mode. Hidden values are preserved. A section with no visible controls is hidden automatically.
- Use `disabledWhen: { target, equals }` or `disabledWhen: { target, notEquals }` when a control belongs to the current entity but is temporarily unavailable in the selected mode. The value is preserved while disabled.
- Use `orderRole` to make control order testable.
- Use `performanceRole` and `performanceReason` on every visible non-action control so performance coverage can be derived from the schema.
- Use built-in controls before custom renderers.
- Use `panelActions` only for sticky footer product actions.
- Do not use `panelActions` for settings import/export; `settingsTransfer` owns that body section.
- Do not use `panelActions` for reset. The controls panel header owns reset, and footer actions with `label`, `value`, or `command` containing reset fail acceptance.
- Still-output product apps expose `Export PNG`.
- Animated product apps expose `Export Video` and `Export PNG`.
- `Copy PNG` can be secondary, but it never replaces export.
- If an odd number of footer actions leaves one action alone in the final row, that final action spans the full row.
- Use `CreativeAppsKitApp onPanelAction` for product-specific actions.
- Do not duplicate runtime-owned canvas, toolbar, panel, layer, or timeline internals.

## Export

Use the standard export helpers from `@/creative-apps-kit/template-runtime`.

```ts
export: {
  png: {
    background: "include",
  },
}
```

`export.png.background` defaults to `"include"`. Product apps still expose runtime controls for the actual user choice:

- `appearance.background` or `scene.background` as a `color` control;
- `export.includeBackground` as a boolean/options control.

PNG exporters should call `createCreativeAppsKitPngExportCanvas({ background, includeBackground, state, render })`, where `background` and `includeBackground` come from runtime state. `includeBackground` controls only PNG alpha; live preview, workspace canvas backing, and video export keep the product background. Video export always includes the product background, uses `getCreativeAppsKitRetinaExportSize`, and must prove exported metadata duration matches the runtime timeline duration.

Animated apps with `Export Video` also expose a separate `Video Export` controls section. Do not mix video export settings into renderer/effect sections.

```ts
{
  title: "Video Export",
  controls: {
    videoFormat: {
      defaultValue: "auto",
      label: "Format",
      options: [
        { label: "Auto", value: "auto" },
        { label: "WebM", value: "webm" },
        { label: "MP4", value: "mp4" },
      ],
      target: "export.video.format",
      type: "select",
    },
    videoQuality: {
      defaultValue: "high",
      label: "Quality",
      options: [
        { label: "High", value: "high" },
        { label: "4K", value: "4k" },
      ],
      target: "export.video.quality",
      type: "select",
    },
  },
}
```

Use `MediaRecorder.isTypeSupported(...)` or an explicit encoder/transcoder capability check before choosing the actual MIME/container. `MOV` and `ProRes` are not baseline browser outputs; use them only with a custom encoder/transcoder and dedicated acceptance plus performance coverage. `4K` is a quality target, not a reason to lock `canvas.size`.

## Canvas Sizing

Choose sizing from product context:

- `intrinsic-media`: a single uploaded or generated source defines `canvas.size`.
- `editable-output`: exportable output where users should edit width and height.
- `fixed-output`: product-defined output size that users must not edit.

For product output, export, copy, download, shader rendering, procedural rendering, or no single intrinsic source image, use `editable-output` unless the product explicitly needs `fixed-output`.

A prompt-provided base/default size is only the initial `canvas.size`. It must not remove the runtime Canvas width and Canvas height controls. Use `fixed-output` only when the reference or product explicitly locks dimensions, and add runtime acceptance with `canvasSizingCoverage: "fixed-output-size"`.

When `editable-output` is used, the runtime prepends the untitled canvas size block. Do not hand-build a duplicate size selector.

## Panels

- Use `panels: {}` for the neutral starter or for products that have no user-facing panels yet.
- Controls panel is the primary editing panel once the product has schema controls.
- Layers are optional. Enable only for multiple editable objects, media objects, groups, visibility, selection, reorder, or selected-layer controls.
- Do not use `selectedLayer.*` targets when layers are disabled.
- Timeline is optional. Use no timeline, playback, keyframes, or custom reference timeline from product transport behavior.
- Do not add right-panel Play, Pause, Animate, or Restart controls for app-wide transport. Use the top timeline.

## Built-In Control Types

Use built-ins before custom controls. Unknown `type` values render nothing unless the app passes a matching `controlRenderers` entry.

| `type` | Renders | Key fields |
| --- | --- | --- |
| `anchorGrid` | Anchor picker | `defaultValue`, `target` |
| `channelMixer` | RGB channel mixer | `defaultValue`, `target` |
| `checkbox` | Checkbox field | `defaultValue`, `target`, `label` |
| `code` | Multiline textarea | `defaultValue`, `target`, `label` |
| `color` | Hex color picker | `defaultValue: { hex }`, `target`, `label` |
| `colorOpacity` | Hex color picker plus opacity percent input | `defaultValue: { hex, opacity }`, `target`, `label` |
| `curves` | Curves editor | `defaultValue`, `target` |
| `fileDrop` | Upload/drop input | `accept`, `target` |
| `fontPicker` | Font preview select with popup, category search, weight, size, letter spacing, and line height; product text must consume `fontId`, `fontWeight`, `fontSize`, `letterSpacing`, and `lineHeight` | `defaultValue: { fontId, fontWeight, fontSize, letterSpacing, lineHeight }`, `target` |
| `gradient` | Gradient editor | `defaultValue: { angle, gradientType, stops }`, `target` |
| `imagePicker` | Image choice grid | `items`, `defaultValue`, `target` |
| `palette` | Palette picker | `defaultValue`, `target` |
| `panelActions` | Sticky footer product actions | `actions`, `target`, `variant` |
| `rangeInput` | Two compact text values | `defaultValue: { start, end }`, `target` |
| `rangeSlider` | Two-thumb slider | `defaultValue`, `min`, `max`, `step`, `variant` |
| `segmented` | Segmented control | `options`, `defaultValue`, `variant` |
| `select` | Select dropdown | `options`, `defaultValue` |
| `slider` | Single-value slider | `defaultValue`, `min`, `max`, `step`, `unit`, `variant` |
| `switch` | Binary switch | `defaultValue`, `target`, `label` |
| `text` | Single-line input | `defaultValue`, `target`, `label` |
| `vector` | X/Y vector pad and fields | `defaultValue: { x, y }`, `xLabel`, `yLabel`, `variant` |

`code` / `CodeTextarea` is capped at 12 visible lines. Long content scrolls inside the textarea instead of making the controls panel taller.

## Animation Intent

Before adding animation controls, decide the animation owner:

- `timeline-playback`: product time controlled by the top timeline.
- `timeline-keyframes`: property animation controlled by keyframe diamonds and rows.
- `autonomous`: decorative/self-running output with no user-facing transport.

In keyframes mode, renderer code reads evaluated values from the runtime keyframe evaluator. Do not parse timeline labels and do not use raw `state.values` for targets with keyframes.

If the user asks for product animation and does not explicitly say it is decorative autoplay, use `panels.timeline: { mode: "playback" }`. If no timeline is used while animation controls remain visible, `appTransferMode.animationIntent` must declare `mode: "autonomous"`, include a concrete reason, and include behavior coverage for no transport, no play/pause, no scrub, no duration control, no loop control, and no export-at-time.

## Control Section Inventory

Before editing `panels.controls.sections`, write a short inventory in the spec or plan:

- section title or `untitled`;
- product entity or workflow stage;
- included schema targets;
- reason these controls belong together or reason for a real workflow split.

Group controls by product meaning, not by component type. Do not create sections named `Controls`, `Settings`, `Options`, `Sliders`, `Inputs`, `Buttons`, `Color`, or `Colors`.

Controls for the same product entity stay in the same section. For example, `squares.right.connections`, `squares.right.hoverRadius`, and `squares.right.color` belong in `Square 1 (Right)` with `Color` as the field label. A standalone color section is only valid when the color is the whole product entity, such as `Background`, `Accent`, `Connector`, or `Brand`.

If a target prefix has to be split across sections, the spec must name the workflow reason. Otherwise the acceptance validator treats the split as a sectioning error.

Switch and checkbox labels name the setting context only. Do not prefix them with `Enable` or `Disable`; use `CRT`, `Background`, `Glow`, `Loop`, or `Guides` instead.

Inline two-column groups are allowed when controls tune one close product meaning. Short numeric text pairs can be inline. A short numeric/text field may also pair with one related `color` or `colorOpacity` field when both configure the same entity, such as `Mask size` and `Color` inside `Mask`. Mixed inline rows require visible labels on every field; do not pair a labeled input with an unlabeled color field. Related sliders can also be inline when they tune the same entity or animation stage, such as `FPS` and `Speed` in `Pattern Animation`; inline slider rows use wider spacing than compact input pairs.

For half-width inline discrete sliders, show tick markers only when the derived position count is 20 or fewer. If there are more than 20 positions, keep the slider snapped and interactive but hide the marker ticks.

## Control Order

Order controls by decision flow inside each section:

- `input`: upload, source, and canvas-size controls;
- `mode`: mode, type, filter, blend, style, and preset selectors;
- `primary`, `spatial`, `color`: core product parameters;
- `strength`: intensity, opacity, scale, depth;
- `detail`: grain, noise, blur, density, radius, quality;
- `advanced`: secondary tuning;
- `action`: footer actions.

A selector that changes how later controls are interpreted must use `orderRole: "mode"` and sit above dependent parameters.

Use `visibleWhen` for mode-exclusive controls and sections. Example: `Partner` is visible when `coBrand.identityMode` is `text`; `Partner logo` is visible when it is `logo`. When every control in a section is hidden by `visibleWhen`, the whole section is hidden automatically. Use `disabledWhen` only when the control remains part of the current entity but temporarily has no effect.

App schema tests must assert visible control order with `getCreativeAppsKitControlOrderTargets(appSchema)` or an equivalent exact target-order check.

## Persistence

State persistence is a product policy, not a hidden side effect.

Use `persistence: { storage: "localStorage", key, version, include }` when user-edited app settings should survive reload. Typical product editors persist `values`, `canvas`, and `panels`. If localStorage persistence is enabled and any runtime panel is visible, `include` must contain `"panels"` so dragged panel positions survive reload in that specific app. Add `timeline` when playback position, duration, loop, expansion, or keyframes should survive reload. Add `layers` only when the app has a real layer model.

Do not persist media blobs, files, generated images, or history stacks. Theme preference is runtime-owned separately. Do not write runtime state to `localStorage` directly from app code.

## Settings Transfer

Use `settingsTransfer` when users should move a complex app setup between sessions or machines.

```ts
settingsTransfer: "auto"
```

Allowed values:

- `"auto"`: default. Runtime enables the first `Settings` section when the app is complex enough: many controls, many sections, heavy compound controls, layers, or timeline.
- `true`: force the section on.
- `false`: force the section off.
- `{ enabled, appId, fileName }`: customize the exported JSON identity and file name.

When enabled, the runtime inserts `Settings` as the first controls-panel section. It exports and imports control values, `canvas.size`, and timeline state. It ignores unknown targets on import and pauses playback after importing.

Do not hand-write `settings-transfer.ts`, hidden file inputs, route handlers, or `panelActions` for settings import/export. Sticky footer `panelActions` remain product delivery only.
