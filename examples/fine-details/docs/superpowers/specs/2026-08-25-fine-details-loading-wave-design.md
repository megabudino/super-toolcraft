# Fine Details Loading Wave Design

> **Status: implemented 2026-08-25** (website + Toolcraft, protocol v14). Kept as the design record; the agent-worklog `Loading Wave generation-state animation` entry carries the verification trail. During implementation a concurrent session reduced the loading composition to **two** placeholder cards — adopted here.

## Goal

Replace the plain vertical shimmer on the generation-state placeholder cards (`imagesMode === 'loading'`) with a **checkerboard reveal wave**: a static checker grid covers each card, and a soft diagonal band sweeps across it, flipping the brightness of the cells it passes — the image being «computed patch by patch», like a tile renderer. The user picked this direction from four proposed concepts («волна проявления»); everything is tunable from the Toolcraft `fine-details` workspace: cell size, tone contrast, wave width/softness/angle, pass time, pause between passes, and a per-card phase stagger.

## Context (checked 2026-08-25 — re-verify at implementation time)

- Loading state renders in `fine-details-loading-placeholders.tsx`: square cards (`FINE_DETAILS_LOADING_CARD_COUNT`, now 2) (side = typography-band `effectiveHeight`, gap/radius/textGap from `carousel` settings), surface styled by the shared `fine-details-image-placeholder.module.css` `.surface` class — a 1.6 s vertical gradient shimmer, static under reduced motion. **The same `.surface` is also consumed by `fine-details-image-carousel.tsx`** for per-image placeholders — the wave must be a separate co-located class scoped to the loading cards so carousel placeholders keep today's shimmer.
- The section background is already graph paper (`gridSize`/`gridOpacity`) — the checker pattern rhymes with it deliberately.
- The `Images` segmented control (Carousel section) already exposes the `loading` mode, so the Toolcraft fixture is one segment flip.
- The protocol version moved during the session (breadcrumbs took v13); this feature landed as **v14** on both sides (`fine-details-external-preview-v14` runtimeId).

## Wave Model (pure CSS, no per-frame JS)

Two background layers per loading card plus one animated mask — all driven by CSS variables the component sets from settings:

- **Base checker**: `repeating-conic-gradient` of tone A (the existing base `#d1d1d1`) and tone B = `color-mix(in srgb, base, white <contrast>%)`, tile `2·cell × 2·cell`. Static.
- **Inverted checker** (tones swapped — equivalently the same gradient offset by one cell) in an overlay layer, revealed only inside the traveling band via `mask-image: linear-gradient(<angle>, transparent → black → black → transparent)`; the ramp fraction is `softness` (0 = hard band edge, cells flip binary; high = feathered blend), the opaque span is `waveWidth` (% of the card diagonal).
- **Travel**: keyframes animate `mask-position` along the gradient axis from fully-before to fully-past the card. `var()`/`calc()` are legal inside keyframe declarations, so the travel distance extends beyond the card by `pause / passTime × (card + band)` — the band spends the pause fraction off-card at constant speed, giving a dead-time between passes without dynamic keyframe offsets. `animation-duration: calc(passTime + pause)`; include the `-webkit-mask-*` fallback lines. If mask-position proves unreliable in a target browser, the sanctioned fallback is an oversized rotated overlay element translating through the card — same model, same variables.
- **Stagger**: card *i* gets `animation-delay: i × stagger` — the wave ripples across the three cards left to right.
- **States**: wave `enabled: false` → the card keeps today's vertical shimmer exactly (the off-state is the current look, useful for A/B while tuning). `prefers-reduced-motion` → static base checker, no band (extends the existing media query). The loading row's own overflow loop and the flying prompt window above are untouched (background-level effect only).

## Settings Model (protocol v14)

New top-level group, normalized key-by-key (missing group → defaults, old applied payloads stay valid):

```ts
loading: {
  enabled: boolean;   // true — wave on; off = current plain shimmer
  cell: number;       // px 8..64, default 20 — checker cell size
  contrast: number;   // % 0..60, default 14 — tone B distance from the base gray
  waveWidth: number;  // % 10..100 of the card diagonal, default 45
  softness: number;   // % 0..100, default 60 — band edge feather fraction
  angle: number;      // deg 0..360, default 45 — band direction of travel
  passTime: number;   // ms 600..4000, default 1600 — one sweep across the card
  pause: number;      // ms 0..2000, default 300 — dead time between passes
  stagger: number;    // ms 0..800, default 180 — per-card phase offset
}
```

