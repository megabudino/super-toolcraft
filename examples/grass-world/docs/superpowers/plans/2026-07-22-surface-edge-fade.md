# Surface Edge Fade Plan

Verification tier: Tier 3
Reason: adds persisted renderer state and one shared field-space fragment falloff across Terrain, instanced vegetation, scans, rocks, the boulder, and their shadow materials, while geometry, layout, texture resources, animation, and workload bounds remain unchanged.
Run: focused values/shader/schema/acceptance Vitest, TypeScript, AI/code-health, focused Chromium alpha-pixel proof, affected render-plan checks, and one protected delivery invocation when the batch is stable.
Skip: no full performance refresh because this is a fixed-cost shader feature, not requested performance work; no new workload dimension or variable loop is introduced.

## Product decision

- Add `Surface Fade` immediately after `Surface` so material authoring flows into perimeter finishing before vegetation materials.
- Fade the complete rendered composition in normalized elliptical world-field coordinates. This follows the island-shaped height envelope, removes hard rectangular corners, and keeps every object aligned with the Terrain mask under camera orbit.
- `Width` controls how far inward the soft transition reaches, from 0% (disabled) to 40% of the normalized island radius.
- `Strength` controls how transparent the outer boundary becomes, from 0% (no fade) to 100% (fully dissolved edge).
- Default to Width 12% and Strength 100% so the current hard edge is softened immediately.
- Apply the same shader state to Terrain, detailed and lightweight grass, lawn clumps, all Megascans plants, rocks, the boulder, and their depth/shadow passes in interactive preview, PNG/JPG, and video export. Do not change geometry, height map, PBR blending, object placement, timeline, or layers.

## Control Section Inventory

- `Surface Fade`: owns `surface.edgeFadeWidth` and `surface.edgeFadeStrength`. Both are built-in sliders because each is a bounded scalar authored continuously. A range slider is rejected because these values are not lower/upper bounds; a custom control is unnecessary.

## Renderer and performance plan

1. Add normalized edge-fade settings, defaults, typed values, persistence v19, schema controls, render targets, acceptance rows, and inventory ownership.
2. Use one shared material extension for MeshStandard/Physical and MeshDepth materials. Pass world XZ after custom deformation, batching, and instancing; compute distance to the normalized field ellipse; then multiply the already sampled material/opacity texture alpha by the shared mask.
3. Keep true blended alpha for Terrain. Keep vegetation and opaque objects in depth-writing order with alpha hashing/alpha-to-coverage, and apply the identical mask in custom depth materials so faded geometry cannot leave solid ghost shadows. Retain all current meshes, textures, PBR shader chains, and draw-call topology.
4. Mark the new module as owning scene-resource, scene-render, and export-frame passes. Controls invalidate only scene render; no layout/resource recreation and no workload dimension.
5. Prove in Chromium that enabling a wide full-strength fade reduces boundary alpha for isolated Terrain, vegetation, and scanned-object fixtures, while Strength 0 restores each fixture. Prove the shared shader path for both color and depth materials in focused unit coverage.

## Acceptance

- Width 0 produces the existing unfaded composition regardless of Strength.
- Increasing Width creates a wider smooth transition inward from the complete elliptical perimeter.
- Strength 0 preserves the opaque edge; Strength 100 reaches transparent alpha at the boundary.
- The center remains opaque and PBR-lit; current/Clover material mixing and every object texture remain unchanged inside the fade.
- Detailed grass, lightweight coverage, lawn clumps, scanned plants, rocks, and the boulder all use the same field-space falloff as Terrain.
- Color, opacity, normal, AO, and roughness-driven appearances dissolve together through final fragment coverage; no texture layer remains visible outside the mask.
- Shadow/depth silhouettes dissolve with their visible materials, so no faded object leaves an opaque shadow behind.
- Reset restores Width 12% and Strength 100%; persistence and settings transfer retain both values.
- Preview and export share the same fade state.
