# Studio Room Inner Grid Design

## Goal

A switchable continuation of the room grid **inside** the white back-wall rectangle: the outer grid's lines enter the panel from its edges and dissolve toward its center. Tunable: reach (`Depth`), decay curve (`Falloff`), and the layer's own `Opacity`. Color, thickness and geometry repeat the main configured grid — the continuation always matches whatever the outer grid is tuned to.

## Context (checked 2026-08-25)

- Protocol is at **v5** on both sides; `room.wallBorder` and `room.wallFill` already exist (the geometry/density iteration landed). This feature takes current + 1 (v6 at the time of writing — verify live).
- The back wall is `.backWall` — opaque, `overflow: hidden`, rounded (single radius source after the geometry fix), hosting the heading as children. An inner layer clips to the rounded corners for free.
- Grid facts that make alignment exact by construction: ceiling/floor column lines meet the back-wall frame at horizontal fractions `i / grid.columns` of the wall width; left/right row lines meet it at vertical fractions `j / grid.rows` of the wall height. A uniform grid drawn **inside the panel at those same fractions** is the mathematically exact continuation of every wall line, and because the layer is anchored to the panel itself, continuity survives parallax/scroll offsets automatically (the panel and the line endpoints move together after the offset unification).
- **Normalizer trap:** `normalizeRoom` validates `room` by a key whitelist (`['depth', 'vanishing', 'wallBorder', 'wallFill']`) and rejects unknown keys — adding `innerGrid` requires extending that whitelist, or every payload carrying the new group is thrown away silently.

## Behavior Model

- **Lines.** Vertical lines at `x = i / columns × panelWidth` for `i = 1 … columns − 1`; horizontal at `y = j / rows × panelHeight` for `j = 1 … rows − 1`. Edge indexes (0 and max) coincide with the panel border and are skipped — the wall border owns the edges. `columns`/`rows` are the **main** grid divisions; the fine grid is not continued (optional follow-up).
- **Fade.** The layer is masked by a frame-shaped gradient: line opacity is 1 at the panel edge and falls to 0 at `Depth` inward (measured as % of the panel's smaller side, so the look is scale-invariant), with the decay shaped by `Falloff` as an exponent — `alpha(t) = (1 − clamp(t / depth))^falloff`, approximated in the mask by ~6 computed gradient stops. The panel center stays clean; the visual reads as the outer grid bleeding into the room's terminal face, exactly like the reference intent.
- **Styling.** Stroke color = `grid.color`, stroke width = `grid.thickness`; the layer multiplies everything by its own `Opacity` (independent of `grid.opacity` and fog — the outer grid's dimming should not double-dim the continuation).
- **Placement.** An SVG (`preserveAspectRatio="none"`, its own 0–1000 viewBox mapped to the panel) absolutely inset in `.backWall`, rendered **below** the children (heading/CTA stay above), `aria-hidden`, `pointer-events-none`. Clipping and the rounded corners come from the panel's own `overflow: hidden`.
- **Gates.** `enabled: false` (the default — production unchanged until tuned and Applied) renders nothing.

## Settings Model (protocol v5 → v6)

```ts
interface StudioRoomInnerGridSettings {
  enabled: boolean; // default false
  depth: number;    // % of the panel's smaller side, 5..60, default 22
  falloff: number;  // decay exponent, 0.5..4, step 0.1, default 1.6
  opacity: number;  // % 0..100, default 40
}
// room.innerGrid; normalizeRoom's key whitelist gains 'innerGrid'; missing group → defaults, so v5 applied JSON stays valid.
```

Apply/Reset persist the group through the existing studio-room flow automatically.

## Toolcraft Controls

New section `Inner Grid` (`entityId: "studio-room-inner-grid"`, entity: back-wall grid continuation — a separate visual layer, deliberately not folded into the `Room` section, which already carries depth/vanishing/border/fill):

| Control | Type | Target | Applicability |
| --- | --- | --- | --- |
| `Active` | switch (`orderRole: "mode"`) | `room.innerGrid.enabled` | always |
| `Depth` (%) | slider | `room.innerGrid.depth` | enabled |
| `Falloff` | slider (step 0.1) | `room.innerGrid.falloff` | enabled |
| `Opacity` (%) | slider | `room.innerGrid.opacity` | enabled |

Descriptions state the inheritance contract (color/thickness/divisions follow Main Grid live) and that Depth is measured inward from the panel edges.

Rejected alternatives: drawing the continuation in the outer grid SVG clipped to the panel rect (breaks under parallax — the outer SVG and the panel move in different layers; anchoring to the panel makes continuity structural); CSS `background-image` gradients for the lines (cannot inherit thickness/color cleanly or match fractions with subpixel accuracy); continuing the fine grid too in this iteration (doubles the line count and the tuning surface for an effect the reference does not show; noted as a follow-up switch); a radial fade (the reference is an edge-frame fade — corners must fade by distance to the nearest edge, which the frame mask gives and a radial does not).

## Records & Verification Posture

Family practice: pure helpers unit-tested (line fractions incl. skipped edges, mask stop computation for several falloff values, normalizer whitelist + clamps), workspace values/section/product tests extended, protocol pins updated, one manual tuning session. Diagnostics: `data-studio-room-inner-grid="off|on"` on the layer plus a stop-count attribute for e2e reachability.

## Out of Scope

- Continuing the fine grid (follow-up switch if wanted), animated reveal of the continuation, per-side depth values.
- Any change to the outer grid, wall border/fill, tiles, trail, or motion systems.
