# Edible Materials Implementation Plan

1. Extend `donut-types.ts` and `donut-values.ts` with bounded dough surface and
   icing glaze/texture settings, then add normalization tests.
2. Add built-in sliders to `donut-schema-sections.ts`, update the exported
   control-section inventory, acceptance rows, reference feature inventory, and
   verification-impact ownership.
3. Prepare the user-supplied BaseColor, Roughness, and Normal maps as 2K runtime
   assets with a source manifest, then add a focused food-shader module that
   applies them through deterministic object-space triplanar atlas projection.
4. Rework `donut-assets.ts` and `donut-materials.ts` to retain the scanned maps,
   install/update shader uniforms, remove the emissive subsurface shortcut, and
   use restrained specular/clearcoat/transmission for dough and icing.
5. Include the six targets in the canonical preview-render invalidation path;
   reassess the render plan and keep existing workload dimensions if no new
   magnitude is introduced.
6. Add unit tests for material construction/uniform updates and browser
   acceptance proving every new slider changes stable product output while
   preserving existing preview/export behavior.
7. Update `agent-worklog.md`, run targeted development checks, inspect the live
   page visually, run the protected functional delivery gate once, and leave the
   saved dev server active.
