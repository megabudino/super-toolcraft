# Hero Side Edge Blur Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. Design source: `docs/superpowers/specs/2026-08-25-hero-side-edge-blur-design.md` — read its Approach and "Accepted visual differences" sections first; they carry the code review that shaped this plan.

**Goal:** A tunable progressive blur ramping in from the left/right viewport edges of the hero (band width + strength sliders, master switch), so the card-wall silhouette stops reading sharp on wide screens. Implemented **inside the source sampler of both renderer paths** — the sphere/post fullscreen pass and the per-card Rows renderer — because neither path can blur after composition without new infrastructure.

**Repositories:**
- Website: `/Users/kusnizza/Projects/recraft/recraft-landing/recraft-v4-styles`
- Toolcraft workspace: `/Users/kusnizza/Projects/recraft/recraft-landing/recraft-tools/hero` (npm scripts, full verification machinery)

**Verification note:**

```md
Verification tier: Tier 3 (renderer sampling change in two paths + schema/protocol change on an existing product)
Run: extended hero-dispersion-post-shader.test.ts, the card-shader test file, and hero-scene-settings.test.ts; Toolcraft focused vitest for values/protocol/schema; npm run test:feature -- <three new acceptance ids>; typecheck both repos; oxfmt touched files; manual wide-screen check in BOTH gallery types.
Skip: measured performance (fixed 12-tap cost with an early-out, no workload dimension added — record this reasoning in the worklog); full audit; delivery re-runs.
```

---

## Phase 0: Preflight

- [ ] Toolcraft routes: **Schema, controls…** + **Renderer, canvas output…**; open one per read: `docs/toolcraft/schema-reference.md`, `component-rules.md`, `renderer-technique.md`, `performance.md`; before proof `acceptance-testing.md`.
- [ ] Verify the live hero protocol version on both sides and take current + 1. `git status` clean in both repos; website and hero Toolcraft servers up.
- [ ] Read in place **both renderer paths** — the same change lands in two places:
  - Sphere/post: `hero-dispersion-post-shader.ts` (`vec4 sampleScene(vec2 point)` ~line 333 and every call site), `hero-sphere-gallery-passes.ts` (`postUniforms`, the upload site, `uScreenSize`/`uBackingSize`), plus `hero-scene-settings.ts`.
  - Rows: `hero-dispersion-card.tsx` (per-card canvas, `syncRendererLayout` supplying `uCanvasViewportX`/`uViewportWidth`, and the `HORIZONTAL_BLEED = 256` / `VERTICAL_BLEED = 80` canvas margins) and `hero-card-dispersion-webgl.ts` (`sampleCard`, `coverage * roundedCardMask(local)`, uniform-location table).
  - Toolcraft conventions: `hero-dispersion-control-sections.ts`, `hero-preview-pipeline.ts`.

---

## Phase 1: Website — settings and both samplers

### Task 1: `edgeBlur` settings group

**Files:**
- Modify: `src/components/pages/home/hero-scene-settings.ts` (+ `hero-scene-settings.test.ts`)

- [ ] Add `HeroEdgeBlurSettings` (`enabled: true`, `width: 220` px 0–480, `strength: 18` px 0–48) to types/defaults/`normalizeHeroSceneSettings` (missing group → defaults; clamps; strict boolean); persisted by the existing Apply path automatically.
- [ ] Tests: old payloads normalize to defaults; clamps; persisted shape includes `edgeBlur`.

### Task 2: Soft sampler — sphere/post path

**Files:**
- Modify: `src/components/pages/home/hero-dispersion-post-shader.ts` (+ `hero-dispersion-post-shader.test.ts`)
- Modify: `src/components/pages/home/hero-sphere-gallery-passes.ts`
- Modify: the settings→uniform plumbing (`hero-sphere-gallery-webgl.ts` / `hero-sphere-gallery.tsx`)

