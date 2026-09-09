# Logo Sphere — Stable Card Stacking Order Implementation Plan

> **For agentic workers:** Follow `AGENTS.md` preflight (workflow routes: runtime boundary, renderer technique, timeline animation, acceptance testing) before editing. Steps use checkbox (`- [ ]`) syntax for tracking. This plan is a targeted correction; the unified WebGL renderer plan (`2026-09-08-unified-webgl-sphere-renderer.md`) inherits its ordering rule (see Section 5).

**Goal:** Stop Grid cards from swapping their overlap order in jumps while the sphere spins or is dragged. Overlapping cards must keep one fixed above/below relationship through the whole animation, like stickers stuck onto a ball.

**Architecture:** The draw order of projected cards stays the model's responsibility (`projectLogoSphere` returns cards in draw order), but for the Grid distribution the order becomes view-independent: rear hemisphere first, then the front hemisphere in a fixed sticker order derived from the point index. Fibonacci and Rings keep true depth order because their billboards are separate objects at distinct depths that rarely overlap. Every consumer that currently reads "array order = depth order" (WebGL playback depth, mesh-detail budget) is switched to read either draw order or the card's `z` explicitly.

**Tech Stack:** TypeScript model module, Canvas 2D kernel, WebGL playback batch (until replaced), Vitest, Playwright.

**Verification tier:** Tier 3 — renderer/model behavior change without schema or control changes. Reason: draw order is product output; the change touches the pure model, the Grid renderer's detail budget, and the playback geometry. Run: `pnpm ai:check`, `pnpm typecheck`, `vitest run src/app/logo-sphere-model.test.ts src/app/logo-sphere-renderer.test.ts src/app/logo-sphere-playback-geometry.test.ts`, `playwright test e2e/logo-sphere-sphere.spec.ts e2e/logo-sphere-timeline.spec.ts`, a browser pass in the running app, then one bare `npm run verify:delivery`. Skip: measured performance (no path cost changes; sorting cost is unchanged).

---

## 1. Diagnosis

### Execution note — 2026-09-08

Verification tier: Tier 3
Reason: Grid draw order and the Canvas fallback detail allocator change; schema, backing, source lifecycle, timeline transport, and export sizing do not.
Run: focused model/geometry/renderer unit tests; one dense playback/orbit browser regression and stacking inspection; one bare `npm run verify:delivery` for ownership-derived functional coverage.
Skip: duplicate aggregate/browser/export runs before the delivery gate, and all measured performance; the user requested no extra checks.

Preflight routes: renderer, timeline animation, visual mismatch. Read Plan and Implementation documents from `docs/toolcraft/workflow.md`, then acceptance Verification documents. Retain the existing workload envelope (6–500 cards), canonical passes, invalidation, and pending kernel assessment; this change replaces one comparator without changing pass frequency or lifecycle.

Implementation adjustment: the unified WebGL renderer is already delivered. Its geometry builder already encodes depth by draw position, so retain that encoding and its 16-bit-safe shadow bias, with regression coverage in the historical `logo-sphere-playback-geometry.test.ts` path. Do not recreate the removed playback renderer or `selectInteractionGridCards`. The unified plan's Section 3.2 and Task 2 already contain the requested carry-over rule. Existing Grid tests that infer depth from array position must instead select extrema by `z`.

Focused development observations: the new 312/500-point model tests failed on the old comparator and passed after the change. The three focused unit files passed (34 tests), and the existing dense playback/pause and orbit/release browser regressions passed. The 720-frame diagnostic exercises the actual implemented order and reports zero front-hemisphere overlapping-pair flips at both 312 and 500 points for diagonal and vertical spin. Live browser inspection completed a full cycle and a front drag at each count with unchanged 3840×2160 backing, stable pause pixels, and no page errors. A real 4096×2304 PNG matches the paused preview's stacking (256×144 comparison, mean channel delta 0.758/255). Diagnostic artifacts live in `.toolcraft/browser-artifacts/`; these observations are not measured performance or a delivery receipt.

### Where the order is decided

