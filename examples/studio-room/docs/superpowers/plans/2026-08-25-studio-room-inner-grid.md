# Studio Room Inner Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax. Design source: `docs/superpowers/specs/2026-08-25-studio-room-inner-grid-design.md` — it fixes the alignment math, the frame-fade mask, defaults/ranges, and the normalizer trap.

**Goal:** A switchable continuation of the room grid inside the back-wall rectangle, fading from the panel edges inward. Controls: `Active`, `Depth` (% reach), `Falloff` (decay exponent), `Opacity`. Color/thickness/divisions inherit the Main Grid live. Default off; Apply persists.

**Repositories:**
- Website: `/Users/kusnizza/Projects/recraft/recraft-landing/recraft-v4-styles` (renderer `src/components/pages/home/pre-footer-room.tsx`, settings `studio-room-settings.ts`)
- Toolcraft workspace: `/Users/kusnizza/Projects/recraft/recraft-landing/recraft-tools/studio-room` (protocol v5 at the time of writing)

**Verification note (family practice):**

```md
Verification tier: Tier 2–3 (new render layer + schema/protocol change on an existing product)
Run: pure-helper unit tests (fractions, mask stops, normalizer); existing studio-room test files green; workspace values/section/product tests; pnpm typecheck both repos; oxfmt touched files; manual checklist Phase 3.
Skip: broad suites, measured performance (static SVG layer, ≤ columns+rows lines, no per-frame work).
```

---

## Phase 0: Preflight

- [ ] Verify the live `STUDIO_ROOM_PREVIEW_VERSION` (5 at the time of writing) on both sides; take current + 1. `git status` clean; both dev servers up.
- [ ] Read in place: `pre-footer-room.tsx` — the `.backWall` block (opaque fill, `overflow: hidden`, radius source, children order) and how `settings.grid` reaches components; `studio-room-settings.ts` — `normalizeRoom` and its **key whitelist** `['depth', 'vanishing', 'wallBorder', 'wallFill']`; the workspace's `Room`/`Main Grid` sections and values modules for conventions.

---

## Phase 1: Website

### Task 1: Settings group

**Files:**
- Modify: `src/components/pages/home/studio-room-settings.ts` (+ `studio-room-settings.test.ts`)

- [ ] Add `StudioRoomInnerGridSettings` (`enabled: false`, `depth: 22` % 5–60, `falloff: 1.6` 0.5–4, `opacity: 40` % 0–100) as `room.innerGrid` with a `normalizeInnerGrid` (missing → defaults; clamps; strict boolean).
- [ ] **Extend the `normalizeRoom` key whitelist with `'innerGrid'`** — without this every v6 payload is rejected silently. Add a regression test: a `room` object containing `innerGrid` normalizes instead of falling back.
- [ ] Tests: defaults for missing group; clamps; v5 applied JSON stays valid; persisted shape includes the group.

### Task 2: Pure geometry helpers

**Files:**
- Create: `src/components/pages/home/studio-room-inner-grid.ts` (+ `.test.ts`)

- [ ] `resolveInnerGridLines(columns, rows)` → vertical fractions `i/columns` (i = 1…columns−1) and horizontal `j/rows` — edge indexes skipped.
- [ ] `resolveInnerGridMaskStops(falloff, stopCount = 6)` → `{ offset, alpha: (1 − offset)^falloff }[]` normalized 0…1 for the gradient.
- [ ] Tests: fraction counts and values for several divisions; no 0/1 fractions; stops monotonic, `alpha(0) = 1`, `alpha(1) = 0`, exponent shapes verified for falloff 0.5 / 1.6 / 4.

### Task 3: Inner grid layer in the back wall