- [ ] Add `uniform float uSideBlurWidth; uniform float uSideBlurStrength;` (CSS px; convert through the existing `uScreenSize`/`uBackingSize`). Compute `edgeDistance = min(cssX, screenWidth − cssX)` and `factor = uSideBlurWidth > 0.5 ? smoothstep(uSideBlurWidth, 0.0, edgeDistance) : 0.0`.
- [ ] Add `vec4 sampleSceneSoft(vec2 point)` beside `sampleScene`: when `factor * uSideBlurStrength < 0.5` return `sampleScene(point)` unchanged (early-out ⇒ interior renders byte-identically); otherwise return a **12-tap Poisson-disk average of premultiplied RGBA** at radius `factor * uSideBlurStrength` px. Tap offsets live in a `const` array so the count is provably fixed.
- [ ] Route only the silhouette-defining reads through it: the passthrough return (~505), the chroma taps in the dispersion sampler (~396–401), the authored-coverage read (~608). **Leave the aura loop (~699) and gate light samples (~715–719) on plain `sampleScene`** — wide low-frequency terms; a 12-tap sampler inside those loops multiplies their cost. Alpha is averaged together with the premultiplied color — that is what feathers the analytic card mask.
- [ ] Passes: append the two uniforms to `postUniforms`; upload from settings each frame (switch off ⇒ zeros; one shader path, no JS branching).
- [ ] Shader unit test: both uniform names present; the soft sampler exists with a fixed tap-count constant; the early-out branch present; the aura/gate call sites still reference the plain sampler (string-level checks in the file's existing style).

### Task 3: Soft sampler — Rows/card path

**Files:**
- Modify: `src/components/pages/home/hero-card-dispersion-webgl.ts` (+ its test file)
- Modify: `src/components/pages/home/hero-dispersion-card.tsx` (only if uniform plumbing needs threading)

- [ ] Rows composites separate per-card canvases, so the same treatment happens locally instead of as a screen-space pass. Add identical `uSideBlurWidth` / `uSideBlurStrength` uniforms to the card program and its location table (beside `uCornerRadius`).
- [ ] The fragment already receives `uCanvasViewportX` and `uViewportWidth`: derive the fragment's X inside the hero viewport, take the distance to the nearer vertical viewport edge, apply the same `smoothstep` — a card mid-wall gets nothing, the outermost cards feather.
- [ ] Add `sampleCardSoft(...)` wrapping `sampleCard(...)` with the same early-out and the same 12-tap premultiplied average; use it for the reads that define the card outline. Keep the `coverage <= 0.0001 → vec4(0.0)` cheap reject as the outer guard, but note it now rejects *before* feathering — widen its test box by the current blur radius so taps just outside the card still contribute (otherwise the feather clips at the old card bound).
- [ ] Bleed budget: the canvas already extends `HORIZONTAL_BLEED = 256` px toward the outer viewport edge (`left: side === 'left' ? -256 : 0`, `width: calc(100% + 256px)`) — exactly where the blur is strongest — and `VERTICAL_BLEED = 80` px vertically. Max strength 48 px fits with margin; assert in review that `strength ≤ HORIZONTAL_BLEED` so the feather is never truncated at the canvas edge.
- [ ] Parity: with identical settings, Rows and Sphere must feather by the same amount at the same distance from the viewport edge. Compare side by side and record any deviation in the worklog rather than tuning one path's constants in isolation.

### Task 4: Website checks

- [ ] `oxfmt` touched files; `pnpm typecheck`; run the settings test and both shader test files.
- [ ] Manual dev check on a wide viewport in **both** gallery types: the arrowed edges feather smoothly; the interior beyond the band is unchanged; strength 0 / switch off reproduces today's rendering exactly.

---

## Phase 2: Toolcraft — values, section, protocol, records

### Task 5: Values and protocol

**Files:**
- Modify: `src/app/hero-dispersion-values.ts` **or** create `src/app/hero-edge-blur-values.ts` (follow the file-size/ownership convention)
- Modify: `src/app/hero-preview-protocol.ts`

- [ ] Targets `edgeBlur.enabled` / `edgeBlur.width` / `edgeBlur.strength`; defaults/clamps mirroring the website; compose into `createHeroPreviewSettingsFromValues`. Protocol version → current + 1.

### Task 6: Section and pipeline

**Files:**
- Modify: `src/app/app-schema.ts` (or the sections module)
- Modify: `src/app/hero-preview-pipeline.ts`
- Modify: `src/app/app-performance.ts`

- [ ] Section `Edge Blur` per the spec table (switch `Active` mode-role; sliders `Width` px 0–480 step 5 and `Strength` px 0–48 step 1, strength-role, conditional on enabled; `performanceRole: "responsiveness"` with the fixed-tap reasoning in `performanceReason`). Placed near the other effect sections; no label collides with a section title. Descriptions state the sides-only scope and that both Rows and Sphere honor the same values.
- [ ] Pipeline: `edgeBlur.width`/`edgeBlur.strength` → `HERO_PREVIEW_CONTROL_DRAG_TARGETS`, `edgeBlur.enabled` → `HERO_PREVIEW_CONTROL_CHANGE_TARGETS`; runtimeId suffix bump per convention. Performance config: scenarios derive as usual; do **not** add a workload dimension (fixed tap count + early-out — record why).

### Task 7: Acceptance and worklog

**Files:**
- Modify: `src/app/app-acceptance-data.ts`
- Modify: `e2e/product-effects-preview.spec.ts` (registration list)
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] Three `controlAcceptance` rows (`edgeBlur.enabled` — outer edges snap between feathered and crisp; `edgeBlur.width` — the softened band widens/narrows from each side; `edgeBlur.strength` — the feather softens/sharpens) + matching `interactionOwnership` property-edit entries + the section inventory entry.
- [ ] Register the three cases in the effects spec (`switch` / `slider` actions, existing runner).
- [ ] Worklog Decision Trail entry: request quote; the code review that killed "blur after composition" (post pass binds the default framebuffer; Rows has no fullscreen pass); the two-path sampler decision; premultiplied RGBA averaging as the reason the analytic card mask feathers; the aura/gate exclusion for cost; rejected alternatives (second framebuffer + extra fullscreen pass, backdrop-filter strips, edge fade mask, raising dispersion `Blur`); sides-only scope (top/bottom removal precedent); protocol bump; checks run; risks (below).

---

## Phase 3: Checks and tuning fallbacks

- [ ] Toolcraft: exact unit tests for touched files, then `npm run test:feature -- <edgeBlur.enabled> <edgeBlur.width> <edgeBlur.strength>` with the website dev server running.
- [ ] Manual on a ~2600 px-wide window: defaults remove the sharp silhouette at the two arrowed spots; Width/Strength respond live through drags; Apply → homepage matches; reduced motion behaves; Rows and Sphere keep the feather **and match each other's falloff**; FPS unchanged at defaults *and* at max Width/Strength in both gallery types.
- [ ] **Fallback A — crisp core inside the aura.** If a thin sharp edge shows through the glow at the very edge (aura reads the unblurred sampler by design), route only the aura's *center* sample through the soft sampler — one extra tap set, not a 12× loop. Do not convert the whole aura loop.
- [ ] **Fallback B — grain reads sharp over softened content.** Grain/CRT are applied after and stay crisp (standard film-emulation order). If it reads as sharp noise over mush, attenuate the grain amplitude inside the band by the same `factor` — a single multiply, no extra samples.
- [ ] Neither fallback changes the control surface or the settings shape; if used, record which one and why in the worklog.
