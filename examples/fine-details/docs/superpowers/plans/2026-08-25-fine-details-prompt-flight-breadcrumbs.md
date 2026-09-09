# Fine Details Prompt Flight Breadcrumbs & Corner Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. Design source: `docs/superpowers/specs/2026-08-25-fine-details-prompt-flight-breadcrumbs-design.md` — it supersedes the ghost model of the earlier prompt-flight spec; read it first.

**Goal:** The prompt window lands in the extreme bottom-left corner of the typography rectangle (left edge of the upper-left block, bottom edge of the lower-right block) with px offset fine-tuning, and the ghost effect becomes breadcrumbs: stationary copies dropped behind the moving window at a tunable spacing, vanishing sequentially first-dropped-first once the window arrives — spacing, opacity, falloff, vanish stagger/fade, delay, flight time and bounce all tunable from Toolcraft.

**Repositories:**
- Website: `/Users/kusnizza/Projects/recraft/recraft-landing/recraft-v4-styles` (the `fine-details-prompt-flight*` family under `src/components/pages/home/`)
- Toolcraft workspace: `/Users/kusnizza/Projects/recraft/recraft-landing/recraft-tools/fine-details`

**Verification note (family practice):**

```md
Verification tier: Tier 3 (behavior revision of an implemented animation + schema/protocol change)
Run (default): rewritten fine-details-prompt-flight.test.ts; fine-details-prompt-flight-runtime.test.ts; fine-details-settings.test.ts; fine-details-preview-boundary.test.ts; Toolcraft fine-details-prompt-flight-values/-toolcraft/-command-contract tests; npm run test:feature -- <changed prompt.flight.* acceptance ids> with the website dev server up; pnpm typecheck both repos; oxfmt touched files; manual checklist Phase 3.
Skip: broad build/browser/delivery/performance suites; no bare pnpm verify:delivery without an explicit request.
```

---

## Phase 0: Preflight

- [ ] Toolcraft routes: **Schema, controls, defaults, persistence, actions** + **Renderer, canvas output, visual technique**; open one per read before code: `docs/toolcraft/schema-reference.md`, `component-rules.md`, `renderer-technique.md`, `performance.md`; before browser proof `acceptance-testing.md`.
- [ ] Verify the live `FINE_DETAILS_PREVIEW_VERSION` on **both** sides (12 at the time of writing — this repo moves fast); take current + 1 everywhere below that says v13. `git status` clean in both repos; website and fine-details Toolcraft dev servers up.
- [ ] Read in place: `fine-details-prompt-flight.ts` (pure model to be rewritten), `-engine.ts` (`prepareFlightTarget`, `readFlightSafeBounds`, the **three** ghost-run construction sites: `createPromptGhostRun` helper + two inlined outbound copies), `-runtime.ts` (`FINE_DETAILS_PROMPT_FLIGHT_TUNING_FIELDS` type-enforced list, `shouldCreateFineDetailsPromptGhostRun`), `-ghosts.tsx`, `fine-details-settings.ts` (`normalizePromptFlight`), and Toolcraft `fine-details-prompt-flight-values.ts` / `-control-sections.ts` / `-toolcraft.test.ts`, `e2e/fine-details-prompt-flight-cases.ts` + `-evidence.ts`.

---

## Phase 1: Website — model, engine, rendering

### Task 1: Settings shape

**Files:**
- Modify: `src/components/pages/home/fine-details-settings.ts` (+ `fine-details-settings.test.ts`)

- [ ] `FineDetailsPromptFlightSettings`: remove `position`, `ghostCount`, `ghostStep`, `ghostSettle`; add `offset: {x, y}` (px, clamp −120..120, default `{0, 0}`), `ghosts: boolean` (default `true`), `ghostSpacing` (16..240, default 56), `vanishStagger` (0..400, default 70), `vanishTime` (80..1200, default 260); keep `enabled`/`startDelay`/`flightTime`/`bounce`/`ghostOpacity` as-is; `ghostFalloff` re-clamps to 0..40 with default 8 (per-copy dimming over a long chain, not a 6-copy fan).
- [ ] `normalizePromptFlight`: key-by-key reads of the new shape (old payloads carrying `position`/`ghostCount`/`ghostStep`/`ghostSettle` are silently ignored; missing new keys → defaults). Tests: defaults, clamps, legacy-payload migration, strict booleans.