`projectLogoSphere` in `src/app/logo-sphere-model.ts` (line 626) sorts every frame by `left.z - right.z || left.index - right.index`, i.e. by the card center's view depth. That array order is the draw order everywhere:

- `renderLogoSphereFrame` (`logo-sphere-renderer.ts`) and `renderLogoSphereGridCards` (`logo-sphere-grid-renderer.ts`) paint the array in order (painter's algorithm) — steady, paused, dragged, and exported frames.
- `createLogoSpherePlaybackVertices` (`logo-sphere-playback-geometry.ts`, lines 36–58) maps each card's `z` to a GPU depth (`(maximumZ - z) / depthSpan`), so during Grid playback the hardware depth test also resolves every overlap by center depth — the same rule, just executed on the GPU.

### Why it jumps

Two Grid cards overlap on screen when they are within roughly one card span on the sphere (139 scene px at the default radius and logo size; the 312-point spacing is only 74 px, so most cards overlap several neighbours). For two neighbours at the same latitude, their centre depths are equal exactly when the pair straddles the front of the ball — the most visible spot — and the painter's/depth order flips there, so the card on top changes in a single frame. Cards on a sphere surface have no meaningful depth difference between each other, so "closer centre wins" is an arbitrary tie-break that re-decides itself continuously while the ball turns.

A pure-model simulation over one 12-second loop (720 frames, default settings, orientation `[0,0,5]`) counts overlapping pairs whose relative draw order changes between consecutive frames:

| Scene | Order flips between overlapping pairs per loop | of which both cards in the front third (`z > 0.5`) | frames with a visible flip (both cards opacity > 0.25, inside the mask) |
| --- | --- | --- | --- |
| Grid, 312 points, diagonal spin (current) | 2366 | 1059 | 517 of 720 |
| Grid, 312 points, vertical spin (current) | 2491 | 1103 | 533 of 720 |
| Grid, 120 points (current) | 287 | 140 | 103 of 720 |
| Grid, 30 points (current) | 0 | 0 | 0 (cards do not overlap at 30 points) |
| Fibonacci, 72 points (current) | 13 | 2 | 4 of 720 |

At 312 points the front of the ball re-stacks on 72 % of the frames — exactly the "z-index jumps" in the report. During playback the WebGL stripe update (one vertical quarter per frame) makes it worse, because neighbouring stripes can show two different orders of the same pair at once; that part is covered by the unified renderer plan.

### Proposed rule (sticker order)

For the Grid distribution, sort by `(hemisphere, index)`:

1. Rear hemisphere (`z < 0`) before the front hemisphere (`z ≥ 0`) — rear cards keep drawing under the front shell and their `fade.rearOpacity` look is unchanged.
2. Inside each hemisphere, a fixed sticker order by point index, descending (`index` high → low). Grid point indices run from the north pole to the south pole along the lattice, so northern cards end up on top of their southern neighbours, like roof shingles, and the card shadow (offset downward on screen) falls onto the card below it. The order is attached to the ball and rotates with it, so no pair ever re-stacks while spinning or dragging.

The same simulation with this rule: **0** flips among front-hemisphere pairs in every scenario. The only remaining order changes happen when a card's centre crosses the limb (`z = 0`), where a wrapped Grid card is a sliver about 6–10 scene px wide (the patch folds over the silhouette), its depth opacity is ≈ 0.29, and the radial mask has already faded it to ≈ 10–15 %; these transitions are not perceptible.

Fibonacci and Rings keep the current depth order. Their billboards are separate objects at distinct depths, they only overlap when Logo size exceeds the cell (13 flips per loop at 72 points, 0 at 30), and the limb transition of a full-size billboard would be more visible than the rare front flip. If the sticker rule is later wanted for billboards too, cross-fade the two hemisphere positions over `|z| < 0.08` (draw the crossing card twice with complementary alpha); it is not part of this batch.

Rejected alternatives: tie-breaking by `z + ε·index` (still flips at the front for neighbours with close indices unless ε overwhelms depth, which then draws rear cards over front ones); Voronoi/tangent-plane depth per pixel (view-independent, but every card gets clipped to its cell by all neighbours, cutting the logos at 312 points); order hysteresis (moves the jump, does not remove it); cross-fading around each crossing in the front (continuous but visibly "swimming", and expensive in Canvas 2D).

---

## 2. Target behaviour

- Grid: the stacking of overlapping cards is identical in every frame of the loop, during drag/inertia, on pause, and in export; the only order changes happen at the limb and are invisible.
- Fibonacci/Rings: unchanged pixels for every existing scene.
- No change to layout, sizes, opacity, shadows, strokes, mask, backing, controls, persistence, or export dimensions.
- The WebGL playback batch and the Canvas 2D frame agree on the order, so play/pause never re-stacks the ball.

---

## 3. File map

- Modify `src/app/logo-sphere-model.ts`: export `compareLogoSphereDrawOrder(distribution)` (Grid: hemisphere then descending index; others: `z` then index) and use it at the end of `projectLogoSphere`; document that the returned array is the draw order (rear-most first) and that `z` is still the depth for detail/opacity decisions.
- Modify `src/app/logo-sphere-model.test.ts`: keep "returns cards in stable rear-to-front draw order" for Fibonacci; add "keeps a view-independent stacking order for Grid cards" (Section 6).
- Modify `src/app/logo-sphere-playback-geometry.ts`: derive GPU depth from the array position (`depth = (length - 1 - position) / length`, front-most = smallest) instead of `z`; delete `minimumZ`/`maximumZ`/`depthSpan`.
- Modify `src/app/logo-sphere-playback-geometry.test.ts`: "emits one front-to-back GPU-depth-tested quad per selected point" asserts depth strictly decreases with array position, and a new case proves that two overlapping cards keep the same depth relation across two loop progresses that straddle the front crossing.
- Modify `src/app/logo-sphere-grid-renderer.ts`: `allocateLogoSphereGridSubdivisions` takes `Pick<ProjectedLogo, "size" | "z">[]` and removes detail in ascending `z` order (rear first) instead of array order, so the front-most cards keep their mesh detail regardless of stacking; `collectVisibleGridCards` is unchanged (it accumulates occlusion in draw order, which is still "later = on top").
- Modify `src/app/logo-sphere-renderer.test.ts`: "bounds dense Grid mesh detail while preserving the front-most cards" passes `z` values in a shuffled order and asserts that the four highest-`z` cards keep level 2.
- Modify `src/app/app-acceptance-data.ts` and `docs/toolcraft/agent-worklog.md`: wording that says "depth-sorted" for Grid becomes "rear hemisphere, then fixed sticker order"; add a Decision Trail entry (Section 7).
- Modify `docs/superpowers/plans/2026-09-08-unified-webgl-sphere-renderer.md`: Section 3.2 item 3 and Task 2 use `compareLogoSphereDrawOrder` for the index buffer and encode GPU depth from draw position (Section 5 below).
- Modify `docs/superpowers/specs/2026-08-11-logo-sphere-design.md`: one sentence in "Rendering and performance model" about Grid stacking order.

---

## 4. Tasks

### Task 1: Preflight
- [x] Read `docs/toolcraft/workflow.md`, then the Plan/Implementation phases for renderer, timeline animation, and visual mismatch, and the acceptance-testing verification route — one document per read.
- [x] Record the verification note (Tier 3, above) and open the worklog entry with the actual execution request.
- [x] `pnpm ai:check` and `pnpm typecheck` pass on the untouched implementation tree.

### Task 2: Model (TDD)
- [x] Add the failing Grid test from Section 6 to `logo-sphere-model.test.ts`.
- [x] Implement `compareLogoSphereDrawOrder` and apply it in `projectLogoSphere`; keep the seam test (`loopProgress 0 === 1`) green.
- [x] Re-run the Section 1 simulation (`.toolcraft/browser-artifacts/simulate-stacking-order.mts`, kept next to the other diagnostics) and record: front-hemisphere flips = 0 at 312 and 500 points.

### Task 3: Consumers
- [x] Unified geometry: retain depth from draw position; test both index-buffer passes and a front-crossing overlapping pair.
- [x] Grid detail budget: `allocateLogoSphereGridSubdivisions` orders by `z`; update its test.
- [x] Confirm `collectVisibleGridCards` and `drawGridCardShadow` need no change (they use draw order or `z`, never the assumption "array is sorted by z"); `selectInteractionGridCards` was already removed.
- [x] `pnpm typecheck`; focused model, renderer, and geometry unit files. Remaining affected unit coverage belongs to the delivery gate.

### Task 4: Browser proof and docs
- [x] Focused existing dense Grid playback and orbit regressions; defer the remaining protected sphere/timeline/export proofs to the single delivery gate instead of repeating them.
- [x] Browser pass at Grid 312 and 500 points: full loop, front drag, stable pause, unchanged backing; inspect screenshots and compare a real 4K PNG with paused preview. Non-Grid code keeps its exact previous comparator; existing functional coverage remains in the gate.
- [x] Update acceptance wording, spec sentence, and worklog; confirm the unified renderer plan already contains Section 5 carry-over.
- [ ] One bare `npm run verify:delivery`, then `npm run dev`.

---

## 5. Carry-over into the unified WebGL renderer plan

- The geometry builder (`logo-sphere-gl-geometry.ts`) orders cards with `compareLogoSphereDrawOrder(distribution)` and encodes the GPU depth of every card as its draw position (`(count - position) / (count + 1)`, front-most smallest), never as centre `z`. The opaque front-to-back pass and the translucent back-to-front pass both iterate that single order (opaque cards in reverse), so early-z rejection is consistent with the painter's result and never re-decides an overlap.
- Task 2 tests of that plan replace "opaque cards are ordered front-to-back by depth" with "opaque cards are iterated in reverse draw order, translucent cards in draw order, and the depth attribute is monotonic in draw order".
- The "Draw order" bullet in its Section 3.2 is replaced by this rule.

---

## 6. Acceptance

Unit (`logo-sphere-model.test.ts`, "keeps a view-independent stacking order for Grid cards"): for `distribution: "grid"`, `visibleCount: 312`, default settings, and 48 evenly spaced `loopProgress` values plus two orbit poses, every pair of cards that are both in the front hemisphere keeps the same relative array order across all samples; the rear hemisphere always precedes the front hemisphere; the comparator is deterministic (`sort` twice gives the same array). For `distribution: "fibonacci"` the array stays sorted by `z`.

Unit (`logo-sphere-playback-geometry.test.ts`): depth attribute strictly decreases with draw position; the front-most card has the smallest depth; two overlapping cards keep their depth relation across loop progresses `0.24` and `0.26` at 312 points.

Unit (`logo-sphere-renderer.test.ts`): detail levels follow `z`, not array position.

Browser (existing app-owned proofs): `sphere.orbit`, `timeline.playback`, `export.image`, and every `sphere.*` observable still pass; canvas backing unchanged.

Visual (recorded in the worklog): at Grid 312/500 points, one full loop and a front drag show no re-stacking; play/pause and export match.

---

## 7. Worklog entry (to add during Task 4)

- Request: the user's message quoted verbatim.
- Root cause: `projectLogoSphere` sorts by centre depth every frame and every renderer path (Canvas 2D painter's order, WebGL playback depth test) follows it; for wrapped Grid cards on one surface the centre depth of overlapping neighbours crosses exactly at the front of the ball, so the top card flips there on 72 % of the frames at 312 points (simulation numbers from Section 1).
- Decision: Grid draws rear hemisphere first, then a fixed sticker order by descending point index; Fibonacci/Rings keep depth order; playback depth and the detail budget stop assuming a depth-sorted array.
- Alternatives rejected: as listed in Section 1.
- State/output mapping: no schema or target change; identical pixels for non-Grid scenes; Grid overlaps become view-independent.
- Performance intent: ordinary-product-work.
- Risks: the first Grid frame after the change re-stacks once relative to previously exported PNGs (expected); the limb transition is theoretically an order change but is a masked sliver; billboards keep their rare front flips until the optional cross-fade is requested.
