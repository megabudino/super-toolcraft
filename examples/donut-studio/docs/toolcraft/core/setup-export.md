# Setup, Background, And Export

Read this module before changing Setup, canvas sizing, background, image export, video export, sticky actions, render scale, or timeline visibility.

## Runtime Setup

- Runtime `Setup` is always the first visible controls block in generated product apps.
- `Setup` is headerless, not collapsible, and has no section reset action.
- `Setup` always contains `Export Settings` and `Import Settings`.
- Do not implement settings import/export through `panelActions`, route-local file inputs, or app-authored controls.
- Do not gate settings import/export by app complexity.
- Product-output, exportable, shader, procedural, reference-clone, and uploaded-background/source apps use `editable-output`.
- Product apps declare the standard background state pair in one authored `Background` source section. Runtime removes that visible section and places a `Background` switch beside `Infinity canvas` immediately after settings transfer, with Background first.
- Runtime places `Background color` below that row, before finite canvas sizing.
- When the standard Background pair exists, `Infinity canvas` is available only while Background is on. Turning Background off exits infinite mode; turning it back on restores availability without enabling Infinity automatically.
- Finite `Aspect ratio`, `Canvas width`, and `Canvas height` follow Color; optional `Resolution scale` follows sizing.
- When enabled, `Timeline` is the final Setup control.
- Timeline and Infinity canvas are self-explanatory runtime switches and do not render help icons.
- App-authored sections must not declare runtime Setup targets: `runtime.settingsTransfer`, `canvas.infinity`, `canvas.aspectRatio`, `canvas.size.width`, `canvas.size.height`, `canvas.renderScale`, or `panels.timeline.extended`.

## Canvas Size Defaults

- When no explicit product size is provided, the default canvas size is `16:9` / `1920x1080`.
- Runtime aspect presets apply canonical canvas sizes; `16:9` is `1920x1080`.
- A prompt-provided, reference, fixed-format, or base/default size is only the initial `canvas.size`.
- Fixed/reference/base dimensions are not reasons to hide `Aspect ratio`, `Canvas width`, or `Canvas height`.
- Manual Canvas width/height edits keep the typed dimension, keep the other dimension unchanged, switch Aspect ratio to Custom, and show the reduced current ratio in the custom ratio inputs.

## Infinity Canvas

- `Infinity canvas` is the one runtime-owned mode switch for an unbounded workspace. Product code does not mirror it in `state.values` or create another canvas-mode control.
- Turning it on removes the finite artboard boundary and clipping. `Aspect ratio`, `Canvas width`, and `Canvas height` disappear because they do not constrain the workspace.
- Infinity canvas suppresses the bounded product-rendered preview background so the dormant finite output does not appear as a second canvas. While Background is on, `CanvasShell` fills the complete infinite viewport with the selected `Background color`; product code must not draw a synthetic workspace rectangle.
- The last finite `canvas.size` remains dormant and immutable while Infinity canvas is on. Turning it off restores that exact size and centers the finite artboard; reset, undo/redo, persistence, and settings transfer preserve the same canonical `canvas.mode` behavior.
- Runtime image and model assets keep explicit center-anchored world frames. Zoom, pan, radar, and model orientation change presentation, not scene geometry or export bounds.
- Product `canvasContent` and custom renderer output declare one direct `ToolcraftAppComposition.sceneBoundsProvider`. It returns product world-space rectangles and receives `{ state, timeRange? }`; do not use a registry or DOM measurement.
- Infinite PNG export crops to the outward-rounded union of visible product, image, and model frames. Hidden layers, runtime media suppressed by the composition, and editor-only handles or gizmos are excluded.
- Infinite video export resolves one bounds envelope for the requested `timeRange` and uses it for every frame, preventing frame-to-frame output size changes.
- Finite-mode export remains the full finite canvas and does not call the product bounds provider.
- Empty scenes, missing/invalid product bounds, and artifacts above `8192px` per edge or `67,108,864` pixels fail before canvas allocation with visible typed feedback: `empty-scene`, `scene-bounds-unavailable`, or `scene-export-too-large`.

## Resolution Scale

- Non-vector raster, Canvas 2D, WebGL, and WebGPU previews set `canvas.renderScale: true`.
- Runtime then appends `Resolution scale` after canvas sizing.
- `Resolution scale` changes backing pixels from `1` to `2` without changing visible CSS size or product output dimensions.
- The product acceptance matrix adds exactly one browser runtime row targeting `canvas.renderScale` with `renderScaleCoverage: { kind: "selected-backing-pixels", states: ["interaction", "steady"] }`; insert `"playback"` in sorted order when timeline is enabled.
- The product browser scenario uses `expectToolcraftCanvasRenderScaleEvidence` for every declared state. Only after CSS size remains stable and actual backing dimensions honor `css size × devicePixelRatio × selected scale` does the protected reporter emit `canvas-render-scale-backing`.
- Any quality clamp or lower-resolution stretch is a functional failure without measured performance.
- DOM/SVG/vector-native previews should not use render scale.
- Performance fixes must preserve the user's selected render scale. Do not pass budgets by silently downsampling, stretching a lower-resolution backing canvas, blurring output, or clamping render scale below the chosen value.

