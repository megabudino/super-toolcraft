# Hero Pan Marker Removal

## Goal

Remove the visible crosshair from the Toolcraft hero preview without changing canvas Pan behavior.

## Design

The crosshair is a decorative SVG child of the full-preview `HeroGalleryPanHandle`. Pointer capture, drag deltas, history grouping, cursor state, and the `sphere.pan` target belong to the parent overlay and do not depend on that SVG.

Delete the SVG, its position-derived inline style, and the dedicated `.panPin` CSS. Keep the full-canvas handle, accessibility label, pointer handlers, test id, and drag-state cursor unchanged.

Per the user's standing instruction, hand the change over without tests, lint, typecheck, build, formatting, or browser verification. Do not commit or push.
