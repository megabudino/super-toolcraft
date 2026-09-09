# Rock Received Shadow Color

Verification tier: Tier 3

Reason: Two schema colors change retained WebGL rock materials in preview and export by tinting pixels according to the real received shadow-map factor.

Run: Focused schema/material unit tests, TypeScript, Toolcraft code health, and one focused Chromium scenario for Small Rocks and Tundra Boulder shadow colors.

Skip: No full performance refresh; the controls add no workload dimension, geometry, instance, resource, or animation change. The shader adds one bounded shadow-mask evaluation only to the two existing rock materials.

## Product behavior

- Add `Shadow color` to the existing `Small Rocks` and `Tundra Boulder` sections with the built-in `color` control.
- Use white as the reset value so the existing appearance is preserved.
- Tint only final rock lighting where the existing Three.js received-shadow factor is below fully lit.
- Keep each rock layer independent: Small Rocks color cannot affect the boulder, and the boulder color cannot affect Small Rocks, Terrain, vegetation, or cast-shadow color.
- Apply the same retained-material uniforms in preview, PNG export, and video export.
- Keep current layer switches, timeline, persistence policy, layout, PBR maps, and export actions unchanged.

## Control section inventory

- `Small Rocks`: add `scan.rocks.shadowColor` to the material-color group because it edits the received-light color of the same scattered rock entity.
- `Tundra Boulder`: add `scan.boulder.shadowColor` to the material-color group because it edits the received-light color of the same hero boulder.

## Implementation

1. Add defaults, typed settings readers, render invalidation targets, acceptance rows, and section-inventory targets for both controls.
2. Add a focused received-shadow tint shader extension with one color uniform and the actual shadow-map mask.
3. Attach the extension only to Small Rocks and Tundra Boulder materials and update each retained uniform from its own setting.
4. Cover shader injection, neutral white behavior, independent settings, visibility gating, reset values, and visible pixel changes in focused unit/browser tests.
5. Record the renderer/control decision and verification result in `docs/toolcraft/agent-worklog.md` and keep `app-performance-impact.json` aligned with the new production module.
