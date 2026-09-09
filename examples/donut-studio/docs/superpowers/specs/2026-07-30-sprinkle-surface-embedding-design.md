# Sprinkle Surface Embedding Design

## Request

Sprinkles must sit slightly inside the current icing geometry for a realistic
contact result. The distribution control must also support negative surface
offset values.

## Product Behavior

- Every sprinkle is sampled and re-conformed against the current deformed icing
  surface.
- At `Surface offset = 0`, the sprinkle center is placed so that the icing
  intersects a small, shape-aware portion of its transverse radius.
- Negative offsets move the sprinkle farther into the icing along the local
  surface normal.
- Positive offsets move the sprinkle outward along the same normal.
- Collision relaxation may move a sprinkle tangentially, but the final instance
  is re-sampled and re-conformed to the icing before rendering.

## Geometry Model

The placement support distance is:

`transverse radius × (1 - base embedding ratio) + signed surface offset`

The base embedding ratio is constant across shapes and scales so Pearls, Rods,
and Pellets retain a consistent visible contact proportion. The transverse
radius uses the local axes perpendicular to the sprinkle's authored long axis.

## Controls and Persistence

`sprinkles.surfaceOffset` remains the single runtime state target. Its slider
range changes from `0…0.15` to `-0.15…0.15`. Existing snapshots with zero or
positive values remain valid; imported negative values are retained and
exported through the existing settings workflow.

## Verification

- Unit tests prove the shape-aware zero-offset embedding depth.
- Unit tests prove negative offset increases penetration and positive offset
  lifts along the sampled icing normal.
- Schema/value tests prove the signed range.
- Browser acceptance proves the slider accepts a negative value and changes the
  rendered output.
- The protected delivery gate proves the complete settings-default batch and
  this geometry change together.