## Timeline Setup Switch

- When `panels.timeline` is enabled, runtime adds the `Timeline` mode switch to Setup.
- Off shows compact Play-only transport.
- On shows the extended timeline with scrubber, duration, loop, and keyframe UI.
- The switch controls runtime presentation only. It does not pause playback, change product values, remove keyframes, alter export, or reset with `Reset controls`.
- When `panels.timeline` is omitted, the Timeline switch must not appear.

## Background

- Every product app declares one authored `Background` source section containing:
  - `export.includeBackground` as a switch;
  - the product background color control.
- Runtime consumes that pair into Setup, labels the switch `Background`, places it left of `Infinity canvas` in an equal-width row, and labels the full-width color below it `Background color`.
- Background is a prerequisite for Infinity canvas. Disabling it atomically restores finite mode and disables Infinity; re-enabling it does not change the current finite mode.
- A separate visible Background section is stale layout and fails acceptance.
- Use a schema `color` target such as `appearance.background` or `scene.background`.
- Do not hardcode a configurable background in CSS, Canvas `fillStyle`, or WebGL clear color.
- Live preview calls `shouldIncludeToolcraftPreviewBackground(state)` and hides only the bounded product-rendered background when Background is off or Infinity canvas is on. In Infinity mode, the runtime viewport—not the product renderer—uses the selected Background color.
- PNG export passes the Background value to the standard PNG export helper.
- Video export keeps the background even when Background is off.

## Image Export

- Every app with `Export PNG` exposes a separate `Image Export` section.
- `Image Export` uses two `select` controls in one compact two-column inline row:
  - `export.image.format`, default `png`, with baseline `PNG` and `JPG` options;
  - `export.image.resolution`, default `4k`, with baseline `2K`, `4K`, and `8K` options.
- Still-output apps place `Image Export` directly above sticky footer actions.
- Animated apps with both image and video export place `Image Export` immediately before `Video Export`.
- PNG export resolves the concrete scene frame through the panel action context, then calls `createToolcraftPngExportCanvas({ frame, includeBackground, resolution, state, render })` and `renderRuntimeSceneToCanvas(canvas, frame)` before drawing product pixels.
- The selected `export.image.resolution` must produce real 2048/4096/8192px long-edge PNG output for 2K/4K/8K. Retina sizing is only the fallback for current/omitted resolution.

## Video Export

- Animated product apps expose `Export Video` and `Export PNG`.
- Any app with `Export Video` must enable the top Toolcraft timeline.
- Animated apps expose a separate `Video Export` section directly above sticky footer export buttons, after `Image Export`.
- `Video Export` uses two `select` controls in one compact two-column inline row by default:
  - `export.video.format`, default `mp4`, with baseline `MP4` and `WebM` options;
  - `export.video.resolution`, default `current`, with baseline `Current` and `4K` options.
- Stack the pair only when labels or selected values would clip, and record that fit reason in the worklog.
- Use `MediaRecorder.isTypeSupported(...)` or an explicit encoder/transcoder capability check before choosing the actual MIME/container.
- `MOV` and `ProRes` are not baseline browser outputs; use them only with a custom encoder/transcoder plus acceptance and performance coverage.
- Use `getToolcraftVideoExportSize` for video dimensions. `current` uses current canvas/output size with even encoder-safe rounding; `4k` fits inside 3840x2160, preserves aspect ratio, and returns even dimensions.
- Offline rendered-frame video export must write timeline-based timestamps. `canvas.captureStream()` plus `MediaRecorder` records wall-clock time and cannot be the only duration mechanism for heavy renderers.
- Browser acceptance must load the exported blob as a video, wait for metadata, and compare `video.duration` with the runtime timeline duration.

## Sticky Product Actions

- Product apps always expose export in sticky `panelActions`.
- Still products expose `Export PNG`.
- Animated products expose `Export Video` plus `Export PNG`.
- Clipboard copy is optional and never replaces export.
- Export PNG and Export Video use `icon: "upload-simple"` to match the runtime `Export Settings` action.
- Async export/download/copy/generate/apply handlers return the real Promise from `onPanelAction`. The runtime shows the sticky footer top accent indicator while the Promise is pending.
- Use `reportProgress(0..1)` for determinate progress when available.
