# Blend Sunset HDRI implementation plan

1. Use Blender in background mode to load the external 9000×4500 EXR referenced by `/Users/kusnizza/Desktop/hdri.blend`, make a 2K equirectangular copy, save it as Radiance HDR, and create a compact PNG picker preview under `src/app/grass/assets/hdri`.
2. Register `blendSunset` and the `Blend Sunset` picker item in `src/app/grass/grass-hdri.ts`; retain the current Hard Sun defaults, source-keyed cache behavior, neutral tuning fallback, persistence, controls, timeline, layers, and exports.
3. Align product acceptance wording, authored browser expectations, and the product unit expectation with the eighth bundled environment without changing protected runtime test files.
4. Record the source inspection, state/output mapping, unchanged performance envelope, and deliberately skipped verification in `docs/toolcraft/agent-worklog.md`.
5. Do not run automated tests, build, browser acceptance, performance checks, or `verify:delivery` in this batch. Leave the existing development server available at its saved URL.
