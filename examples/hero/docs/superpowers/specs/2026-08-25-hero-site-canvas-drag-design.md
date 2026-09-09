# Hero Site Canvas Drag Design

## Goal

Port the existing Toolcraft Hero gallery canvas drag to the website without changing its feel, pan math, or interaction ownership.

## Interaction

- An unmodified primary pointer starts a gesture on the Hero sphere canvas.
- The canvas captures the pointer, keeps the normal cursor, and continues receiving movement outside its bounds.
- Movement updates pan at most once per animation frame with Toolcraft's existing formulas:
  - horizontal delta divided by `π × sphere width`;
  - vertical delta divided by half the full row-panel period;
  - both axes wrap into `[-1, 1)`.
- Pointer up, cancel, lost capture, and unmount finish cleanly and release capture.
- Auto-scroll remains active, matching Toolcraft.

## Event Ownership

- The gallery scene becomes pointer-interactive only for the sphere canvas.
- Decorative heading content passes pointer events through.
- CTA, links, and other explicit interactive targets remain above the canvas and retain normal click/focus behavior.
- The announcement strip is outside the drag surface.

## State Flow

- Toolcraft/applied settings remain the baseline.
- The website keeps a local interactive pan initialized from the supplied settings.
- A settings change resets that local pan so Toolcraft Apply and preview synchronization remain authoritative.
- During drag, the existing renderer receives the same settings with only `gallery.sphere.pan` replaced by the interactive value. Media sources and settings persistence are unchanged.

## Verification

- Add focused contracts for Toolcraft-equivalent pan math, pointer capture lifecycle, and CTA exclusion.
- In the live site, drag the canvas and confirm the gallery pan changes while the CTA still activates normally.
- Run the focused test, scoped formatting, and `git diff --check`; skip broad checks per the user's speed request.
