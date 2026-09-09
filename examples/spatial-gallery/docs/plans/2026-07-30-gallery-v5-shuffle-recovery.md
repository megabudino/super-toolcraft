# Gallery V5 Shuffle Recovery Plan

Verification tier: Tier 3
Reason: The complete default-media order and persistence identity change the initial visible WebGL output and recover already-open profiles from the stale eight-image state; renderer passes, physics, controls, and export implementation remain unchanged.
Run: `npm run ai:check`; targeted product Vitest; targeted media and persistence Playwright scenarios; `npm run verify:delivery` with exact selectors; `npm run dev`.
Skip: Renderer performance scenarios and full performance certification because no shader, pass, workload boundary, resource lifecycle, animation loop, or export algorithm changes.

## Product behavior

- Keep the same fourteen local JPG assets and the existing Gallery `fileDrop`.
- Replace the default order with one deterministic shuffle of all fourteen images:
  1. Misty Forest
  2. Spectrum Gradient
  3. Aerial Mountain Range
  4. Neon City Reflection
  5. Pink White Background
  6. Desert Dune
  7. Modern High-Rise Buildings
  8. Blue Pink Light
  9. Snow-capped Mountain
  10. Turquoise Ocean
  11. Geometric Facade London
  12. Abstract Red Orange
  13. Modern Architecture
  14. Blue Pink Background
- Bump local persistence to v5 so a profile that captured the old eight-image set during hot reload starts from the complete shuffled defaults.
- Keep all media operations, fixed-camera browsing, Flow/Deck geometry, physical bends, background, still export, timeline omission, and layer omission unchanged.
- Navigate the remaining live browser tab away before changing the persistence identity so hot reload cannot copy its stale media state into the new key; return it to the app after implementation.

## Implementation

1. Update `src/app/app-schema.ts` with the complete shuffled default-asset order and persistence v5.
2. Update `src/app/spiral-gallery-product.test.ts` with the exact order and v5 contract.
3. Update `e2e/spiral-gallery.spec.ts` with the exact default filename order.
4. Update `docs/toolcraft/agent-worklog.md` with the reproduced three-tab stale-state evidence, narrow-viewport Reset limitation, root cause, recovery decision, verification, and risks.

## Verification

- Unit-prove fourteen common JPG media records in exact order and persistence v5.
- Browser-prove removal to empty, Reset to exact shuffled defaults, ordinary upload/reorder/transform/remove, and reload persistence.
- In the remaining in-app browser tab confirm fourteen thumbnails, 42 Flow cards, ready textures, settled physics, and no visible errors after a real reload.
- Run the protected Tier 3 delivery gate once, then confirm the saved local server URL.
