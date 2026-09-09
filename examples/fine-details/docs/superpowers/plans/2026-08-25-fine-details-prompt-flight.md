# Fine Details Prompt Flight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. Design source: `docs/superpowers/specs/2026-08-25-fine-details-prompt-flight-design.md` — it fixes the sequence, defaults/ranges, the ghost model (onion-skin fixed-step stack per the 2026-08-25 reference screenshot) and the protocol bump. Read it first.

**Goal:** After generation (`images.mode: loading → carousel`) the prompt window flies to a tunable bottom-left landing point by the text edge, trailing an onion-skin ghost stack — copies at a fixed step along the travel direction with per-step opacity falloff; after landing the stack collapses into the window and dissolves. Returning to `trail` flies the window back without ghosts. Ten controls in a new `Prompt Flight` section; the existing `Images` segmented (`Trail | Loading | Carousel`) is the replay driver.

**Architecture:** Website-owned. The flight animates its own CSS-var offset pair appended to the draggable prompt's transform chain; ghosts are panel shells positioned by pure path math — one-based ghost *i* at along-path distance `max(0, d(t) − i × step)`, opacity `opacity × (1 − falloff)^(i − 1)` so the nearest copy uses the selected base opacity — derived per frame from one motion value, with no per-ghost animation replay. Settings ride the atomic bridge object as `prompt.flight` beside `prompt.typing`; both sides now use protocol v12.

**Repositories:**
- Website: `/Users/kusnizza/Projects/recraft/recraft-landing/recraft-v4-styles`
- Toolcraft workspace: `/Users/kusnizza/Projects/recraft/recraft-landing/recraft-tools/fine-details`