## Toolcraft Controls

New section **`Loading Wave`** (id `loading-wave`, new entity `fine-details-loading-wave` — the generation-placeholder surface treatment), placed after the Carousel sections; all controls conditional on `imagesMode === 'loading'` (tuned while visible), sliders additionally gated on the switch:

| Control | Type | Target | Group |
| --- | --- | --- | --- |
| `Active` | switch (`mode`) | `loading.enabled` | pattern |
| `Cell size` (px) | slider 8..64 | `loading.cell` | pattern |
| `Contrast` (%) | slider 0..60 | `loading.contrast` | pattern |
| `Wave width` (%) | slider 10..100 | `loading.waveWidth` | wave |
| `Softness` (%) | slider 0..100 | `loading.softness` | wave |
| `Angle` (deg) | slider 0..360 step 5 | `loading.angle` | wave |
| `Pass time` (ms) | slider 600..4000 step 50 | `loading.passTime` | wave |
| `Pause` (ms) | slider 0..2000 step 50 | `loading.pause` | wave |
| `Stagger` (ms) | slider 0..800 step 10 | `loading.stagger` | rhythm |

9 controls → semanticGroups required and present; orderRoles follow the family precedent (mode switch first, sliders after — run the order linter). Sliders join the control-drag pipeline targets, the switch joins control-change; every control is honestly `performanceRole: "responsiveness"` — the effect is a compositor-driven CSS animation whose cost is constant in every setting (no workload dimension; record the reasoning).

## Records & Verification Posture

Inventory entry for the new entity (groupingReason: switch, checker pattern, wave sweep and rhythm are the complete loading-surface treatment) + `interactionOwnership` property-edit entries; 9 `controlAcceptance` rows with `product-output` evidence against the Images = Loading fixture (the animated surface changes the raster by construction; per-control observables: cell density, tone distance, band span, edge feather, sweep direction, sweep duration, inter-pass gap, card desync — and the switch swaps wave ↔ legacy shimmer), browser cases registered through the family's existing per-control mechanism. Website: extend `fine-details-loading.test.ts` in its source-assertion style + settings normalizer tests; boundary version test. Verification follows family practice — focused unit/source tests, Toolcraft values/contract tests, `npm run test:feature` for the new acceptance ids, typecheck + oxfmt both repos, one manual session; no delivery runs.

## Out of Scope

- The carousel's per-image placeholders (they keep the current shimmer; applying the wave there is a trivial follow-up once tuned).
- Custom checker colors beyond the contrast slider (base gray stays the section token), completion transitions into the carousel, sound/haptics, canvas/WebGL techniques.

## Revision 2026-08-26: gloss, base tone, distortion (protocol v15)

The user found the wave blending into the background and asked for shine (suggesting an overlay/white base) plus pattern distortion under the band. The palette was rebuilt: `baseTone` (% 0..100, default 85) lightens the card surface from the base gray toward white; `contrast` now darkens the cells against that surface (direction flipped); `glare` (% 0..100, default 55) whitens the flipped cells inside the band into a glossy sheen (composed purely in `color-mix` custom properties — no extra layers); `distort` (px 0..24, default 6) offsets the overlay checker's `background-position` along the travel axis so the band visibly refracts the pattern. Twelve controls split into two workflow stages of one entity: `Loading Wave` (surface) and `Wave Motion` (band + timing). Protocol v14 → v15 on both sides.

## Revision 2026-08-26 (2): card chrome (protocol v16)

The placeholders now cast the same shadow as the generated carousel cards — the component consumes `carousel.shadow` through the identical formula (offset × 48 px, `enabled: false` → none), pinned against drift by a source test requiring both files to share `shadowOffsetPixels = 48`. A new `loading.border` group (default `#000000` 12 %, 1 px) outlines every card with the wave on or off; `Border width` (0–8 px, 0 = off) and `Border color` join the `Loading Wave` surface section (eight controls). Protocol v15 → v16.

## Revision 2026-08-26 (3): cycle desync (protocol v17)

`Desync` (`loading.desync`, % 0..50, default 12) lengthens each next card's full wave cycle (`duration x (1 + i x desync/100)` via a per-card `--fd-wave-duration` override), so the sweeps drift out of phase and re-converge instead of ticking in lockstep; Stagger keeps its role as the constant initial offset and both compose. Protocol v16 -> v17.
