# Landing Globe Design

## Request

Build a Toolcraft product app that generates a 3D landing-page globe on a `#000000` background. The default finite canvas is 1920px wide. The globe is an opaque `#000000` sphere with white latitude and meridian lines only. There are no continent outlines, land shapes, labels, or decorative overlays. Users can control the thickness and count of latitude and meridian lines and tilt/orbit the globe axis at different angles.

## Product Behavior

The app opens directly to the editable globe output. Runtime Setup owns settings import/export, background, Infinity canvas availability, finite canvas size, and render scale. Product controls are grouped under one `Globe` entity because all editable settings affect the same generated object and the total count remains below ten controls.

The default output is a 1920x1080 finite canvas with background enabled and `#000000`. Image export is enabled through the Toolcraft runtime as PNG/JPG with 2K/4K/8K choices. SVG and video export are not requested.

## Controls

The product uses built-in schema controls only:

- `Background` runtime pair: background enabled by default and color `#000000`.
- `Line color`: fixed default white but still exposed as a product style control for landing art variants.
- `Sphere color`: default `#000000`, mapped to opaque sphere material.
- `Latitudes`: integer slider controlling horizontal ring count.
- `Meridians`: integer slider controlling vertical great-circle count.
- `Line width`: slider controlling all grid line thickness.
- `Axis`: `orientationGizmo` target controlling the globe orientation.

No custom controls are needed. Panel controls own exact numeric and color edits. Canvas/gizmo interaction owns spatial orientation; the panel does not mirror that operation with angle sliders.

## Renderer

Use Three.js in a product-owned WebGL renderer mounted as `canvasContent`. The renderer reads `useToolcraftProductSceneFrame()` so finite and Infinity scene frames use the runtime-owned surface. It clears/draws background only when the runtime says the bounded product background is included. Geometry is procedural: one opaque sphere plus line curves for latitude and meridian rings. There are no texture, continent, source media, timeline, or layer inputs.

The camera is fixed relative to the scene, while the product object orientation is editable through the runtime orbit/gizmo target. The visible spatial scene uses `viewInteraction.mode: "orbit"` and maps to the single `globe.orientation` target.

## Verification

Verification classification: first product delivery
Reason: First product delivery from the neutral Toolcraft starter with new schema, product readiness, WebGL renderer, export renderer, performance config, and acceptance data.
Run: `npm run ai:check`, targeted app tests while developing, browser acceptance through the delivery gate, then bare `npm run verify:delivery`, then `npm run dev`.
Skip: Measured performance and full `verify:perf`; the user did not make a performance complaint or request full certification.
