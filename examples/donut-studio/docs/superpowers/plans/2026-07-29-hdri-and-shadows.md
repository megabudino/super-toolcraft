# HDRI and Shadows Implementation Plan

1. Extend `DonutSettings` and `DONUT_DEFAULTS` with HDRI enabled/backdrop/blur and shadow enabled/strength/softness values; update value parsing tests.
2. Add built-in controls to the existing `Environment` section and add a focused `Shadows` section; update section inventory, schema tests, reference acceptance, and top-level acceptance data.
3. Update the retained Three.js scene so the supplied HDR texture owns environment lighting and optional blurred background, while the retained directional proxy owns configurable shadows using the current non-deprecated shadow-map type.
4. Keep every new target on the preview-render invalidation path and update the verification-impact inventory.
5. Add unit coverage for default/read/clamp behavior, section targets, pipeline invalidation, HDRI asset ownership, and retained shadow settings.
6. Add real-pixel browser acceptance for all new controls and transparent-background compatibility.
7. Update the product worklog with the request, renderer/state decisions, source asset, verification tier, and ordinary-product-work performance intent.
8. Run focused Vitest and Playwright checks, `pnpm ai:check`, `pnpm exec tsc --noEmit`, one bare `npm run verify:delivery`, then reuse/start the saved-port dev server and visually inspect the live WebGL result.
