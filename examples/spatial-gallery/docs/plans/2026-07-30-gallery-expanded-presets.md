# Expanded Gallery Presets Plan

Verification tier: Tier 3
Reason: The built-in media collection, order, persistence identity, and initial WebGL output change; the renderer pipeline, physics, controls, and export algorithms stay unchanged.
Run: `npm run ai:check`; targeted product Vitest; targeted media and persistence Playwright scenarios; `npm run verify:delivery` with exact selectors; `npm run dev`.
Skip: Renderer performance scenarios and full performance certification because no pass, shader, workload boundary, animation lifecycle, or export implementation changes.

## Product behavior

- Keep the existing Gallery `fileDrop` as the only source-collection UI.
- Expand the default collection from eight to fourteen local JPG assets.
- Reorder the defaults into a fixed mixed sequence alternating nature, architecture, and abstract/color imagery.
- Add six varied Unsplash images: turquoise ocean, misty forest, desert dune, neon city reflection, modern architecture, and a colorful abstract gradient.
- Treat all fourteen defaults as ordinary attached media: selection, transforms, reordering, removal, replacement, export, persistence, and Reset continue through Toolcraft runtime media state.
- Bump the persistence key/version to v4 so the newly requested order and assets are visible instead of being shadowed by the prior v3 default collection.
- Keep canvas sizing, controls inventory, fixed-camera browsing, physics, renderer, background, still export, timeline omission, and layers omission unchanged.

## Implementation

1. Download the six chosen Unsplash originals, convert/normalize them to quality-90 JPG at a bounded long edge, and store them in `public/gallery-presets`.
2. Update `src/app/app-schema.ts` with the six new default-asset records, the mixed fourteen-item order, and persistence v4.
3. Update `src/app/app-acceptance-data.ts` so media lifecycle evidence expects fourteen predefined JPGs and exact Reset restoration.
4. Update `src/app/spiral-gallery-product.test.ts` with the exact fourteen-item order and v4 persistence contract.
5. Update `e2e/spiral-gallery.spec.ts` expected default filenames and rendered card counts while retaining deterministic fixture upload coverage.
6. Record the source URLs, decisions, verification, payload risk, and unchanged performance model in `docs/toolcraft/agent-worklog.md`.

## Verification

- Confirm all fourteen preset paths decode as JPEG and all six new assets have useful non-thumbnail dimensions.
- Confirm fresh UI shows fourteen thumbnails in exact order, 42 rendered cards at the default repetition count, ready textures, settled physics, and no visible errors.
- Prove removal to empty, Reset to exact fourteen-image order, normal upload/reorder/transform/remove behavior, and reload persistence.
- Run the protected Tier 3 delivery gate once after implementation stabilizes, then confirm the saved local server URL.
