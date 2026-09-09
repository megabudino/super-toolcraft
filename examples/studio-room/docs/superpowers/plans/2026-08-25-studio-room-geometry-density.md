# Studio Room Geometry & Density Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. Design source: `docs/superpowers/specs/2026-08-25-studio-room-geometry-density-design.md` — it carries the unit-system diagnosis; read it before touching the renderer.

**Goal:** Stripes end exactly on the back wall (no gaps, including rounded corners, under parallax/scroll); the wall border gets its own thickness/color controls; tile density widens to 1–6 per surface; tiles never share edges — at rest, per shuffle, and mid-slide.

**Repositories:**
- Website: `/Users/kusnizza/Projects/recraft/recraft-landing/recraft-v4-styles` (renderer `src/components/pages/home/pre-footer-room.tsx` + `pre-footer-room-motion.ts` + `studio-room-settings.ts`)
- Toolcraft workspace: `/Users/kusnizza/Projects/recraft/recraft-landing/recraft-tools/studio-room`

**Verification note (family practice):**

```md
Verification tier: Tier 3 (renderer geometry + schema/protocol change on an existing product)
Run (default): focused website unit tests (adjacency picker, slide-path fallback, normalizer, offset/radius math where extracted pure); existing room test files green (studio-room-settings, media-store, preview-boundary, motion); focused Toolcraft values/product tests; pnpm typecheck both repos; oxfmt touched files; manual checklist Phase 3.
Skip: broad build/browser/delivery/performance suites; no bare pnpm verify:delivery without an explicit request.
```

---

## Phase 0: Preflight

- [ ] Toolcraft routes: **Schema, controls, defaults, persistence, actions** + **Renderer, canvas output, visual technique**; open one per read before code: `docs/toolcraft/schema-reference.md`, `component-rules.md`, `renderer-technique.md`, `performance.md`.
- [ ] Verify the live `STUDIO_ROOM_PREVIEW_VERSION` (2 at the time of writing) on both sides; `git status` clean; both dev servers up.
- [ ] Read in place: `pre-footer-room.tsx` (`getBackWall`/`getFrame`/`Line`/`Frame`/`Grid`, `wallX`/`wallY`, `.backWall` CSS), `pre-footer-room-motion.ts` (`pickNextTileChange`, `createTrailCrossSteps`), and the `Room`/`Tiles` sections in the workspace `app-schema.ts`.

---

## Phase 1: Website — geometry unification

### Task 1: One offset system for wall and lines

**Files:**
- Modify: `src/components/pages/home/pre-footer-room.tsx` (+ `pre-footer-room.module.css`)

- [ ] Measure the stage with a ResizeObserver (`stageSize` state/motion values). Replace `wallX`/`wallY` (`vw`/`svh` + px scroll nudge) with px transforms derived from the same `gridOffsetX/Y`: `wallPx = offset / 1000 × stageSize` — one truth for wall and line endpoints; delete the `13vw`/`10svh`/`40px` magnitudes and the duplicated scroll-nudge math (the wall consumes the already-nudged `gridOffsetY`).
- [ ] The trail lines (`RoomDepthTrail` → `TrailLines`) and tiles already consume `gridOffsetX/Y` — confirm nothing else references the deleted wall transforms.
- [ ] Guard the initial render before the first measurement (hide nothing; fall back to the previous behavior of 0 offsets — offsets are 0 at rest anyway).

### Task 2: Overshoot under the wall and one radius source

**Files:**
- Modify: `src/components/pages/home/pre-footer-room.tsx` (+ module.css)

- [ ] Add `WALL_RADIUS` (viewBox units; measure the current visual ≈ from the applied `border-radius`, keep the look). `.backWall` border-radius becomes `WALL_RADIUS / 1000 × stage width` px (measured stage), and gets an explicit opaque `background` matching the section (`#f1f6de` today — read the actual current value).
- [ ] Extend every column/row `Line` beyond its wall endpoint along its own direction to depth `WALL_OVERSHOOT_DEPTH ≈ 1.12` (constant chosen ≥ radius coverage; compute the endpoint with the existing `getSurfacePoint`-style math at depth > 1 so the offset composition stays identical). Apply the same overshoot to `TrailLines`. Lines now tuck under the opaque wall and visually terminate exactly on its edge, corners included.
- [ ] `Frame` rings: interpolate `rx` from the current near value to `WALL_RADIUS` at depth 1 (replace `10 + depth·28`).
- [ ] Verify z-order stays: fineGrid (0) < tiles (1) < grid (2) < trail (3) < wall (4); the wall must cover the overshoot of all three line layers.

### Task 3: Wall border settings

**Files:**
- Modify: `src/components/pages/home/studio-room-settings.ts` (+ `studio-room-settings.test.ts`)
- Modify: `src/components/pages/home/pre-footer-room.tsx`

- [ ] Add `room.wallBorder = { width: 1.3 (0..12, step 0.5), colorOpacity: { hex: '#6F7946', opacity: 34 } }` to types/defaults/normalizer (missing group → defaults; v2 applied JSON valid); persist through Apply.
- [ ] `.backWall` border derives only from `wallBorder` (width px; `color-mix` from hex+opacity); remove the `grid.color`/`grid.thickness`/`grid.opacity × fog` coupling and the now-unused CSS vars.
- [ ] Normalizer tests: defaults, clamps, hex validation, old payloads.

