# Editable wave viewport correction

Request: «ври здесь при зуме все также тормозит и волна уезжает».
Confirmed: «сохраняем редатируемую волну в этом и смысл».

Keep the live editable Three.js wave, camera, light, masks, typography, foreground media, timeline and persistence. No video substitution or quality cap. This continues the localized zoom complaint, not a full audit.

Root evidence: with the default 2826×1080 wave, DPR 2 and render scale 2, 80% zoom requests 9043×3456 but Chromium allocates only 8192×3456 and emits texture/framebuffer errors. Full-frame postprocessing targets also reallocate for every zoom sample. Previous paused miniature acceptance did not cover this.

Implementation:
1. Keep the canonical world-space wave frame. Add a pure visible-window calculation in `hero-preview-frame.ts`: intersect the full wave with the browser viewing area plus filter guard pixels, at exact selected pixel density. This changes raster work only, not scene bounds. Retain the full coordinate frame for camera projection, masks and haze.
2. Update `hero-canvas.tsx` to render that window into a retained hidden WebGL surface, then copy only completed frames into the visible Canvas 2D presentation surface. Publish crop position and pixels together and wait for a GPU fence before another submission. During a transient viewport gesture, transform the last completed image with the host and rebuild selected-density backing after the gesture settles. Keep source geometry/environment cached. Observe viewport offsets/resizes for window coverage. Empty intersections do no GPU work.
3. Keep mask handles on the complete logical wave element, independent of the cropped raster canvas. Adjust cropped depth-of-field sampling so crop size cannot change its optical scale. Guard actual WebGL drawing-buffer dimensions instead of trusting canvas attributes.
4. Align the existing composite pipeline with viewport-window updates. Preserve the Three provider and workload/control boundaries; no runtime/host/config/dependency edits.
5. Add pure crop/camera/postprocessing tests and focused full-size browser regression with actual WebGL backing, high zoom, pixel composition and continuous gesture coalescing. Verify retained camera/mask editing and playback in the embedded app. Do not repeat unrelated content or export suites.

Verification tier: Tier 3, focused renderer correction.
Run: exact new renderer unit tests; focused `wave.viewport` browser case; typechecked production build; embedded inspection. The feature runner forces its signed development-server mode even when a preview environment variable is supplied; do not claim a production-preview browser run. The prior localized complaint permits one targeted zoom performance iteration, subject to the protected runner's existing baseline and kernel prerequisites. Do not fabricate a baseline, benchmark or receipt if those prerequisites are missing.
Skip: full audit, aggregate functional delivery, other controls/exports/reloads and dependency/provider migrations.

Preflight: project systematic-debugging and writing-plans skills; workflow; decision-contract, runtime-boundary, core/performance; component-rules, renderer-technique and performance. Canonical assessment currently has no errors and a pending `shade` Canvas2D/WebGL kernel comparison; the existing performance adapter registry is empty. Only functional and diagnostic evidence may be claimed until protected targeted proof is executable and passes.

Result: implementation, eight focused unit tests, typechecked build and embedded camera/mask/zoom/playback inspection completed. The enabled full-size browser regression did not pass its protected 30-second budget on the software GPU, including the standard DPR 1 / 200% case. No automated full-size pixel-parity or performance pass is claimed. Further certification needs an appropriate browser/GPU verification environment and the existing missing protected prerequisites; no signed configuration/runtime edits or full audit were undertaken.
