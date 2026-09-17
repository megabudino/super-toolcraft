# Video export implementation plan

Verification tier: Tier 2
Reason: Adds a requested artifact module and an offline frame schedule over the existing animated WebGL renderer.
Run: Product/schema coverage, renderer assessment, real MP4 download with decoded frames/timestamps/dimensions, format and resolution controls, and a manual embedded-browser export check.
Skip: Aggregate delivery gate and measured performance; this is a focused later feature and no targeted performance iteration was requested.

1. Record the current user message as primary video-export evidence and enable the built-in `videoExportModule` beside the existing image export.
2. Preserve the shared `rasterFrameRenderer`; the runtime will evaluate the immutable timeline state at every 30 FPS offline frame and use the existing `timeline.time` export invalidation.
3. Add Video Export inventory and acceptance rows for the artifact, format, and resolution controls. Migrate saved defaults with MP4 / Current and keep the requested closed initial frame paused.
4. Add one focused browser proof that downloads a short real MP4, decodes representative frames, validates cadence/duration/dimensions and changing pixels, then verifies WebM and 4K choices remain reachable.
5. Run focused unit/product and browser verification, inspect the embedded app, and leave the local server running.
