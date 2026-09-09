# Fine Details Prompt Flight Design

## Goal

After generation completes (`imagesMode: loading → carousel`), the prompt window flies to a tunable landing point at the bottom-left, by the edge of the text block, trailing an onion-skin afterimage stack (reference screenshot supplied 2026-08-25): ghost copies of the window sit behind it **along the travel direction at a fixed step**, each next copy more transparent. The window lands first; then the stack collapses into the landing point and dissolves — «окно встает на конечное место и шлейфы доходят». Returning to `trail` flies the window back quietly, without ghosts. Everything is tuned from the Toolcraft `fine-details` workspace and replayed with the existing `Images` state segmented.

## Context (re-checked 2026-08-25, after the typing delivery)

- Protocol is at **v9** on both sides (`FINE_DETAILS_PREVIEW_VERSION` in the workspace protocol module and the website boundary). This family moves fast — the flight takes **current + 1**, verified at implementation time.
- The prompt renders through the client wrapper `fine-details-prompt.tsx` (`FineDetailsPrompt`): it already receives `imagesMode`, owns the prompt root element via `FineDetailsDraggablePrompt`'s `onRootElementChange`, and hosts the typing ghost (`useFineDetailsPromptTyping`). This wrapper is the flight's integration point.
- `FineDetailsDraggablePrompt` composes its transform as `${baseTransform} translate3d(var(--fine-details-prompt-drag-x), var(--fine-details-prompt-drag-y), 0)` and runs its own reset animation on `transition: transform` + `transitionend`. The flight must not touch that machinery.
- Settings precedent: `settings.prompt.typing` with `normalizePromptTyping` (missing group → defaults). The flight group mirrors this shape as `settings.prompt.flight`.
- The state is already exposed in the panel: the always-visible `Images` segmented (`Trail | Loading | Carousel`, target `images.mode`, `fine-details-carousel-control-sections.ts`). It is the replay driver for tuning; the flight engine must react to every `images.mode` change regardless of source (panel segmented, mock generate flow, homepage generation).
- Workspace practice, recorded in every worklog entry: focused checks + the user's manual review; broad suites and the delivery receipt are not run without an explicit request.

## Behavior Model

- **Trigger.** Entering `carousel` starts the flight after `Start delay` ms. Entering `trail` flies the window back to its base position with the same timing but **no ghosts** — the afterimage burst marks the landing once; the return is a quiet cleanup. A mid-flight state flip cancels and restarts from the current offset (schedule keyed by a transition nonce).
- **Flight.** The window travels from wherever it currently is (base position + any user drag) to the landing point along a **straight segment** `P0 → T` with one settle ease; `Bounce` (0–50 %) blends in landing overshoot. Duration = `Flight time`. The flight animates its **own** offset pair `--fine-details-prompt-fly-x/y`, appended as a third member of the draggable prompt's transform chain — the drag bridge, its reset state machine and Apply stay untouched, and the window remains draggable from the landed position.
- **Landing point.** `prompt.flight.position` — a ±1 screen vector over the section, same convention as the existing `prompt.position`. Default lands the window at the bottom-left by the text edge; the exact spot is the user's tuning, not a hardcoded guess.
- **Ghost stack (onion skin, fixed step).** The path is straight, so the travel direction is a constant unit vector. Ghost *i* (1…`Ghosts`) sits **on the path behind the window** at along-path distance `max(0, d(t) − i × Ghost step)`, where `d(t)` is the window's distance from `P0` — pure math on the path parameter, derived every frame; no per-ghost animation replay. Consequences, all visible in the reference: the fan spacing is exactly `Ghost step` in cruise; copies emerge from the start point one by one early in the flight; nothing ever leads the window. Opacity of ghost *i* = `Ghost opacity × (1 − Ghost falloff)^(i − 1)`: the nearest copy uses the selected base opacity and every later copy decays exponentially.
- **Ghost rendering.** Each ghost is a simplified shell of the panel — real measured box and radius (the root element is already available via `onRootElementChange`), opaque-ish fill matching the panel surface, the panel's shadow style scaled by the ghost's opacity (the reference copies cast their own soft shadows), **no backdrop-blur, no content**; `aria-hidden`, `pointer-events-none`, `will-change: transform`. Z-order: all ghosts under the window, farther copies lower; above the carousel images.
- **Settle.** When the window lands (`d = D`), each ghost animates its remaining along-path distance into the window over `Ghost settle` ms while fading to zero, staggered nearest-first by a fixed internal lag (`GHOST_SETTLE_LAG_MS = 40`, a named constant, not a control). Total effect ≈ `flightTime + count × 40 + settle`; ghosts unmount when the last fade ends.
- **Gates.** `enabled: false` or `prefers-reduced-motion` → no animation and no ghosts; the window is simply *at* the landing point in `carousel` and at base in `trail` (instant snap on state change). The typing ghost is unaffected: it lives in `trail` and obeys its own gates; after a return flight it resumes as usual.

