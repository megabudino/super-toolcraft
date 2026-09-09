# Mobile Terrain Touch Interaction Plan

Verification tier: Tier 3

Reason: A new touch gesture changes live canvas input ownership and the existing WebGL wind/surface-tilt output path, but does not change schema state, renderer workload, geometry, materials, timeline, export, or resource lifecycles.

## Product behavior

- In `Wind` and `Simulate`, the first finger pressed on visible Terrain owns one interaction until release or cancellation.
- Touch-down activates the same terrain-hit state as mouse hover. Drag direction feeds the same projected wind controller and screen-direction surface-tilt controller already used by mouse movement.
- Touch release, cancellation, lost capture, mode exit, or component cleanup clears pointer wind and returns Simulation tilt through its existing smoothing/release behavior.
- A touch that begins outside Terrain is not captured and remains available to Toolcraft canvas/view interaction.
- Mouse behavior remains hover-only; mouse drag continues to belong to view orbit. Static and Sway keep existing mobile canvas behavior.
- Multi-touch cannot replace the first active terrain touch. The product captures only the accepted primary touch pointer.

## Implementation

1. Add a small input-ownership controller to `src/app/grass/grass-pointer-direction.ts` and unit coverage in `grass-pointer-direction.test.ts` for terrain-only capture, active-pointer move/end, foreign pointer rejection, and reset.
2. Update `use-grass-pointer-direction.ts` with touch `pointerdown`, captured `pointermove`, `pointerup`, `pointercancel`, and `lostpointercapture` handling. Reuse the existing RAF-coalesced `publish`, terrain raycast, wind state, screen direction, and clear paths.
3. Prevent the accepted terrain touch from reaching the orbit handler while leaving mouse and non-terrain touch input untouched. Publish touch-active diagnostics for browser proof.
4. Mark the live preview as touch-interactive only in Wind/Simulation and apply local `touch-action: none` in those modes so mobile browsers do not cancel the accepted drag.
5. Add one runtime acceptance row and a product-owned mobile browser test using Chrome touch input. Prove touch-down hits Terrain, touch-drag changes persistent WebGL output and direction/tilt diagnostics, and touch-end clears the active state and settles tilt.
6. Update product readiness, performance impact ownership only if a new production module is introduced, and the worklog. No controls, section inventory, persistence, settings transfer, layers, timeline, or export changes are required.

## Performance

- Reuse the existing `renderer.pointerDirection` / `renderer.pointerTerrainHit` interaction and `grass-scene-render` invalidation path.
- Keep one pending point and one requestAnimationFrame regardless of pointer-event frequency.
- Touch input adds no workload dimension, renderer pass, draw call, texture, geometry, or allocation per rendered frame.
- Run the existing affected pointer-direction performance gate only if the canonical pipeline or measured path changes; do not run a full performance refresh.

## Verification

- Focused pointer input/direction, wind, surface-tilt, acceptance, and readiness Vitest tests.
- `npm run typecheck`, `npm run ai:check`, and production build.
- Product-owned mobile touch Playwright test plus controlled-browser inspection of touch ownership and output diagnostics.
- Current-source kernel receipt only if the performance gate reports it stale.
- One `npm run verify:delivery` invocation for the coherent Tier 3 batch, then confirm the existing dev URL.
