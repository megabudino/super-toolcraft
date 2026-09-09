# Flat Bead Rendering Design

## Product goal

Remove the pseudo-volume from Dot Ring Studio while preserving the current animation, color palette, bead spacing, timeline, Infinity canvas, and export behavior.

## Visible result

- Render each bead as a flat, solid-color circle.
- Remove the yellow-green blur and shadow from the live preview.
- Use the same flat drawing path for PNG and video exports.
- Crop Infinity image exports to the visible flat bead bounds instead of the former shadow bounds.

## Control Section Inventory

The existing Setup, Ring, Motion, Audio, Appearance, and Export sections remain unchanged. No new control is needed because the request changes the product's rendering style rather than introducing an optional setting.

## Runtime and output mapping

The Toolcraft runtime remains the single source of product state. Existing control values and evaluated timeline values continue to feed the shared Canvas 2D drawing function. The drawing function fills solid circles without writing Canvas shadow state, batches colors only within each separated row to preserve row paint order, and the scene-bounds provider pads bead centers only by the bead radius.

## Unchanged behavior

- Bead relaxation remains enabled to keep neighboring beads from overlapping.
- Ring shape, motion, audio reactivity, palette, playback, persistence, canvas sizing, and exports remain enabled.
- Layers remain disabled because the product still has a single composited output.
- The playback timeline remains enabled because the product is animated.

## Verification

Verification tier: Tier 3

Reason: The change affects Canvas 2D pixels and Infinity scene bounds across preview, PNG, and video output.

Run: targeted type and unit checks, browser inspection of the live renderer and Infinity export, kernel proof refresh if selected, and the official delivery proof.

Skip: the full performance suite because the change removes shadow work and does not alter workload scaling, interaction ownership, or animation scheduling.
