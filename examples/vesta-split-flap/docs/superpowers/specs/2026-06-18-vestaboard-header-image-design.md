# Vestaboard Header Image Design

## Context

The product canvas currently renders a full-canvas Vestaboard tile field with a static Vesta header image at the top. The user provided an updated header image and requested the Vestaboard content to move down by the header height.

## Decision

Add a static header image layer to the product output:

- Render the provided image at the top edge of the canvas.
- Render it at 1920px width and proportional 52px height.
- Center it horizontally so narrower canvases clip from both sides through the existing canvas overflow.
- Reserve the 52px header height at the top of the canvas for the image.
- Build and render the Vestaboard grid in the remaining canvas area below the header, starting at y=52.
- Include the same layered composition in DOM preview, PNG export, and video export.

## Verification

- Browser acceptance verifies the header image is visible at the canvas top and rendered at 1920px width.
- Browser acceptance verifies the Vestaboard grid starts below the 52px header and uses the remaining canvas height.
- Renderer layer metadata includes the header image layer.
- Export code draws the board at y=52 and the same header asset at y=0 so exported frames match preview layering.
