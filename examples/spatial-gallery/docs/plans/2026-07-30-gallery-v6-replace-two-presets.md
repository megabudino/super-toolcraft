# Gallery V6 — Replace Two Presets

## Product Decision

- Replace the user-identified `Spectrum Gradient.jpg` preset with `Salt Ponds Aerial.jpg`.
- Replace the user-identified `Neon City Reflection.jpg` preset with `Blue Ice Cave.jpg`.
- Keep the other twelve presets in their current shuffled positions, preserving a fourteen-image default collection and 42 Flow cards at repetition three.
- Keep the existing Gallery `fileDrop` as the only collection owner. The Control Section Inventory, canvas browsing, WebGL card bending, Flow/Deck layouts, still export, layers, and timeline decisions do not change.
- Store both replacements as local quality-90 JPEG assets with a 3000 px long edge. No source labels or attribution UI are added.
- Bump persistence to v6 so an existing v5 media collection cannot retain the two rejected images.

## Files

- Add `public/gallery-presets/salt-ponds-aerial.jpg`.
- Add `public/gallery-presets/blue-ice-cave.jpg`.
- Remove the two superseded preset files after references are migrated.
- Update `src/app/app-schema.ts` with the replacement asset records and v6 persistence identity.
- Update `src/app/spiral-gallery-product.test.ts` and `e2e/spiral-gallery.spec.ts` with the exact fourteen-item default sequence.
- Record the decision, sources, evidence, verification, and risks in `docs/toolcraft/agent-worklog.md`.

## Verification

Verification tier: Tier 3

Reason: Default media, persistence identity, and initial WebGL output change while renderer passes, physics, controls, export, and workload limits remain unchanged.

Run:

- `npm run ai:check`
- `pnpm typecheck`
- `pnpm exec vitest run src/app/spiral-gallery-product.test.ts`
- Targeted media lifecycle browser acceptance.
- Targeted persistence browser acceptance.
- Real local-browser reload confirming 14 thumbnails, 42 cards, ready textures, and absence of both superseded file names.
- `npm run verify:delivery -- --tier=3 --unit-test=src/app/spiral-gallery-product.test.ts --browser-test="browser: image gallery media lifecycle controls the rendered sequence" --browser-test="browser: image gallery settings and media persist after reload"`
- `npm run dev`

Skip:

- Renderer performance scenarios and full performance certification because no renderer pass, shader, workload boundary, lifecycle, fixture adapter, or export algorithm changes.

