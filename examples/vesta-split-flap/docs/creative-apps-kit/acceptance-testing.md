# Acceptance Testing

Every visible product entity must prove it works. A control is not accepted because it renders; it is accepted only when tests prove user interaction changes runtime state and the final product output, command side effect, timeline frame, layer result, media lifecycle, or canvas viewport.

## Required Files

- `src/app/app-acceptance.ts`
- `src/app/app-acceptance.test.ts`
- `src/app/app-performance.ts`
- `src/app/app-performance.test.ts`
- `docs/creative-apps-kit/agent-worklog.md`
- `e2e/app-browser-acceptance.spec.ts`
- `e2e/app-controls.spec.ts`
- `e2e/app-performance.spec.ts`

`pnpm verify:final` must pass before final delivery. Incremental edits use the verification tier classifier from `assembly-workflow.md`: run targeted browser acceptance for the changed entity, and add `pnpm verify:perf` when the edit changes renderer workload, animation, canvas viewport behavior, upload/export, or a performance-sensitive control.

Major post-generation iterations are always performance-sensitive. Adding animation/keyframes/layers, replacing renderer technique, changing canvas behavior, changing many controls at once, or rewriting product output must run `pnpm verify:perf` or `pnpm verify:final` before completion.

## Product Readiness

The exported starter may keep `appProductReadiness.mode: "starter"` only while it is still a neutral template. A real product must switch it to `mode: "product"` and fill:

- `productName`;
- `productSummary`;
- `requestedBehavior`.

Product readiness also requires product surface: controls, layers, timeline, `canvasContent`, or acceptance coverage. A renamed product folder must not pass tests as a neutral starter.

## Implementation Worklog

Product apps must update `docs/creative-apps-kit/agent-worklog.md` before final delivery. The file records why the app chose its renderer, timeline mode, layer policy, control grouping, export behavior, and performance strategy.

The worklog must declare `Mode: product`. Each decision section (`Renderer`, `Timeline`, `Layers`, `Controls`, `Export`, `Performance`) must include `Decision:`, `Reason:`, and `Evidence:` entries. `Evidence` should name files, reference behavior, contract rules, browser checks, performance checks, or exact commands. `Verification` must list concrete checks such as `pnpm verify:quick`, `pnpm verify:perf`, browser tests, or Playwright scenarios. `Risks` must include either `Risk:` entries or `None:` with a reason.

The acceptance gate fails if the worklog is missing, still says `Mode: starter`, or lacks concrete decision evidence.

## Acceptance Rows

Every visible schema control, custom renderer feature, media lifecycle, timeline behavior, layer behavior, canvas sizing behavior, toolbar command, sticky action, and product editing handle needs an acceptance row.

Each row should name:

- stable `id`;
- `kind`;
- runtime `target` when the entity edits state;
- `componentType`;
- fixture data;
- real user action;
- expected product-level observable;
- evidence type;
- exact `automatedTestName`;
- exact `browserTestName`.
- `controlPartCoverage` when the control is compound.
- `canvasSizingCoverage: "fixed-output-size"` when `canvas.sizing.mode` is `fixed-output`.

The test gate rejects rows without matching automated and browser test names.

`fixed-output` canvas sizing must be deliberate. Its runtime acceptance row must explain why width and height are non-editable. A default size from the prompt should use `editable-output`, which keeps the runtime Canvas width and Canvas height controls.

## Compound Controls

Compound controls have multiple semantic value parts inside one visible control. Their acceptance row must declare `controlPartCoverage`, and the browser test must explicitly exercise each required part against product output.

Required parts:

| Control | Required `controlPartCoverage` |
| --- | --- |
| `anchorGrid` | `anchorGrid.position` |
| `channelMixer` | `channelMixer.activeChannel`, `channelMixer.values` |
| `colorOpacity` | `colorOpacity.hex`, `colorOpacity.opacity` |
| `curves` | `curves.activeChannel`, `curves.points` |
| `fontPicker` | `fontPicker.fontId`, `fontPicker.fontWeight`, `fontPicker.fontSize`, `fontPicker.letterSpacing`, `fontPicker.lineHeight` |
| `gradient` | `gradient.gradientType`, `gradient.angle`, `gradient.stops.position`, `gradient.stops.color`, `gradient.stops.opacity` |
| `palette` | `palette.family`, `palette.shade` |
| `rangeInput` | `rangeInput.start`, `rangeInput.end` |
| `rangeSlider` | `rangeSlider.lower`, `rangeSlider.upper` |
| `vector` | `vector.x`, `vector.y` |

Testing only one sub-control is not enough. For example, a `gradient` test that changes only a stop color must fail if the app also renders Gradient type, Angle, Position, or Opacity controls.

For `fontPicker`, product output evidence must come from actual rendered/exported product text after changing the font, weight, size, letter spacing, and line height. Runtime value changes, selected labels, or popup font previews are preflight checks, not final acceptance.

## Valid Evidence

Valid acceptance evidence includes:

