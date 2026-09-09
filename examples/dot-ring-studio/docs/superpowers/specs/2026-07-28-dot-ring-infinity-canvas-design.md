# Dot Ring Studio Infinity Canvas Design

## Goal

Add the current Toolcraft starter's runtime-owned Infinity canvas to Dot Ring
Studio without changing the existing finite 1024×1024 default, audio-reactive
ring behavior, playback timeline, persistence, or delivery actions.

## Verification Classification

Verification tier: Tier 4

Reason: The visible request is a canvas feature, but this exported app contains
an older signed Toolcraft framework copy. The supported implementation refreshes
the generated framework from the current starter, then adapts the custom Canvas
2D renderer, image export, video export, acceptance, and performance ownership
to the current scene-bounds contract.

Run: `pnpm ai:check` before implementation; focused unit tests for ring geometry,
scene bounds, schema, and acceptance; focused browser proof for Infinity mode,
restoration, background dependency, pan/zoom, and bounded image/video export;
`pnpm verify:delivery`; then `pnpm dev` and an agent-controlled browser check.

Skip: the operator-only full `pnpm verify:perf` audit because the request is
functional canvas behavior rather than a full performance certification. The
protected delivery runner selects the affected bounded responsiveness proof.

## Product Decisions

- Keep `canvas.sizing.mode: "editable-output"`. The runtime owns
  `canvas.infinity`, finite size controls, reset, undo/redo, persistence,
  settings transfer, viewport background, radar, pan, and zoom.
- Keep the product view interaction intent non-spatial. Infinity canvas changes
  the two-dimensional Toolcraft viewport, not a product camera model.
- Keep the playback timeline. Ring animation, scrub, PNG-at-time, and video
  timing remain timeline-driven.
- Keep layers disabled because the output is one procedural ring.
- Keep the Canvas 2D renderer and share one deterministic bead-geometry plan
  between preview, scene bounds, PNG, and video.
- Use the current starter's standard Background pair. In infinite mode the
  runtime fills the viewport; the product renderer suppresses its bounded fill.
- Add the current starter's required Image Export section before Video Export.
  The existing Export PNG and Export Video sticky actions remain the delivery
  surface.

## Control Section Inventory

| Section | Product entity or stage | Targets | Reason |
| --- | --- | --- | --- |
| Runtime Setup | Workspace and transport | settings transfer, Background, Infinity canvas, Background color, aspect ratio, finite width/height, resolution scale, Timeline | Starter-owned technical controls must stay canonical and are not authored by product code. |
| Source Audio | Motion input | `audio.source` | Audio import and fallback source are one workflow stage. |
| Ring Pattern | Procedural geometry | `ring.radius`, `ring.density`, `ring.rows` | These targets define the ring's primitive layout and workload. |
| Bead Colors | Ring appearance | `ring.color1`…`ring.color5`, `ring.colorSpread` | The palette edits one visual entity. |
| Wave Motion | Animation behavior | `wave.*` | These targets jointly define displacement and travel behavior. |
| Image Export | Still delivery | `export.image.format`, `export.image.resolution` | Current starter requires explicit still format and resolution. |
| Video Export | Animated delivery | `export.video.format`, `export.video.resolution` | Video container and size are one export stage. |
| Sticky Export | Final actions | Export PNG, Export Video | Runtime-owned pending/progress feedback stays in panel actions. |

## Framework Refresh

Generate a fresh standalone app from
`/Users/kusnizza/Projects/primeui-v2` into a temporary directory. Use its
integrity manifest as the allowlist for copying signed runtime, UI, host,
contract, browser-evidence, and verification files. Preserve product-owned ring
source, product tests, worklog, this spec, the implementation plan, package
identity, and local verification state. Reconcile dependencies from the fresh
manifest and reinstall only because the framework dependency set changes.

## Canonical Ring Scene Bounds

Refactor the renderer's bead placement into a deterministic frame-geometry
helper. Drawing and bounds consume the same relaxed bead positions, bead radius,
and shadow extent.

- Finite local coordinates remain `0..canvas.width` and
  `0..canvas.height`.
- Infinite world coordinates center the dormant finite frame at the Toolcraft
  world origin using `(-width / 2, -height / 2)`.
- Still bounds union every visible bead in the current timeline frame.
- Video bounds sample the exact export-frame cadence across the requested time
  range and union one stable envelope.
- The selected Background color never expands product scene bounds.
- Empty or unsafe bounds return no rectangle so runtime produces a typed visible
  export failure.
- The synchronous provider uses the resolved uploaded-audio analysis cache when
  available and the bundled profile otherwise. Preview and panel actions pass
  the exact currently resolved profile to the same bounds function.

## Preview And Export

Finite preview remains a 1024×1024 artboard by default. Infinite preview sizes
and positions the product canvas at the stable animation envelope, translates
the existing local drawing coordinates into that scene rectangle, and calls
`shouldIncludeToolcraftPreviewBackground` so only the runtime viewport owns the
infinite background.

PNG and video resolve their output frame through
`resolveSceneExportFrame`. PNG uses the current-frame rectangle and standard
image format/resolution settings. Video uses one full-timeline envelope for all
frames. Finite exports continue to use the full finite canvas.

## Acceptance

Typed acceptance must cover:

- `mode-and-restoration` through viewport-side-effect evidence;
- `scene-bounds-image-export` through exported bytes;
- `scene-bounds-video-export` through exported bytes.

Browser proof must show Infinity canvas in Setup, removal/restoration of finite
size UI and artboard, persistence plus undo/redo, live viewport background
dependency, stable pan/zoom/radar behavior, current-frame image cropping, and
one stable video envelope with preserved duration.

