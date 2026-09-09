# Studio Room Unbounded Tile Images Design

## Goal

Remove the product-level 12-image upload limit from Studio Room Tile Images so every selected image remains available to Toolcraft and the website preview.

## Behavior

- Keep the Tile Images uploader multiple-selection behavior.
- Remove `hardMaxItems` and `recommendedMaxItems` from the Toolcraft file-drop control.
- Preserve every valid uploaded image and its media order; do not truncate the collection during media-to-settings conversion.
- Accept settings payloads with any number of valid tile-image descriptors on both Toolcraft and website sides.
- Retain existing per-image validation, unique id/ref/order requirements, transformed preview derivatives, and media cleanup behavior.
- Do not change tile layout, animation, rendering, or image quality behavior.

## Verification Scope

Run only focused source-level checks that prove a collection larger than 12 passes through the settings chain. Do not run aggregate tests, builds, or broad browser suites.