### Task 2: Pure flight math — corner target and breadcrumb frames

**Files:**
- Modify: `src/components/pages/home/fine-details-prompt-flight.ts` (+ full rewrite of `fine-details-prompt-flight.test.ts`)

- [ ] `resolveFlightTarget(settings, sectionRect, promptRect, safeBounds?)`: drop the `position` area mapping; target = `bounds.left + settings.offset.x` for the prompt's left edge and `bounds.bottom − promptRect.height + settings.offset.y` for its top, where `bounds` falls back to the section rect exactly as today; keep the final clamp into the section. Keep `createFlightSchedule` / `resolveFlightProgress` / `resolveFlightDistance` untouched.
- [ ] Delete `resolveGhostStack`, `resolveGhostCruiseFrame`, `resolveGhostSettle`, `resolveGhostSettleFrame`, `GHOST_SETTLE_LAG_MS`. Add:
  - `MAX_PROMPT_FLIGHT_GHOSTS = 32` and `resolveBreadcrumbDropPlan(settings, pathLength)` → `number[]` of drop distances: `effectiveSpacing = max(ghostSpacing, pathLength / MAX_PROMPT_FLIGHT_GHOSTS)`; `dᵢ = i × effectiveSpacing` while `dᵢ ≤ pathLength − effectiveSpacing / 2`; empty when `pathLength ≤ 0`.
  - `resolveBreadcrumbCruiseFrame(plan, settings, distance, previouslyDropped)` → `{dropped: boolean[], opacities: number[]}`: copy i drops once `distance ≥ dᵢ` and **stays dropped** (bounce-return dips must not blink it out); opacity of a dropped copy = `(ghostOpacity/100) × (1 − ghostFalloff/100)^(newestDroppedIndex − i)`, 0 when not dropped.
  - `resolveBreadcrumbVanishFrame(plan, settings, elapsed)` → `{opacities: number[], isComplete}`: copy i fades from its landed cruise opacity to 0 over `vanishTime` starting at `i × vanishStagger` (smoothstep), **in place**; `isComplete` when every copy is done.
- [ ] Unit tests (real math, not string checks): plan spacing/cap/landing-gap invariants across ranges; count derived correctly for long paths (cap 32 reached via widened effective spacing, chain still spans the path); drop monotonicity under a bounce dip sequence; falloff 0 → uniform opacities; vanish order (copy 0 completes before copy k starts whenever `k × stagger > vanishTime`), completion; corner-target formula incl. clamp and missing-typography fallback; offsets shift the target 1:1.

### Task 3: Runtime and engine wiring

**Files:**
- Modify: `src/components/pages/home/fine-details-prompt-flight-runtime.ts` (+ `fine-details-prompt-flight-runtime.test.ts`)
- Modify: `src/components/pages/home/fine-details-prompt-flight-engine.ts`

- [ ] `FINE_DETAILS_PROMPT_FLIGHT_TUNING_FIELDS`: swap to the new field set (`offset.x`, `offset.y`, `ghosts`, `ghostSpacing`, `vanishStagger`, `vanishTime` in; removed fields out) — the exhaustiveness type errors until the list is exact. Tuning-key/cancel/restart semantics unchanged.
- [ ] `shouldCreateFineDetailsPromptGhostRun`: signature `{ghostsEnabled, motionPolicy, pathLength}` — drop the `direction` check (breadcrumbs on outbound **and** return, «при каждом движении») and the `ghostCount` argument. Update tests.
- [ ] Engine: consolidate the two inlined outbound ghost-run builders through the single `createPromptGhostRun` helper; the run gains `dropPlan: number[]` computed at creation (`resolveBreadcrumbDropPlan(flight, pathLength)`); a run with an empty plan is `null`. Return-direction runs now exist by the same rule. No other orchestration changes (states, stationary-viewport reset, resize reconcile stay as-is — the corner re-derives automatically through `prepareFlightTarget`).

