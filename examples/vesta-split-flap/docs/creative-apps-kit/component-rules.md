# Component Rules

## Sliders

Slider `step` means numeric snapping only. It does not make a slider visually discrete by itself.

Classify every stepped slider as either `stepped continuous` or `visual discrete` in the spec and schema tests.

Use `variant: "discrete"` for semantic integer domains where markers help choose positions: counts, rows, columns, levels, bands, passes, points, tiles, segments, finite position choices, and finite animation-step controls such as flip depth, character count, glyph steps, or frame steps.

Keep large or precision stepped ranges visually continuous, even with `step`: speed, FPS, rate, duration, seconds, milliseconds, density, size, intensity, quality, and other ranges with many positions.

Visual discrete sliders must declare `step`; the runtime derives one marker per value position from `min`, `max`, and `step`. Visual discrete sliders with too many positions are invalid because they produce marker noise.

Related sliders may share an explicit two-column inline row when they tune the same product entity or animation stage, such as FPS and Speed in one Pattern Animation section. Inline slider rows use wider spacing than compact input pairs.

When a discrete slider is rendered at half width in a two-column inline row, show marker ticks only when the derived position count is 20 or fewer. If the count is above 20, keep the slider functional and snapped, but hide the marker ticks.

Discrete sliders must still drag smoothly. Heavy preview work must be debounced, coalesced, or deferred.

When a slider or range slider is intentionally unavailable, use schema `disabled: true`. Do not draw custom disabled-looking slider rows or disable only the renderer response while leaving the control active.

When a slider is meaningful only in some mode values, keep it visible and use `disabledWhen`:

```ts
fillAmount: {
  type: "slider",
  label: "Fill level",
  target: "distribution.fillAmount",
  disabledWhen: {
    target: "distribution.fillMode",
    equals: "full",
  },
}
```

The disabled value is preserved. When the user switches back to a mode where the control is meaningful, the slider becomes active with its previous value.

Use `visibleWhen` instead of `disabledWhen` when a control or section belongs only to another template, type, or mode. Example: in a co-brand lockup, `Partner` belongs to text identity mode and `Partner logo` belongs to logo identity mode. Do not keep both visible and enabled while making the renderer ignore one of them.

## Segmented Controls

Use segmented controls only for compact mode choices that preserve every cell's internal padding.

Limits:

- at most four options;
- no option label longer than nine characters;
- no more than twenty-four total option-label characters.

If cells clip, collide, lose padding, or force labels into adjacent cells, shorten labels first. If compact labels still fail, use `select`.

## Colors

First identify the semantic entity the color belongs to: background, object, connector, glow, tone mapping, brand, export, or a named product object.

Keep color inside a section when it configures the same entity as nearby controls. Use a standalone color section only when color is the whole semantic section.

Standalone color section titles must describe product role. Never generate a section titled `Color` or `Colors`. If no meaningful role exists, omit the section title.

Multiple related colors stay in the same section and render at most two per row.

Use `colorOpacity` when one product entity owns both color and opacity, such as text color, shadow color, glow color, overlay color, or stroke color. Do not split that into a separate `color` plus opacity slider/input.

When one short numeric/text field and one `color` or `colorOpacity` field configure the same entity, keep them in one two-column inline row. Example: `Mask size` and `Color` belong in the same `Mask` row instead of two stacked rows.

Mixed inline rows require label parity: if one field has a visible label, every field in that row has a visible label. Do not pair `Mask size` with an unlabeled color field.

Renderer-owned output background is a base product control. Use a schema `color` target such as `appearance.background` or `scene.background`, add an `export.includeBackground` control for PNG transparency, and make preview/export read those runtime values. `export.includeBackground` controls only PNG alpha; it must not make live preview, workspace canvas backing, or video output transparent. Do not hardcode a configurable background in CSS, Canvas `fillStyle`, or WebGL clear color.

## File Upload

Use `fileDrop` for source material uploads in the controls panel. Do not place upload UI on the canvas.

In single-layer apps, the runtime shows uploaded image preview and clear button in the file control. Clearing removes source material from the renderer and canvas.

In multi-layer apps, deletion and visibility belong to the Layers panel; `fileDrop` stays an upload target.

## Image Picker

Every visible `ImagePicker` item must be actionable in the current product context. Do not show choices that sanitize to fallback or no-op behavior.

Sizing:

- two options: large tiles;
- three or six options: medium tiles;
- larger sets: small tiles.

Filter or split choices by template, mode, or selected object when only some choices are valid.

## Font Picker

Use `fontPicker` for typography choices that need font preview plus weight, size, letter-spacing, and line-height controls. Do not recreate it with a plain `select`, custom font list, or separate typography inputs.

The value is one object: `{ fontId, fontWeight, fontSize, letterSpacing, lineHeight }`. Typography renderers and exports must consume all five parts.

If `fontPicker` controls product text, the preview renderer and export renderer must apply the selected `fontId`, `fontWeight`, `fontSize`, `letterSpacing`, and `lineHeight` to that actual text. Do not stop at updating runtime state, the select label, or the popup preview.

The component owns search, category filters, virtualized scrolling, font preview loading, selected-row behavior, the font-weight select, the font-size input, and the two footer sliders. Browser acceptance must choose a different font, change weight, change size, move Letter spacing, and move Line height.

## Vector

One vector control in the controls panel uses the square X/Y pad. Multiple vector controls use compact pads so the sidebar does not become too tall.

Use variants by product meaning:

- default: position, offset, direction, focus, anchor, light direction;
- `whiteBalance`: temperature and tint;
- `colorBalance`: paired color-balance axes;
- `chromaOffset`: RGB or chromatic offset;
- `toneBias`: split-tone, duotone, or color-grading bias.