## Settings Model (protocol v9 → v10)

```ts
interface FineDetailsPromptFlightSettings {
  enabled: boolean;      // default true
  startDelay: number;    // ms 0..2000, default 150
  flightTime: number;    // ms 150..2000, default 550
  bounce: number;        // % 0..50, default 12 — landing overshoot
  position: { x: number; y: number }; // ±1 screen vector, default ≈ { x: -0.62, y: 0.78 }
  ghostCount: number;    // 0..10, default 6 (0 = no trail)
  ghostStep: number;     // px 4..80, default 24 — fixed spacing between copies along the path
  ghostOpacity: number;  // % 5..100, default 55 — the nearest copy's opacity
  ghostFalloff: number;  // % 0..60, default 22 — per-step opacity decay («затухание»)
  ghostSettle: number;   // ms 100..1500, default 350 — collapse-into-the-window duration
}
// settings.prompt.flight, beside prompt.typing; normalizer defaults a missing group, so v9 applied JSON stays valid.
```

No new message types: the flight is driven by `images.mode`, which already travels in the settings payload. Apply/Reset persist the flight numbers as part of the atomic settings object.

## Toolcraft Controls (one section, ten controls → `semanticGroup` on every control)

Section `Prompt Flight` (`entityId: "fine-details-prompt-flight"`), inserted beside the other Prompt sections. Ranks stay non-decreasing (mode → spatial → strength); groups `flight` / `ghosts`:

| Control | Type | Target | Group | Applicability |
| --- | --- | --- | --- | --- |
| `Active` | switch (`orderRole: "mode"`) | `prompt.flight.enabled` | `flight` | always |
| `Landing` | vector (screen coords) | `prompt.flight.position` | `flight` | enabled |
| `Start delay` (ms) | slider | `prompt.flight.startDelay` | `flight` | enabled |
| `Flight time` (ms) | slider | `prompt.flight.flightTime` | `flight` | enabled |
| `Bounce` (%) | slider | `prompt.flight.bounce` | `flight` | enabled |
| `Ghosts` (0–10) | slider | `prompt.flight.ghostCount` | `ghosts` | enabled |
| `Ghost step` (px) | slider | `prompt.flight.ghostStep` | `ghosts` | enabled + ghostCount ≥ 1 |
| `Ghost opacity` (%) | slider | `prompt.flight.ghostOpacity` | `ghosts` | enabled + ghostCount ≥ 1 |
| `Ghost falloff` (%) | slider | `prompt.flight.ghostFalloff` | `ghosts` | enabled + ghostCount ≥ 1 |
| `Ghost settle` (ms) | slider | `prompt.flight.ghostSettle` | `ghosts` | enabled + ghostCount ≥ 1 |

No replay button is needed: switching `Images` to `Carousel` (directly or through `Loading`) plays the flight; back to `Trail` plays the return.

Rejected alternatives: **delayed followers replaying the path with per-ghost lag** (the first design, rejected 2026-08-25 against the reference screenshot — easing makes follower spacing breathe and bunch, while the reference shows a rigid uniform step); animating the drag variables themselves (tangles the drag bridge's reset state machine); stationary copies dropped along the path that fade in place (that is the image-trail effect; here the fan stays attached to the window and collapses into it); DOM-cloning the live panel for ghosts (heavy; stacked backdrop-blur costs frames); a Toolcraft keyframes timeline (website-owned autonomous transition, hero precedent).

## Records & Verification Posture

The ghost sliders' `conditional` applicability uses `greaterThanOrEqual: 1` on `ghostCount` (supported operator). Ten controls in one section ⇒ `semanticGroup` on every control. Acceptance grows in this workspace's established style: ten `control` rows plus one runtime row `prompt.flight.transition` (entering Carousel flies the window with a uniform fixed-step ghost fan behind it; after landing the fan collapses into the window and dissolves; returning to Trail flies it back without ghosts); `interactionOwnership` property-edit/global entries for the ten targets. Diagnostics: `data-fine-details-prompt-flight="idle|flying|landed|returning"` on the prompt wrapper, `data-fine-details-prompt-ghost` per ghost. Verification per family practice: focused unit tests (path/stack math, normalizer), focused Toolcraft product test, manual tuning session; broad suites and the unminted delivery receipt untouched unless explicitly requested.

## Out of Scope

- Ghosted return to `trail`, per-ghost blur/tint, curved flight paths, velocity-based step.
- Any change to drag behavior, prompt typing, carousel geometry, or prompt content.
- New bridge message types; export; timeline.