### Task 4: Breadcrumb rendering

**Files:**
- Modify: `src/components/pages/home/fine-details-prompt-flight-ghosts.tsx`

- [ ] Render exactly `run.dropPlan.length` copies; each div's `transform` is **static at render** (unit vector of `run.delta` × `dᵢ`) — stationarity by construction, only `opacity` is ever written afterwards. Initial opacity 0; z-order newest-on-top (`zIndex: index`), layer stays under the real prompt.
- [ ] Subscription loop: cruise frames apply `resolveBreadcrumbCruiseFrame` opacities (keep the dropped-flags array across frames); on `phase === 'settling'` start the rAF vanish loop applying `resolveBreadcrumbVanishFrame` until `isComplete` → `onComplete(run.id)`. Remove the old settle transform writes entirely.

### Task 5: Receiver bump and manual dev check

**Files:**
- Modify: `src/components/pages/home/fine-details-preview-boundary.tsx` (+ `fine-details-preview-boundary.test.ts`)

- [ ] `FINE_DETAILS_PREVIEW_VERSION` → current + 1 (13 at the time of writing); update the source-pinning test regex.
- [ ] `oxfmt` touched files; `pnpm typecheck`; run the settings/flight/runtime/boundary test files. Manual on the standalone preview: generate → the window flies to the corner (left edge on TRY-IT's left edge, bottom edge on YOUR-WAY's bottom edge — check against the user's red-guide screenshot), copies stay pinned mid-flight, vanish wipes from the takeoff point after landing.

---

## Phase 2: Toolcraft — values, sections, records

### Task 6: Values and protocol

**Files:**
- Modify: `src/app/fine-details-prompt-flight-values.ts` (+ `fine-details-prompt-flight-values.test.ts`)
- Modify: `src/app/fine-details-preview-protocol.ts`

- [ ] Targets: remove `position`/`ghostCount`/`ghostStep`/`ghostSettle`; add `prompt.flight.offset.x`, `prompt.flight.offset.y`, `prompt.flight.ghosts`, `prompt.flight.ghostSpacing`, `prompt.flight.vanishStagger`, `prompt.flight.vanishTime`. Mirror the website defaults/limits exactly (incl. the re-clamped `ghostFalloff` 0..40 default 8); compose the two offset scalars into `offset: {x, y}` in `createFineDetailsPromptFlightFromValues`. Stale persisted values for removed targets are ignored by construction (key-by-key reads) — cover with a test.
- [ ] `FINE_DETAILS_PREVIEW_VERSION` → the same current + 1 as the website.

### Task 7: Control sections and pipeline

**Files:**
- Modify: `src/app/fine-details-prompt-flight-control-sections.ts`
- Modify: `src/app/fine-details-preview-pipeline.ts`, `src/app/app-performance.ts` (if flight targets are enumerated there)

- [ ] Rework into two persistent sections per the spec tables (Playback untouched): `Prompt Flight` — `Active` (switch, mode), `Offset X`/`Offset Y` (px sliders, −120..120 step 1, `spatial`, group `landing`, descriptions naming the typography-corner anchor), `Start delay`/`Flight time`/`Bounce` (strength, group `flight`); new `Prompt Ghosts` (id `prompt-ghosts`) — `Active` (switch, mode, gated on flight enabled), `Spacing` px 16..240, `Opacity` %, `Falloff` %, `Vanish stagger` ms 0..400 step 10, `Vanish time` ms 80..1200 step 10 (strength sliders, groups `ghosts`/`vanish`, gated on flight ∧ ghosts). Order roles strictly mode < spatial < strength; no label collides with a section title.
- [ ] Pipeline: new sliders → `CONTROL_DRAG` targets, both switches → `CONTROL_CHANGE`; remove the dead targets; bump the `runtimeId` suffix per convention. Performance envelope unchanged (`responsiveness` reasoning: one-shot DOM transition, derived count capped at 32 — record why no workload dimension is added).

### Task 8: Acceptance, browser cases, worklog

**Files:**
- Modify: `src/app/app-acceptance-data.ts`
- Modify: `e2e/fine-details-prompt-flight-cases.ts`, `e2e/fine-details-prompt-flight-evidence.ts`
- Modify: `src/app/fine-details-prompt-flight-toolcraft.test.ts`
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] Inventory: retarget the `prompt-flight` entry (offset axes in; pad/count/step/settle out; groupingReason rewritten for the corner-landing model) and add the `prompt-ghosts` entry (entity `fine-details-prompt-ghost-trail`; groupingReason: switch, spacing, opacity, falloff and vanish sequencing are the complete breadcrumb-trail surface). Matching `interactionOwnership` property-edit entries updated.
- [ ] Replace the per-target acceptance rows (12 persistent): the `position` vector row (and its `controlPartCoverage`) → two `offset` slider rows (touchdown corner shifts by the selected px); drop the `ghostCount` row; new `ghosts` switch row; `ghostSpacing` (dropped copies sit the selected distance apart **and never move once dropped**), `ghostOpacity`, `ghostFalloff` (copies dim toward the takeoff point; 0 = uniform), `vanishStagger` (after landing the copies disappear one after another, first-dropped first — with a high stagger copy 0 is gone while the last is still visible), `vanishTime` (each copy's fade duration). Update `fineDetailsPromptFlightBrowserTestNames`, the Playback fixture's version string, and the base-coverage/product description phrases — sweep `grep -rn "onion-skin\|fixed-step\|v12" src/app e2e` until only historical worklog entries remain.
- [ ] Rewrite the browser cases in the existing runner idiom (Images segmented replay + Run action, arm + keyboard-only): stationarity proof (sample one copy's rect twice mid-flight → identical), spacing proof (adjacent copy centers ≈ Spacing), vanish-order proof (poll opacities after landing under a high stagger), offset proof (landed prompt rect shifts by the slider delta). Extend the evidence helpers as needed.
- [ ] `fine-details-prompt-flight-toolcraft.test.ts`: control counts (6 + 6 + Playback), gating chains (flight → ghosts → sliders), mirrored domains, protocol v13, browser-title exports, pipeline registration, inventory/ownership rows, worklog assertion.
- [ ] Worklog `## Decision Trail: Prompt flight breadcrumbs & corner landing`: request quote (with the red-guide screenshot description), the model swap (onion-skin fan → stationary breadcrumbs — explicitly noting the earlier spec's rejection of stationary copies is superseded by user direction), corner anchoring over the pad (deterministic requirement; offsets as the fine-tune), derived count with the 32 cap, direction-agnostic drops, removed targets and payload migration, protocol bump, checks actually run, risks (stale preview tab until reload; very small Spacing on a long path widens effective spacing by the cap; Reset now also drops breadcrumbs — intended, tunable off via the Ghosts switch).

---

## Phase 3: Manual tuning checklist (default gate)

- [ ] Reload the workspace (new-version handshake). Replay Carousel: the window lands with its left edge on the TRY-IT block's left edge and bottom edge on the YOUR-WAY block's bottom edge; `Offset X/Y` nudge it live from that corner; resize while landed keeps it glued to the re-measured corner.
- [ ] Copies drop as the window moves and **stay pinned** (pick a mid-flight frame — no drift); `Spacing` 16 → 240 visibly changes the chain density; `Falloff` 0 = uniform, high = trail dying toward the takeoff point; `Opacity` scales the whole chain.
- [ ] On arrival the copies vanish strictly first-dropped-first; `Vanish stagger` 0 = simultaneous, 400 = a slow wipe; `Vanish time` changes each copy's fade; the run clears (no orphan divs).
- [ ] `Bounce` overshoot never spawns copies past the landing and never blinks the newest copy; Run replays cleanly mid-flight; Reset returns to base **with** breadcrumbs; Ghosts switch off → clean flight, no copies; Active off → snaps, no ghosts; reduced motion → snaps; narrow viewport → prompt stays stationary.
- [ ] Trail ↔ Carousel round-trips, drag + double-click reset still behave; Apply → homepage matches; applied JSON round-trips the new fields; no console errors.
