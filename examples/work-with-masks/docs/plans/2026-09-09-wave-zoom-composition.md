# Wave zoom composition

Request: «почини проблему что при зуме канваса у меня зумится видео. сайт просто должен приближаться и отдаляться а масштаб не должен меняться». Clarification: «Фон с волной».

Later focused functional renderer correction, not a performance iteration. Keep the foreground website/video, wave placement, camera values, animation and all controls unchanged. Toolcraft's world transform remains the sole visual zoom owner.

Diagnosis: the wave binding derives the camera's full frame from transformed DOM backing dimensions, coupling projection aspect to zoom/DPR rounding. It does not subscribe to zoom; a paused 30→40% zoom leaves backing at 3391×1296 until a same-phase redraw updates it to 4522×1728. The native website and lower video retain their logical size; no changes are needed there.

Implementation: add a focused preview-frame helper in `src/app/renderer` separating canonical wave dimensions/projection from exact zoom × DPR × render-scale backing. Subscribe to canonical zoom and logical wave size and refresh the retained renderer on zoom, including while paused. Keep animation coalescing, resource identity and camera values. Declare zoom's GPU rerasterization in the existing pipeline rather than claiming no renderer work.

Verification tier: Tier 3, later focused canvas correction.
Run: preview-frame/camera unit tests; one focused native-hero browser case extended with paused toolbar and modifier-wheel zoom, unchanged composition/relative layout, unchanged phase and refreshed full-resolution backing; production build for that supported preview-mode browser run. Embedded visual check and restore readable zoom/playback.
Skip: aggregate delivery, measured performance, unrelated controls, export/reload/full framework matrices. No changes to signed runtime, bootstrap, configs or dependencies.

Preflight: local systematic-debugging and writing-plans skills; workflow; broken behavior route (decision-contract, runtime-boundary → component-rules, renderer-technique → acceptance-testing, performance); renderer route adds core/performance. Existing renderer technique, typed passes/envelope/provider and assessment remain the authority; no new provider or workload boundary.

Completed: logical projection is independent of zoom and backing rounding; paused zoom schedules the retained renderer and bypasses scene/geometry/environment/shadow preparation when authored parameters are unchanged. Four focused unit tests, the production build and the single extended `hero.native-section` browser case passed. Embedded 40→30→40% inspection preserves the same wave phase/composition and immediately updates backing; playback was restored. No aggregate or measured performance proof was run.
