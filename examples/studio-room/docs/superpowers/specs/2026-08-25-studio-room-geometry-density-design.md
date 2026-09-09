# Studio Room Geometry & Density Design

## Goal

Four changes to the pre-footer Studio Room (`recraft-tools/studio-room` ↔ website `pre-footer-room.tsx`):

1. **Geometry fix.** Grid stripes must terminate exactly on the back-wall rectangle — no detached line tips or gaps around it (the current state, see the supplied screenshot).
2. **Wall border controls.** Thickness and color of the border around the final (back-wall) rectangle become tunable, decoupled from the grid styling they currently inherit.
3. **Density control.** How many images are shown at once is adjustable over a wider range.
4. **No edge contact.** Tiles never touch or cross each other's edges — at rest, after every shuffle, and during slide transitions.

## Diagnosis (checked in `pre-footer-room.tsx`, 2026-08-25)

The room is drawn in three unit systems that disagree as soon as parallax or scroll kicks in — that is the «отрыв»:

- Grid lines live in a `0 0 1000 1000` viewBox (`preserveAspectRatio="none"`) and their wall-side endpoints move by `gridOffsetX/Y` in **viewBox units** (`±130 · parallax` etc.).
- The back-wall panel (`.backWall`, the cream rounded div) is positioned by percentages of the same rect but is translated by `wallX/wallY` in **`vw` / `svh` + px** (`±13vw`, `±10svh`, scroll nudge `40px` vs the grid's `80` viewBox units). Viewport units ≠ stage-relative viewBox units whenever the stage isn't exactly the viewport — so the wall and the line endpoints drift apart under pointer parallax and scroll.
- The wall's rounded corner (CSS `border-radius`, px) and the depth frames' `rx = 10 + depth·28` (viewBox units) are unrelated values: near the corners, straight lines aimed at the rect's bounding edge stop outside the rounded wall.

## Fix Model

- **One offset source.** Keep `gridOffsetX/Y` (viewBox units) as the single truth. Measure the stage box (ResizeObserver) and derive the wall translation in px: `offset / 1000 × stage size`. Delete the `vw`/`svh` wall transforms and the divergent scroll-nudge magnitudes — wall and line endpoints now move identically by construction.
- **Overshoot under the wall.** Extend every column/row line past its wall endpoint along its own direction to depth ≈ 1.12 (≥ the wall corner radius in viewBox units), and give `.backWall` an explicit opaque background. The wall (z-4) covers the tips, so lines visually end exactly on the wall edge — including at the rounded corners — for any radius, offset, or animation state. The depth-`Frame` rings stay as they are but their `rx` interpolates to the wall's actual radius at depth 1.
- **One radius source.** A `WALL_RADIUS` constant in viewBox units drives both the frames' terminal `rx` and the wall's CSS `border-radius` (converted through the measured stage size).

## Wall Border

`.backWall` currently borrows `grid.color`/`grid.thickness`/`grid.opacity × fog`. New independent settings in `room`:

```ts
room.wallBorder: {
  width: number;                                  // px 0..12, step 0.5, default 1.3
  colorOpacity: { hex: string; opacity: number }; // default { '#6F7946', 34 }
}
```

The border renders from these alone (no grid or fog coupling). Toolcraft: the existing `Room` section (depth + vanishing, same entity — the wall is the room's terminal face) gains `Border width` (slider) and `Border color` (colorOpacity).

## Density & Non-Adjacency

- `tiles.perSurface` (existing target, currently 1–4) extends to **1–6** and remains the density control («сколько картинок за раз» = perSurface × 4 surfaces, +1 on the floor).
- **Placement invariant:** no two tiles may share an edge — same surface, same depth row with |Δcross| = 1, or same cross column with |Δdepth| = 1 (corner-to-corner point contact remains allowed; cross-surface contact is already impossible because edge cross-indexes are excluded). Enforced in both `createInitialLayout` (greedy pick that skips adjacent candidates; if the requested count doesn't fit, place as many as fit and report the actual count via `data-studio-room-tiles`) and `pickNextTileChange` (a destination must be non-adjacent to every tile except the moving source).
- **Slide safety:** a `slide` move whose straight cell-space path would cross or edge-touch an occupied cell falls back to `swap` (fade) for that move, so tiles never intersect mid-transition either.
- The shuffle keeps its per-surface balancing behavior; the adjacency filter only narrows `freeCells`.

## Protocol & Records

`STUDIO_ROOM_PREVIEW_VERSION` 2 → 3 on both sides; the normalizer defaults the new `room.wallBorder` group and the widened `perSurface` clamp, so v2 applied JSON stays valid; Apply persists the new fields. Acceptance/inventory grow in the family's established style (two new control rows, `Room` section targets extended; a runtime note on the non-adjacency invariant). Verification follows the family practice: focused unit tests (offset/overshoot math, adjacency picker, normalizer) + the existing room test files kept green + one manual tuning session; broad suites untouched.

## Out of Scope

- Curved/animated wall radius control, per-surface density overrides, tile size variation.
- Any change to trail lines' velocity behavior, motion/parallax feel, media upload flow, or the pre-footer heading.