- rendered product pixels;
- exported image/video bytes;
- canvas hash or DOM-visible product result;
- clipboard, file, or blob payload;
- cleared media preview and canvas;
- selected layer output;
- changed canvas viewport;
- changed timeline playback state plus rendered frame.

Product apps must include output delivery acceptance. Still-output apps need `Export PNG` evidence. Animated apps need both `Export Video` evidence and `Export PNG` evidence. Clipboard copy can be tested as an additional behavior, but it cannot replace export coverage.

Animated app acceptance must also exercise the separate `Video Export` section: choose at least two `export.video.format` values, choose at least two `export.video.quality` values, verify unsupported MIME/container choices fall back safely, and assert exported video bytes, dimensions, MIME/container, and duration match runtime timeline state. The duration assertion must load the exported blob as a video, wait for metadata, and compare `video.duration` with the edited timeline duration; `blobSize > 0` and `blobType` are not enough.

Footer action acceptance must not include Reset. Reset is already available in the controls panel header and uses schema `defaultValue`; duplicating it in sticky `panelActions` fails acceptance.

PNG export tests must prove runtime background behavior: changing the background color affects preview/export, turning `export.includeBackground` off creates transparent PNG output while live preview, workspace canvas backing, and video keep the background, turning it on includes the current background color in PNG, and exported pixel dimensions are retina size, at least `state.canvas.size * 2`.

Invalid final acceptance evidence:

- control exists;
- `data-*` attribute changed;
- runtime state was mutated directly;
- DOM text changed but product output did not;
- shader uniform changed without output proof;
- helper fixture proves a function but not the app behavior.

If a behavior cannot be proven through product output or a side effect, remove the entity or ask whether it is required.

## Browser Gate

Browser tests must open the running app and interact with the real UI by pointer, keyboard, file upload, canvas drag, toolbar click, timeline scrub, or layer drag.

Do not dispatch runtime commands directly for browser acceptance unless the entity is itself a command API. Browser tests must exercise what the user actually sees.

Every browser test should prove:

- the interaction is possible;
- runtime state changes through the expected target;
- product output or command side effect changes;
- canvas zoom, offset, and output dimensions do not jump unexpectedly.

Animated viewport tests must also prove that canvas drag, pan, pinch, zoom, and radar/center interactions suspend or coalesce non-essential animation preview work without changing the user's play/pause state. After the interaction, the renderer must resume from the correct timeline or autonomous time and keep canvas zoom/offset stable.

## Timeline And Layers

When animation controls exist without `panels.timeline`, acceptance validation requires `appTransferMode.animationIntent.mode = "autonomous"`. That intent must explain why the animation is decorative/self-running and must cover no user-facing transport, no play/pause, no scrub, no duration control, no loop control, and no export-at-time.

Playback timeline coverage must prove play/pause, scrub, duration, loop, restart when exposed, non-looping Play at the end restarts from 0, and export/copy at selected time when relevant. Duration coverage must edit the real `Edit timeline duration` control, prove the playback range changes, and prove the renderer maps one full product animation cycle to `state.timeline.durationSeconds`. Tests should compare visible or exported output at 0, midpoint, and end after changing the timeline duration. Do not accept a renderer that uses a separate fixed local duration while the timeline displays another duration, and do not accept a renderer effect that watches `state.timeline.durationSeconds` only to dispatch `timeline.setDuration` back to a computed local value.

Keyframe timeline coverage must prove diamond creation, expanded rows, keyframe updates on control change, scrub/playback evaluation, and product output changes for every inferred keyframe-capable control. Tests must prove renderers consume typed evaluated values from the Creative Apps Kit keyframe evaluator; checking `valueLabel`, row count, or source strings is not enough.

Layer browser coverage must use the real LayersPanel UI: click rows, toggle visibility, drag rows to reorder, and drag rows into groups.

## Component Variants

Component variants are acceptance requirements.

- Discrete sliders must render `[data-slot="slider"][data-variant="discrete"]`, show markers when their layout budget allows, and remain smooth while dragging.
- Half-width inline discrete sliders hide markers when real value positions exceed 20.
- Continuous stepped sliders must not render discrete markers.
- Segmented controls must preserve cell padding and avoid label collision.
- Select, segmented, and image-picker controls should cover every visible option unless options come from separately tested runtime data.

Performance browser tests must assert budgets through `expectCreativeAppsKitScenarioPerformanceBudget(..., appPerformance, scenarioId)`. Workload browser tests must apply values from `getCreativeAppsKitPerformanceStressValue(appPerformance, scenarioId)`. Do not hardcode budget numbers or toy workload values in e2e tests; `app-performance.ts` is the single source of truth.

## Fixtures

Use fixtures that make each behavior visible. For example, background character-size controls need visible background characters, transparency needs alpha-sensitive pixels, selected-layer controls need multiple layers, timeline controls need deterministic playback or keyframe fixtures, and mode-specific controls need fixtures for every mode branch. Conditional coverage must prove visible controls, hidden controls, disabled controls, preserved values after switching away and back, and renderer output for the active branch.

Generic hash differences are not enough for semantic controls. If a control promises a direction, test that direction.