**Verification note (this workspace's recorded practice):**

```md
Verification tier: Tier 3 (new animated transition + schema/protocol change on an existing product)
Run (default): focused website unit tests (flight/stack math, settings normalizer) and the existing fine-details suites kept green — including the prompt-typing integration test, since both features share the prompt wrapper; focused Toolcraft product/values tests; pnpm typecheck clean in both repos; oxfmt on touched files; one manual tuning session per Phase 3.
Skip: broad build/browser/delivery/performance suites (standing practice); the unminted first-delivery receipt stays untouched — no bare pnpm verify:delivery without an explicit request.
```

---

## Phase 0: Preflight

- [x] Toolcraft routes: **Schema, controls, defaults, persistence, actions** + **Renderer, canvas output, visual technique**; open one per read before code: `docs/toolcraft/schema-reference.md`, `component-rules.md`, `renderer-technique.md`, `performance.md`.
- [ ] Verify the live protocol version on both sides (`FINE_DETAILS_PREVIEW_VERSION` — **9** at the time of writing, the typing delivery raised it) and take current + 1. `git status` clean in both repos; both dev servers up.
- [x] Read in place before touching them:
  - `fine-details-prompt.tsx` — the client prompt wrapper (receives `imagesMode`, hosts the typing ghost, exposes the prompt root via `FineDetailsDraggablePrompt`'s `onRootElementChange`). The flight hook and ghost layer integrate here.
  - `fine-details-draggable-prompt.tsx` (+ module.css, `fine-details-prompt-drag-bridge.ts`) — transform chain `${baseTransform} translate3d(drag vars)`; its reset animation listens to `transitionend` on `transform`, so the flight must animate **its own** vars via the Web Animations API or a motion value, never the element's `transition: transform`.
  - `fine-details-image-state-transition.tsx` / `fine-details-carousel-phase.ts` — where `imagesMode` transitions are observed today.
  - `fine-details-settings.ts` — `prompt.typing` grouping and `normalizePromptTyping` as the shape to mirror.

---

## Phase 1: Website — settings, flight math, engine, ghosts

### Task 1: Flight settings

**Files:**
- Modify: `src/components/pages/home/fine-details-settings.ts`
- Modify: `src/components/pages/home/fine-details-settings.test.ts`

- [x] Add `FineDetailsPromptFlightSettings` with the approved tuning defaults and the later authoritative Landing override `position: { x: -1, y: 1 }` as `settings.prompt.flight`, beside `prompt.typing`; normalize each field independently, clamp the vector to ±1, round integer count, and keep strict boolean handling.
- [x] Persist through the existing Apply path (the atomic settings object already flows end to end).
- [x] Tests: older payloads without the group normalize to defaults; clamps; persisted shape includes `prompt.flight`.

### Task 2: Flight and stack math module

**Files:**
- Create: `src/components/pages/home/fine-details-prompt-flight.ts`
- Create: `src/components/pages/home/fine-details-prompt-flight.test.ts`

- [x] Pure helpers, no DOM:
  - `resolveFlightTarget(settings, sectionRect, promptRect)` → landing offset in px from the prompt's base position (±1 vector over the section, same convention as `prompt.position`).
  - `resolveFlightEase(bounce)` → settle curve at 0, overshoot blended in up to 50 %.
  - `resolveGhostStack(settings, d, D)` → for i = 1…ghostCount: `{ distance: max(0, d − i × ghostStep), opacity: (ghostOpacity / 100) × (1 − ghostFalloff / 100) ** (i − 1) }` — the nearest copy uses the selected base opacity, then each following copy decays exponentially.
  - `resolveGhostSettle(settings, i)` → `{ delay: i × GHOST_SETTLE_LAG_MS, duration: ghostSettle }`, with `GHOST_SETTLE_LAG_MS = 40` a named exported constant.
- [x] Unit tests with fixed inputs: distances clamp at 0 early in the flight (copies emerge from the start point one by one); cruise spacing is exactly `ghostStep`; no ghost distance ever exceeds `d` (nothing leads the window); opacities decay exponentially and monotonically; `ghostCount: 0` → empty stack; `ghostFalloff: 0` → equal opacities; settle stagger is nearest-first; `bounce: 0` → no overshoot; target math for a known rect pair.

### Task 3: Flight engine in the prompt wrapper

**Files:**
- Modify: `src/components/pages/home/fine-details-draggable-prompt.tsx` (+ `.module.css`)
- Modify: `src/components/pages/home/fine-details-prompt.tsx`

- [x] Extend the draggable prompt's transform chain to three members: `${baseTransform} translate3d(drag vars) translate3d(var(--fine-details-prompt-fly-x, 0px), var(--fine-details-prompt-fly-y, 0px), 0)`. The flight writes only the fly vars — through the Web Animations API or a motion value driving the CSS vars — never the element's `transition: transform`, which belongs to the drag reset machinery. Expose a small imperative handle (ref/registration) with `flyTo(offset, schedule)` / `flyBack(schedule)`, both cancellable; the handle also publishes the live along-path distance `d(t)` as a motion value for the ghost layer.
- [x] `useFineDetailsPromptFlight` watches `imagesMode` transitions, cancels stale work through a generation-aware controller, publishes `flying → landed` and `returning → idle`, restarts changed outbound tuning from the current offset, and snaps for disabled/reduced-motion policies.
- [x] Coexistence: typing and drag keep separate transforms/state; Run replays current settings and Reset cancels transient flight state without mutating settings or drag ownership.

### Task 4: Ghost stack layer

**Files:**
- Create: `src/components/pages/home/fine-details-prompt-flight-ghosts.tsx`

- [x] On each ghosted flight (forward only): measure the real panel box and radius from the prompt root and render bounded, content-free, pointer-transparent shells without backdrop blur.
- [x] Position ghosts every frame from `resolveGhostStack` by subscribing to the single published path distance; positions are derived rather than replayed per ghost.
- [x] After landing, each emerged ghost collapses into the prompt over its own `ghostSettle` duration, nearest-first at a fixed 40ms stagger; cancelled and return flights unmount the layer immediately.

### Task 5: Receiver bump and website checks

**Files:**
- Modify: `src/components/pages/home/fine-details-preview-boundary.tsx`

- [x] Protocol version → v12 on both sides; boundary tests and strict command envelopes updated.
- [ ] `pnpm exec oxfmt --write` touched files; `pnpm typecheck`; run the new unit-test files plus the existing fine-details suites (drag, typing integration, state transition, carousel, trail focus) — all green.
- [ ] Manual on the standalone route: mock generate (submit → loading → carousel) flies the window with a uniform fan behind it; back to trail returns it quietly; drag works from the landed position; typing resumes in trail.

---

## Phase 2: Toolcraft — values, section, protocol, records

### Task 6: Values and protocol

**Files:**
- Create: `src/app/fine-details-prompt-flight-values.ts`
- Modify: `src/app/fine-details-preview-protocol.ts`

- [x] Values module mirrors the website types/defaults/limits; targets `prompt.flight.enabled / .position / .startDelay / .flightTime / .bounce / .ghostCount / .ghostStep / .ghostOpacity / .ghostFalloff / .ghostSettle`; `createFineDetailsPromptFlightFromValues(values)` has website-identical clamping and focused tests.
- [x] Protocol v12 includes `prompt.flight`; product and command-envelope tests cover the new shape.

### Task 7: `Prompt Flight` section

**Files:**
- Create: `src/app/fine-details-prompt-flight-control-sections.ts`
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/fine-details-preview-pipeline.ts`
- Modify: `src/app/app-performance.ts`

- [x] The complete ten-control persistent Prompt Flight entity keeps Active with all gated controls; the adjacent complete Playback command entity exposes Run/Reset without entering persistence.
- [x] Insert beside the other Prompt sections; no label collides with a section title.
- [x] Pipeline contains the ten setting targets, runtime protocol v12, and one-shot bounded-shell performance metadata.
- [x] The always-visible `Images` segmented remains the state driver; Run provides an explicit replay without changing mode.

### Task 8: Acceptance data and worklog

**Files:**
- Modify: `src/app/app-acceptance-data.ts`
- Modify: `docs/toolcraft/agent-worklog.md`

- [x] Acceptance inventory, ownership and product rows cover all ten settings, transition behavior, and the transient Playback commands; the known remaining aggregate diagnostics are unrelated baselines.
- [x] Worklog records the fixed-step model, protocol v12, current controls, focused checks, skipped heavy checks, and live verification results.

---

## Phase 3: Manual tuning checklist (default gate)

- [ ] Reload the workspace (new-version handshake). `Images → Carousel`: the window flies to the landing point with a uniform fan of copies behind it — spacing visibly constant like the reference screenshot, copies never ahead of the window, emerging one by one at the start; after it settles the fan collapses into the window nearest-first and dissolves. `Images → Trail`: quiet return, no ghosts. `Loading → Carousel` behaves identically through the mock generate flow.
- [ ] `Landing` pad moves the touchdown point live (replay via the segmented); `Flight time` / `Start delay` / `Bounce` read clearly; `Ghosts 0` → clean flight without trail; `Ghost step` widens/tightens the fan; `Ghost opacity` / `Ghost falloff` shape the decay (falloff 0 → equal copies); `Ghost settle` slows/speeds the collapse.
- [ ] Drag the prompt in carousel after landing — drag works from the landed position; drag in trail, then generate — the flight starts from the dragged position; typing ghost, submit and prompt content untouched mid-flight; typing resumes in trail after a return.
- [ ] `Active` off → dependent controls hide, state switches snap the window instantly with no ghosts; reduced-motion emulation → same snap; Reset/undo/redo/reload/Apply round-trip (applied JSON gains `prompt.flight`).
- [ ] Homepage: full real generation plays the tuned flight; nothing else in the section moved; no console errors.
- [ ] Optional proof path (on request): browser case per the family recipe — enter Carousel via the segmented, poll `data-fine-details-prompt-flight="landed"`, assert ghost count in the frame during flight and zero after the settle, assert `Trail` return leaves zero ghosts.

### Actual verification — 2026-08-25

- [x] Reloaded Toolcraft on `http://127.0.0.1:3001/` against `http://localhost:3000/v4styles/toolcraft/fine-details`; the controls show `Ghosts 6`, `Ghost step 24px`, `Ghost opacity 55%`, `Ghost falloff 22%`, `Ghost settle 350ms`, plus Playback Run/Reset.
- [x] Live `Trail → Carousel` sampling observed six content-free flight shells, 24px adjacent Euclidean spacing, and opacities `0.55, 0.429, 0.33462, 0.261004, 0.203583, 0.158795`.
- [x] Live settle sampling observed the nearest shell fading first, then each following shell after the 40ms stagger; the layer unmounted after the last per-copy settle.
- [x] Run replayed the current Carousel settings without changing mode. `Carousel → Trail` observed `returning → idle` with zero flight-shell elements throughout.
- [ ] Not run by user request: broad build/typecheck/browser suite, reduced-motion emulation, the full Apply/undo/redo/reload round-trip, or the homepage generation flow.