### Task 4: Density and non-adjacency

**Files:**
- Modify: `src/components/pages/home/pre-footer-room-motion.ts` (+ its test file)
- Modify: `src/components/pages/home/pre-footer-room.tsx`
- Modify: `src/components/pages/home/studio-room-settings.ts`

- [ ] Export `cellsShareEdge(a, b)` (same surface and: same depth ∧ |Δcross| = 1, or same cross ∧ |Δdepth| = 1) from the motion module.
- [ ] `createInitialLayout`: after the preferred/baseline ordering, pick greedily skipping any candidate that shares an edge with an already-selected cell; place up to the requested count, fewer if the constraint can't be met; expose the actual count as `data-studio-room-tiles="<n>"` on the tiles svg.
- [ ] `pickNextTileChange`: filter `freeCells` to destinations non-adjacent to every assignment except the moving source (keep the surface-balancing logic untouched).
- [ ] Slide safety: add `slidePathIsClear(source, destination, occupied)` — walk the straight path in cell space (supercover of crossed cells); if any crossed or edge-touched cell is occupied, the change downgrades `shuffleStyle` to `swap` for that move. Unit-test both the clear and blocked cases.
- [ ] `tiles.perSurface` clamp widens to 1–6 in the settings normalizer.
- [ ] Unit tests: initial layout never contains an adjacent pair for every `perSurface` × grid-divisions combination in range; shuffle results keep the invariant over a seeded 500-step run.

### Task 5: Website receiver bump and checks

- [ ] `studio-room-preview-boundary.tsx`: protocol version → current + 1; boundary test updated.
- [ ] `oxfmt` touched files; `pnpm typecheck`; run the room-related unit-test files. Manual: standalone `/toolcraft/studio-room` — move the pointer hard and scroll: no gap ever opens between stripes and the wall, corners stay attached.

---

## Phase 2: Toolcraft — values, controls, records

### Task 6: Values, protocol, schema

**Files:**
- Modify: `src/app/studio-room-values.ts` (+ `studio-room-values.test.ts`)
- Modify: `src/app/studio-room-preview-protocol.ts`
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/studio-room-preview-pipeline.ts`, `src/app/app-performance.ts`

- [ ] Values: targets `room.wallBorder.width` / `room.wallBorder.colorOpacity`; mirror defaults/clamps; widen `tiles.perSurface` to max 6; website-identical composition into the payload.
- [ ] Protocol: version → current + 1.
- [ ] Schema: `Room` section (same entity — the wall is the room's terminal face) gains `Border width` slider (px, 0–12, step 0.5, `strength`) and `Border color` colorOpacity; `Tiles` section: `Per surface` discrete slider max 4 → 6, description notes tiles never touch edges so high densities may place fewer when the grid is small. Applicability `always` (both work in every mode); no label collides with a section title.
- [ ] Pipeline: add the two border targets to the settings target list (existing convention), bump `runtimeId` suffix; performance config: extend derived scenarios; note in `performanceRisks` that adjacency filtering is O(cells × tiles) at shuffle ticks only.

### Task 7: Acceptance data and worklog

**Files:**
- Modify: `src/app/app-acceptance-data.ts`
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] Inventory: extend the `Room` entry's targets + groupingReason (depth, vanishing point and wall border together define the room's terminal face); acceptance rows for the two border controls (`product-output`: the wall outline thickens/recolors live) and an updated `Per surface` row observable (density changes and tiles never share edges); `interactionOwnership` property-edit entries for the new targets.
- [ ] Worklog `## Decision Trail: Studio Room geometry, wall border, density`: diagnosis (three unit systems), decision (single offset source + overshoot under the opaque wall + one radius constant), invariant (no shared edges incl. slide-path fallback to swap), rejected alternatives (masking lines with an inverted rounded-rect clipPath — equivalent result but a second radius consumer; per-line trimming against the arc — fragile trigonometry; keeping vw-based wall motion with a correction factor — still breaks off-viewport stages), protocol bump, checks actually run, risks (stale preview tab until reload; very high density on a coarse grid places fewer tiles by design).

---

## Phase 3: Manual tuning checklist (default gate)

- [ ] Reload the workspace (new-version handshake). Sweep the pointer across the canvas and scroll the preview: stripes stay glued to the wall edge the whole time — sides and rounded corners; trail flashes also terminate on the wall.
- [ ] `Border width` / `Border color` act live and no longer follow Main Grid color/thickness/opacity or Fog; width 0 removes the outline cleanly.
- [ ] `Per surface` 1 → 6: density visibly grows; at any value no two images touch edges (check floor especially); on a coarse grid (few columns/rows) high density places fewer tiles without errors; shuffle (swap and slide) never creates contact; slide moves that would cross a neighbor fade instead.
- [ ] Depth/vanishing extremes, fog, fine grid on/off, hover lift, reduced motion: geometry stays attached everywhere; Reset/undo/reload/Apply round-trip (applied JSON gains `wallBorder`, widened density persists).
- [ ] Homepage pre-footer: identical behavior in the real section; no console errors.
- [ ] Optional proof path (on request): browser case polling line-end vs wall-edge positions during a scripted pointer sweep, plus a DOM assertion that no two tile matrices produce edge-adjacent cells.
