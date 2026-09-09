# Fine Details Prompt Flight Breadcrumbs & Corner Landing Design

## Goal

Two revisions to the implemented prompt flight (`recraft-tools/fine-details` ↔ website `fine-details-prompt-flight*` family, protocol v12 at the time of writing):

1. **Corner landing.** The prompt window must land in the **extreme bottom-left corner of the typography rectangle** — the rect bounded on the left by the upper-left «TRY IT…» block's left edge and on the bottom by the lower-right «YOUR WAY…» block's bottom edge (the user's screenshot marks both with red guides). The free ±1 `Landing` pad is replaced by a landing point **derived from that rectangle by construction**, with small px `Offset X/Y` fine-tune sliders (default 0/0 = the exact corner).
2. **Ghost mechanic v3 — breadcrumbs.** While the window moves, it **drops stationary ghost copies behind it** at a tunable spacing; each copy stays exactly where it was dropped. The moment the window reaches the landing point, the copies **vanish sequentially, starting with the first-dropped one** (the copy at the takeoff position). Tunables: distance between copies, their opacity/falloff, vanish stagger and fade, plus the existing start delay / flight time / bounce.

> **Supersedes** the ghost model of `2026-08-25-fine-details-prompt-flight-design.md`. That spec listed «stationary copies at drop points» as a rejected alternative — the rejection is void: the user has now explicitly chosen exactly the stationary breadcrumb mechanic (2026-08-25 direction with screenshot). The rigid onion-skin fan (`resolveGhostStack`, ghosts tracking `d − i·step`) and the collapse-into-the-window settle are removed, not kept behind a switch.

## Context (checked 2026-08-25 — re-verify at implementation time)

- v12 is fully implemented: pure math in `fine-details-prompt-flight.ts`, rAF driver in `-controller.ts`, orchestration in `-engine.ts`, policy/tuning in `-runtime.ts`, rendering in `-ghosts.tsx`; Toolcraft side has `-values.ts`, `-control-sections.ts` (10 controls — at the section cap — plus a `Playback` Run/Reset section), `-command-contract.ts`, per-control browser cases in `e2e/fine-details-prompt-flight-cases.ts` + `-evidence.ts`.
- The typography rectangle **already exists in code**: `readFlightSafeBounds` reads `[data-fine-details-upper-left-typography]` / `[data-fine-details-lower-right-typography]`, and `resolveFlightTarget` maps `position ∈ [−1,1]²` across it. The default `position` is already `{x: −1, y: 1}` — the corner — but only as a pad default the panel can move; the applied JSON currently carries no `flight` group at all.
- The flight-frame bus publishes `{distance, pathLength, phase: waiting|flying|settling}` from `startFlight`; ghosts subscribe via `subscribeFlight`. `FINE_DETAILS_PROMPT_FLIGHT_TUNING_FIELDS` is an exhaustively type-checked field list — the compiler forces it to match the settings shape.
- The protocol version moves fast in this repo — verify the live `FINE_DETAILS_PREVIEW_VERSION` on **both** sides and take current + 1.

## Landing Model

- Target derivation (replaces the `position` mapping inside `resolveFlightTarget`): with `bounds` = safe bounds (typography rect; falls back to the section rect exactly as today when the attributes are missing) and `promptRect` = the un-dragged base rect,
  `targetLeft = bounds.left + offset.x`, `targetTop = bounds.bottom − promptRect.height + offset.y`, then clamp the rect into the section as today. The window's **left edge lands on the TRY-IT left edge and its bottom edge on the YOUR-WAY bottom edge** at offsets 0/0.
- `flight.position` is **removed**; `flight.offset = { x: 0, y: 0 }` (px, −120…120, step 1) is the only placement tuning. Old applied/session payloads that still carry `position` are ignored by the key-by-key normalizers on both sides.
- Resize/reconcile behavior is unchanged: the landed window re-snaps to the re-derived corner (the existing ResizeObserver path), so the corner tracks typography reflow.

## Breadcrumb Model

All pure math lives in `fine-details-prompt-flight.ts`; the ghost DOM stays a stack of styled copies of the prompt shell, below the real window.

- **Drop plan** (computed once per run — `pathLength` is known when the run is created): `effectiveSpacing = max(ghostSpacing, pathLength / MAX_PROMPT_FLIGHT_GHOSTS)` with `MAX_PROMPT_FLIGHT_GHOSTS = 32`; drop distances `dᵢ = i × effectiveSpacing` for `i = 0, 1, …` while `dᵢ ≤ pathLength − effectiveSpacing / 2`. Index 0 is the takeoff position (the vacated origin keeps the first copy); no copy is dropped close enough to the landing to hide under the landed window. The ghost count is **derived** — `ghostCount` disappears as a setting.
- **Cruise.** A copy becomes visible («dropped») once the travelled distance reaches its `dᵢ` — the window is exactly on top of it at that moment and uncovers it as it moves on. Once dropped, always dropped (the bounce overshoot's return dip must not blink the newest copy out). Copies are **stationary by construction**: each div's transform is the static unit-vector × `dᵢ`, set at render from the plan — only opacity ever animates. Opacity of copy `i` while cruising: `(ghostOpacity/100) × (1 − ghostFalloff/100)^(newestVisibleIndex − i)` — the trail decays behind the window; falloff 0 keeps every copy equally opaque. Z-order: newer copies on top, shingling toward the window; the whole layer stays under the real prompt.
- **Vanish.** When the flight completes (phase `settling`, i.e. after the bounce tail), copy `i` starts fading at `i × vanishStagger` and fades **in place** to 0 over `vanishTime` (smoothstep), from whatever cruise opacity it held at landing — **first-dropped first**, a wipe running from the takeoff point toward the window. When the last copy finishes, the run clears (`onComplete`). The old settle (copies flying into the landed window, fixed 40 ms lag constant) is deleted, `GHOST_SETTLE_LAG_MS` included.
- **Direction.** «при каждом движении» — breadcrumbs drop on **both** programmatic flights (outbound to the corner and the return to base via Trail/Reset): `shouldCreateFineDetailsPromptGhostRun` loses its `direction === 'outbound'` check; the gate becomes ghosts-switch ∧ animate policy ∧ pathLength > 0. Reduced motion / `enabled: false` still snap with no ghosts; narrow-viewport stationary behavior is untouched.

## Settings Model (protocol current + 1, v13 at the time of writing)

```ts
flight: {
  enabled: boolean;             // true — unchanged
  offset: { x: number; y: number }; // px −120..120, default {0, 0} — NEW, replaces position
  startDelay: number;           // ms 0..2000, default 150 — unchanged
  flightTime: number;           // ms 150..2000, default 550 — unchanged
  bounce: number;               // % 0..50, default 12 — unchanged
  ghosts: boolean;              // default true — NEW master for the breadcrumb trail
  ghostSpacing: number;         // px 16..240, default 56 — distance between dropped copies
  ghostOpacity: number;         // % 5..100, default 55 — newest copy's opacity
  ghostFalloff: number;         // % 0..40, default 8 — per-copy dimming toward the takeoff point
  vanishStagger: number;        // ms 0..400, default 70 — delay between successive vanish starts
  vanishTime: number;           // ms 80..1200, default 260 — per-copy fade duration
}
// removed: position, ghostCount (now derived, cap 32), ghostStep, ghostSettle
```

`FINE_DETAILS_PROMPT_FLIGHT_TUNING_FIELDS` is updated to this exact shape (the type-level exhaustiveness check enforces it); any field change mid-flight still cancels/restarts via the existing tuning-key machinery.

## Toolcraft Controls

The single 10-control `Prompt Flight` section splits — the breadcrumb trail is its own visual entity with its own styling controls:

**`Prompt Flight`** (id `prompt-flight`, entity unchanged) — 6 controls:

| Control | Type | Target | Applicability |
| --- | --- | --- | --- |
| `Active` | switch (`mode`) | `prompt.flight.enabled` | always |
| `Offset X` (px) | slider (`spatial`, group `landing`) | `prompt.flight.offset.x` | enabled |
| `Offset Y` (px) | slider (`spatial`, group `landing`) | `prompt.flight.offset.y` | enabled |
| `Start delay` (ms) | slider (`strength`, group `flight`) | `prompt.flight.startDelay` | enabled |
| `Flight time` (ms) | slider (`strength`, group `flight`) | `prompt.flight.flightTime` | enabled |
| `Bounce` (%) | slider (`strength`, group `flight`) | `prompt.flight.bounce` | enabled |

The `Landing` vector pad is removed. Offset descriptions state the anchor: 0/0 puts the window's left edge on the upper-left typography's left edge and its bottom edge on the lower-right typography's bottom edge.

**`Prompt Ghosts`** (id `prompt-ghosts`, **new** entity `fine-details-prompt-ghost-trail`) — 6 controls:

| Control | Type | Target | Applicability |
| --- | --- | --- | --- |
| `Active` | switch (`mode`) | `prompt.flight.ghosts` | flight enabled |
| `Spacing` (px) | slider (group `ghosts`) | `prompt.flight.ghostSpacing` | flight ∧ ghosts |
| `Opacity` (%) | slider (group `ghosts`) | `prompt.flight.ghostOpacity` | flight ∧ ghosts |
| `Falloff` (%) | slider (group `ghosts`) | `prompt.flight.ghostFalloff` | flight ∧ ghosts |
| `Vanish stagger` (ms) | slider (group `vanish`) | `prompt.flight.vanishStagger` | flight ∧ ghosts |
| `Vanish time` (ms) | slider (group `vanish`) | `prompt.flight.vanishTime` | flight ∧ ghosts |

`Playback` (Run/Reset commands) is unchanged; Run now replays the breadcrumb run, Reset returns to base — now also with breadcrumbs. All sliders join the control-drag pipeline targets, switches join control-change; every control keeps `performanceRole: "responsiveness"` (the model stays a one-shot DOM transition — the derived count is bounded by the 32 cap, no new workload dimension).

## Records & Verification Posture

Inventory: the `prompt-flight` entry is retargeted (offset axes in, pad/count/step/settle out; groupingReason rewritten), and a new `prompt-ghosts` entry describes the trail entity (spacing, opacity, falloff and vanish sequencing are the complete breadcrumb styling surface). Acceptance rows are replaced 1:1 per target (12 persistent rows) with breadcrumb observables — the key new browser proofs: dropped copies sit `Spacing` apart **and do not move** between mid-flight samples; after landing the vanish order is first-dropped-first (with a high stagger, copy 0 reaches opacity 0 while the last copy is still visible); `Offset X/Y` move the touchdown corner. Every stale phrase («onion-skin», «fixed-step», the v12 fixture strings, the base-coverage product description) is swept and rewritten. Verification follows family practice: focused unit tests for the new pure math (drop plan spacing/cap/landing gap, monotonic visibility under bounce, falloff table, vanish order/completion, corner-target formula incl. clamps and fallback), normalizer tests on both sides, Toolcraft contract/values tests updated (control counts, v13), `npm run test:feature` for the changed acceptance ids, typecheck + oxfmt both repos, one manual tuning session; no delivery runs.

## Out of Scope

- Curved/arced flight paths, per-copy scale/blur/rotation, distinct return-flight tuning, changes to drag/double-click-reset, prompt typing, carousel content, or the Apply flow.
- Any change to the command contract (Run/Reset ids and message type stay v12-compatible in shape; only the version constant moves).
