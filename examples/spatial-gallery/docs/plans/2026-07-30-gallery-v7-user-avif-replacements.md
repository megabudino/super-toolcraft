# Gallery V7 — User AVIF Replacements

## Product Decision

- Replace the user-identified `Salt Ponds Aerial.jpg` card with the first supplied source, `White SUV Desert Photo.avif`.
- Replace the user-identified `Misty Forest.jpg` card with the second supplied source, `Woman with White Eyeliner and Yellow Jacket (1).avif`.
- Convert both AVIF sources to local quality-90 JPG files with a maximum 3000 px long edge.
- Preserve the other twelve preset positions, the fourteen-image collection, and 42 Flow cards at repetition three.
- Keep the existing Gallery `fileDrop`, canvas browsing, Flow/Deck layouts, physical WebGL card bending, still export, no-layer policy, and no-timeline policy unchanged.
- Bump persistence to v7 so existing v6 media cannot retain the two superseded cards.

## Files

- Add `public/gallery-presets/white-suv-desert.jpg`.
- Add `public/gallery-presets/woman-white-eyeliner-yellow-jacket.jpg`.
- Remove the two superseded public preset files after references are migrated, keeping a temporary recoverable backup.
- Update `src/app/app-schema.ts`, `src/app/spiral-gallery-product.test.ts`, and `e2e/spiral-gallery.spec.ts` with the exact v7 default sequence.
- Update `docs/toolcraft/agent-worklog.md` with the decision, user sources, evidence, verification, and risks.

## Verification

Verification tier: Tier 3

Reason: Default media, persistence identity, and initial WebGL output change while renderer passes, physics, controls, export, and workload limits remain unchanged.

Run:

- `npm run ai:check`
- `pnpm typecheck`
- `pnpm exec vitest run src/app/spiral-gallery-product.test.ts`
- Targeted media lifecycle browser acceptance.
- Targeted persistence browser acceptance.
- Real local-browser reload confirming 14 thumbnails, 42 cards, ready textures, both new names present, and both superseded names absent.
- `npm run verify:delivery -- --tier=3 --unit-test=src/app/spiral-gallery-product.test.ts --browser-test="browser: image gallery media lifecycle controls the rendered sequence" --browser-test="browser: image gallery settings and media persist after reload"`
- `npm run dev`

Skip:

- Renderer performance scenarios and full performance certification because no renderer pass, shader, workload boundary, lifecycle, fixture adapter, or export algorithm changes.