**Files:**
- Modify: `src/components/pages/home/pre-footer-room.tsx` (new `InnerGrid` component in-file or beside it, per the file's size conventions)

- [ ] Render inside `.backWall`, **before** `{children}`: an `aria-hidden`, `pointer-events-none` SVG (`absolute inset-0`, `preserveAspectRatio="none"`, viewBox 0 0 1000 1000) when `settings.room.innerGrid.enabled`.
- [ ] Lines from `resolveInnerGridLines(settings.grid.columns, settings.grid.rows)` at `fraction × 1000`; stroke `settings.grid.color`, `stroke-width settings.grid.thickness` with `vector-effect="non-scaling-stroke"` (thickness in px like the outer grid, not stretched by the viewBox mapping); group opacity `innerGrid.opacity / 100`.
- [ ] Frame fade mask: an SVG `<mask>` — black base, four white-to-transparent gradient rects (top/bottom/left/right) whose gradient stops come from `resolveInnerGridMaskStops(falloff)` and whose extent is `depth` (% of the smaller panel side; convert via the measured panel aspect — the viewBox is stretched, so per-axis extents differ: `depthY = depth × 10` viewBox units on the vertical axis and `depthX = depth × 10 × (panelHeight/panelWidth)` on the horizontal, using the same measured stage/panel size the wall already derives). Overlapping corners naturally take the max of the two edges' alpha — matching the nearest-edge fade.
- [ ] Diagnostics: `data-studio-room-inner-grid` (`on`), `data-inner-grid-lines` (count). Confirm the heading/CTA render above and the rounded corner clips the lines.
- [ ] Alignment check (dev): with the outer grid at any columns/rows and parallax active, every wall line meets its continuation at the panel edge with no kink — anchored fractions make this structural; verify visually at extreme vanishing-point values.

### Task 4: Website checks

- [ ] `oxfmt` touched files; `pnpm typecheck`; run the settings + helper test files and the existing room suites.
- [ ] Manual on the standalone route: toggle on — the grid continues into the panel and dissolves by `Depth`; falloff reshapes the decay; opacity scales the layer; outer grid color/thickness/divisions changes propagate live; off — panel byte-identical to today.

---

## Phase 2: Toolcraft workspace

### Task 5: Values, protocol, section, records

**Files:**
- Modify: `src/app/studio-room-values.ts` (+ test)
- Modify: `src/app/studio-room-preview-protocol.ts`
- Modify: `src/app/app-schema.ts` (or its sections module)
- Modify: `src/app/studio-room-preview-pipeline.ts`, `src/app/app-performance.ts`
- Modify: `src/app/app-acceptance-data.ts`, `docs/toolcraft/agent-worklog.md`

- [ ] Values: targets `room.innerGrid.enabled / .depth / .falloff / .opacity`; website-identical defaults/clamps; composed into the payload. Protocol version → current + 1; product/protocol test pins updated.
- [ ] Schema: new section `Inner Grid` per the spec table (switch `mode`-role; three sliders `strength`, conditional on the switch; descriptions carry the inheritance contract and the edge-inward Depth semantics). Insert after the `Room` section; no label collides with a title.
- [ ] Pipeline: append the four targets to the settings target list (existing convention), bump the `runtimeId` suffix; performance config: extend derived scenarios; risk note — static SVG of ≤ (columns−1)+(rows−1) lines, re-rendered only on settings commit.
- [ ] Acceptance/inventory in this workspace's established style: section inventory entry, four control rows (observables: continuation appears/disappears; reach widens; decay hardens/softens; layer dims), `interactionOwnership` property-edit entries. Worklog Decision Trail entry: fraction-anchored continuation (why it is structurally seamless), frame mask with exponent stops, normalizer-whitelist extension, rejected alternatives from the spec, protocol bump, checks run.

---

## Phase 3: Manual tuning checklist (default gate)

- [ ] Reload the workspace (new-version handshake). `Active` on: the outer grid visibly continues into the white rectangle from all four edges and dissolves toward the center; every line meets its wall counterpart at the edge without a kink — including while sweeping the pointer (parallax) and at extreme Depth/Vanishing values.
- [ ] `Depth` 5→60 % widens the reach; `Falloff` 0.5 (soft, lines almost reach the center) → 4 (hard, thin rim); `Opacity` scales the whole layer without touching the outer grid.
- [ ] Change Main Grid color, thickness, columns, rows — the continuation follows live; Fine Grid toggling changes nothing inside the panel (not continued by design).
- [ ] Heading and CTA stay above the lines and fully readable; rounded corners clip cleanly; wall border and fill unchanged.
- [ ] `Active` off → sliders hide, panel byte-identical to today; Reset/undo/reload round-trip; Apply persists `room.innerGrid` into the applied JSON and an open homepage tab receives it.
- [ ] No console errors; resize the window — the % Depth keeps the same visual proportion.
