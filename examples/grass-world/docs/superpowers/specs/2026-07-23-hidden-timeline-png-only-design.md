# Hidden Timeline and PNG-only delivery design

Verification tier: Tier 3

Reason: the visible Timeline transport and Video Export workflow are removed while the retained WebGL animation continues autonomously. Renderer technique, scene resources, animation code, and hidden video implementation remain intact.

Run: no checks by explicit user request.

Skip: unit, typecheck, build, browser, performance, and protected delivery.

## Product behavior

- Omit `panels.timeline` so the floating Timeline and the Setup Timeline switch are not rendered.
- Keep the hidden runtime timeline state and all retained timeline/video phase code.
- Drive visible preview motion from a product-owned six-second autonomous loop whenever Grass Studio is mounted, because the runtime playback clock is owned by the omitted Timeline panel. Static wind may render zero wind force, but it must not pause butterfly or other autonomous animation.
- Remove Timeline from persistence and advance to v22 so a previously paused state cannot override autoplay.
- Keep `grassVideoExportSection`, the video action descriptor, encoder, exporter, and MIME-selection code available but do not include their controls or action in the visible schema.
- Keep only `Image Export` and the sticky `Export PNG` action.
- Reclassify animation intent as autonomous with no user-facing transport, duration, loop, scrub, play/pause, or export-at-time controls.

## Acceptance metadata

Remove visible Video Export and Timeline rows from current acceptance and section inventory. Update the PNG action, Background copy, persistence description, product summary, and renderer strategy copy. Existing video implementation and historical tests are not deleted.