Do not add custom vector sizing props. Choose the right number, variant, and section grouping, then let runtime sizing handle the pad.

## Text And Code

Use `text` for short single-line strings: names, small values, compact prompts, titles, and tokens.

Use `code` / `CodeTextarea` as the base multiline textarea for any potentially long value: prompts, instructions, JSON, CSS, shader code, scripts, templates, or other structured text. It is capped at 12 visible lines; long content scrolls inside the textarea instead of making the controls panel taller. Do not name a section `Code` unless the product value is actually code.

## Labels

Visible control labels should be short UI names, usually one to three words. Do not put explanations, formulas, units, parenthetical hints, or usage instructions in field labels.

If a source label is unavoidably long, keep the visible label concise and rely on native `title` for the full text.

Switch and checkbox labels name the setting context, not the action. Do not prefix them with `Enable` or `Disable`; use `CRT`, `Background`, `Glow`, `Loop`, or `Guides` instead of `Enable CRT` or `Disable guides`.

## Layers

Enable layers only when the app has multiple editable objects, media objects, groups, visibility, selection, reorder, or selected-layer controls.

Do not show Layers for a single-layer app. Do not use `selectedLayer.*` targets when Layers are disabled.

When Layers are enabled, browser tests must use the real LayersPanel UI: select, visibility, reorder, grouping, and media lifecycle when uploads/deletes create or remove layers.

## Timeline

Before choosing timeline mode for an animated product, write an Animation Intent Inventory:

- `timeline-playback`: user-facing play, pause, scrub, duration, loop, restart, progress, or export-at-time.
- `timeline-keyframes`: editable diamonds, rows, easing, or keyframe evaluation.
- `autonomous`: decorative or self-running output with no user-facing transport.

User-requested product animation defaults to playback timeline. Use no timeline only for autonomous decorative/self-running animation, and declare `appTransferMode.animationIntent.mode = "autonomous"` with coverage proving no play/pause, scrub, duration, loop, or export-at-time behavior.

Use playback timeline for play, pause, scrub, duration, loop, restart, or export-at-time.

Playback renderers must read `state.timeline.currentTimeSeconds`, `state.timeline.durationSeconds`, `state.timeline.isPlaying`, and loop state from the runtime. The full animation cycle must span `state.timeline.durationSeconds`; do not hard-code a separate local animation duration such as 3s or 8s inside the renderer.

Renderers may compute an initial duration default during app initialization or reset, but they must not watch `state.timeline.durationSeconds` and dispatch `timeline.setDuration` back to a computed local value. Once the user edits the timeline duration, that runtime value is the source of truth and renderer progress must map into it.

Use keyframes timeline for diamonds, editable rows, easing, or keyframe evaluation. In keyframes mode, Creative Apps Kit infers capable controls; do not manually hide diamonds on controls that can be keyframed.

Keyframe state stores typed control values. `valueLabel` is display-only for the timeline UI; renderers and tests must never parse it as the source of truth. Custom renderers must read keyframed settings through `evaluateCreativeAppsKitTimelineValues`, `evaluateCreativeAppsKitTimelineValue`, `useCreativeAppsKitEvaluatedValues`, or `useCreativeAppsKitEvaluatedValue` instead of reading raw `state.values` for keyframed targets.

Playback-only timelines stay collapsed and must not show control diamonds or expanded keyframe rows.

When non-looping playback reaches the end, pressing Play again must restart from time 0. Do not require users to scrub back manually before replaying.

App-wide Play, Pause, Animate, and Restart controls do not belong in the right panel.

Right-panel animation controls may tune renderer parameters such as mode, intensity, speed, or stagger only after the animation intent is declared. They must not replace top timeline transport.

Do not replace `TimelinePanel` with an app-level playback, transport, or timeline panel to avoid runtime performance issues. Keep the runtime panel design and fix the Creative Apps Kit runtime clock/state path. Use custom timeline UI only for explicit `custom-reference-timeline` transfers with browser-backed reference timeline coverage.

## Panel Actions

Use `panelActions` only for sticky footer product actions such as Generate, Apply, Export, Copy, or Download.

Use schema `settingsTransfer` for settings import/export. Do not add Import Settings or Export Settings to sticky footer `panelActions`; when enabled, the runtime inserts a first `Settings` section and imports/exports control values, canvas size, and timeline state.

Reset belongs to the controls panel header reset button. Do not add a footer action with `label`, `value`, or `command` containing reset; acceptance treats that as a duplicate Reset.

Still-output product apps include one primary `Export PNG` action.

Animated product apps include `Export Video` as the primary action and `Export PNG` as the secondary action.

Animated product apps with `Export Video` include a separate `Video Export` section. That section must contain:

- `export.video.format`, usually a `select`, with baseline options `auto`, `webm`, and `mp4`;
- `export.video.quality`, usually a `select`, with a high-quality option such as `high`, `4k`, or `source`.

Do not put video export format/quality controls inside effect, renderer, animation, or output-background sections. `MOV` and `ProRes` are not baseline browser outputs; use them only with an explicit encoder/transcoder and dedicated acceptance plus performance coverage.

Add `Copy PNG` only when clipboard output is part of the product. Copy never replaces export. If two footer actions are needed, secondary/outline goes left and primary goes right. Footer actions must be one compact horizontal group, not stacked full-width rows. If an odd number of actions leaves one action alone in the final row, that final action spans the full row.

Do not place product action buttons on the canvas or in the renderer.

## Canvas Handles

Use product editing handles only when direct manipulation is better than panel-only editing: gradient stops, focus points, light vectors, crop bounds, mask points, transforms, bezier anchors, or perspective corners.

Handles are visual overlays, not app UI. They must be textless, tokenized, bound to runtime state, and excluded from export/copy output.
