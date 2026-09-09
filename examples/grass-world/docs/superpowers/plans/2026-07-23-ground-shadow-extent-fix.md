# Ground Shadow extent fix

Status: Complete

Verification tier: Tier 3

Reason: The retained Ground Shadow shader plane changes its analytic extent in preview and export. Controls, state, topology, draw calls, materials, scene lighting, animation, and workload dimensions remain unchanged.

Root cause: The shadow shader normalizes blur by the smaller Field half-axis, but the plane adds only the raw world-space Blur value to both axes. On rectangular or strongly scaled surfaces, the larger axis therefore needs proportionally more padding than the plane provides, leaving non-zero shadow alpha at the plane edge and producing a visible straight cut.

Implementation:

1. Compute the normalized blur radius once from the smaller Field half-axis.
2. Convert that radius back to a per-axis world-space padding.
3. Pass the complete padded half-extent to the shader and size the retained plane from the same value.
4. Keep the existing Field SDF, irregularity, roundness, offset, scale, color, strength, and one-draw retained resource unchanged.
5. Extend the focused Ground Shadow unit test with a rectangular surface that proves both axes have sufficient padding.

Verification: By explicit user request, focused Ground Shadow Vitest passes 2/2 and TypeScript passes. Browser, build, performance, kernel, and protected delivery were skipped.
