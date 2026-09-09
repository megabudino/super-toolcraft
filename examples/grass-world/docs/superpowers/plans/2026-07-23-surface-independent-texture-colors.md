# Surface Independent Texture Colors Plan

Verification tier: Tier 3

Reason: One new persisted Surface color target reaches the retained ground material and the fragment shader splits one shared tint uniform into independent Current and Clover tint uniforms. Geometry, texture sampling, blend-mask work, resource lifecycle, and export technique stay unchanged.

Run: Focused red/green Surface schema/value/shader tests, TypeScript, code health, and one short Chromium check that changes each real color control and observes its independent runtime value plus canvas output.

Skip: Full `verify:delivery`, aggregate browser acceptance, kernel, and performance suites at the user's explicit request to avoid heavy checks. No workload dimension, shader sample, loop, draw call, geometry, resource, animation, or export-path count changes.

## Control Selection Inventory

- Product need: Independently color the Current and Clover PBR textures blended in Surface.
- Value model: Two stable free hex colors, one per named texture role.
- Candidate built-ins checked: `color`, `colorOpacity`, `gradient`, and custom control.
- Best built-in: Two plain `color` controls in the existing Surface material-color group.
- Why: Each texture owns a free color with no opacity or gradient semantics; two related plain colors fit the standard paired color layout.
- Rejected alternatives: One shared Ground color, color-opacity controls, a two-stop gradient, a custom dual-color widget, or separate sections.
- Targets: Existing `appearance.groundColor` becomes the Current texture tint; new `surface.cloverColor` owns the Clover texture tint.
- Renderer/export mapping: Two retained `vec3` uniforms tint the two sampled base-color maps independently before the existing procedural blend. Preview and export use the same retained material path.
- Acceptance coverage: Focused schema/value/uniform/shader tests plus a real-browser control/output check.

## Implementation

1. Add `surface.cloverColor` with the same default as the current Ground color so existing scenes remain visually unchanged when the new setting is absent.
2. Rename the existing Surface `Ground` label to `Current color`; add built-in `Clover color` beside it and keep both in the existing Surface section/inventory.
3. Read the new target into `settings.surface.clover.color`; keep automatic persistence/settings transfer and reset through the schema default.
4. Replace the shared ground tint uniform with separate Current and Clover tint uniforms, pass the selected tint into the luminance-preserving tint function, and update both uniforms without recompiling the shader.
5. Keep world randomization coordinated by including Clover color as another `ground` palette role, while still allowing either color to be manually edited afterward.
6. Add the new target to render invalidation and acceptance inventories, then update focused tests for independent uniforms and both shader call sites.

## Unchanged Systems

- Section order, blend-mask controls, PBR normal/roughness/AO maps, texture scale, brightness, shared contrast/saturation, Surface Fade, timeline, layers, media, background, and export actions remain unchanged.
- Renderer pass ownership remains `grass-scan-resource`; the fixed shader performs the same two base-color samples and blend, with one extra retained color uniform only.
