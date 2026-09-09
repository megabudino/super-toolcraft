# Image-only Gallery Redesign

## Goal

Turn the current product into a neutral image gallery whose canvas contains only
the uploaded image cards and their physical movement. Remove copied presentation
language, branded titles, file-name captions, counters, hints, pagination dots,
decorative shadows, vignette, and gradient styling.

## Product identity

- Product name and controls-panel title: `Image Gallery`.
- Export filename: `image-gallery.png` or `image-gallery.jpg`.
- Persistence namespace: `toolcraft:image-gallery:state:v2`.
- Visible layout names: `Flow` and `Deck`.
- External reference names, URLs, studies, and retired branding are not part of
  product metadata, acceptance data, tests, plans, or the worklog.

## Canvas output

- Keep the retained WebGL image-card renderer.
- Keep both compositions: the wrapped curved flow and the stacked deck.
- Preserve wheel, drag, and arrow navigation, inertia, snapping, press response,
  parallax, permanent cylindrical card curvature, and velocity-signed physical
  flex.
- Render no DOM product text.
- Render no card-name title, kicker, index, hint, dot rail, ground shadow,
  vignette, or decorative background gradient.
- Default to no product background so the canvas visibly contains only images.
  Retain the mandatory Toolcraft `Background` section as an optional flat-color
  output setting and for JPG delivery.
- Keep preview and export visually equivalent.

## Controls

- Remove the entire `Overlay` section.
- Remove `Vignette` from `View`.
- Keep geometry, card, depth, physics, interaction, view, background, and image
  export settings.
- Rename the visible `Spiral` option/section to `Flow` and `Stack` to `Deck`.
  Internal numeric targets may retain `spiral.*` and `stack.*` because they name
  the actual geometry branches and preserve stored/control contracts.

## Metadata and acceptance

- Reclassify the product as a new Toolcraft app and remove legacy clone
  metadata.
- Replace reference-specific readiness prose and acceptance rows with direct
  product behavior coverage.
- Remove acceptance expectations for overlays, titles, dots, shadows, and
  decorative export composition.
- Add explicit proof that the image-only output contains no product text or
  decorative overlay.
- Keep fixed-camera interaction because the user requested preservation of the
  current gallery behavior while removing presentation.

## Verification

Verification tier: Tier 4

Reason: this batch removes a broad visible renderer/export layer, changes schema
targets and persistence defaults, reclassifies product metadata, updates browser
acceptance, and renames the visible product.

Run: targeted unit tests for settings, renderer/export composition, and product
metadata; targeted browser acceptance for controls, deck navigation, image-only
output, background/export, persistence, and canvas interaction; then one
`npm run verify:delivery` and a real local-browser visual check.

Skip: the complete performance certification matrix because the request removes
work from the renderer and introduces no new workload dimension or performance
complaint. The protected delivery runner may execute only the exact affected
paths derived from the impact inventory.
