# Gallery JPG Presets

## Product decision

Convert the eight user-provided AVIF files to high-quality JPG assets and attach
them as the initial `source.images` media collection. They behave like ordinary
Toolcraft image attachments: users can reorder, transform, remove, replace, and
restore them through the existing Gallery `fileDrop`. Reset restores the exact
eight-image order. Flow, Deck, physical bending, canvas interaction, background,
and still export remain unchanged.

## Control and state inventory

- Product need: ready-to-use gallery source set.
- Value model: ordered multi-image source collection.
- Built-in owner: existing `fileDrop` at `source.images`.
- Runtime source: `media.defaultAssets`; no mirrored value state or custom
  preset control.
- Persistence: retain `"media"` and advance the app persistence identity so the
  new defaults are not hidden by the previous empty persisted collection.
- Renderer/export mapping: unchanged runtime media order continues through
  `selectSpiralGalleryImages` into preview and export.
- Timeline/layers: unchanged and omitted.
- Panel actions/export: unchanged.

## Files

- Add eight converted files under `public/gallery-presets/`.
- Update `src/app/app-schema.ts` with ordered `media.defaultAssets` and the next
  persistence identity.
- Update `src/app/app-acceptance-data.ts` so product readiness and media
  acceptance explicitly cover predefined attached media, removal to empty, and
  Reset restoration.
- Update `src/app/spiral-gallery-product.test.ts` with schema-level JPG preset
  assertions.
- Update `e2e/spiral-gallery-test-helpers.ts` so fixture-based scenarios replace
  predefined media deterministically.
- Update `e2e/spiral-gallery.spec.ts` with a dedicated browser scenario proving
  the eight defaults, visible output, removal, and Reset restoration.
- Update `docs/toolcraft/agent-worklog.md` with the delivery decision and proof.

## Verification

Verification tier: Tier 3

Reason: default media changes the initial source lifecycle and visible WebGL
canvas output, while renderer equations, controls, export implementation,
timeline, and layers remain unchanged.

Run:

- `npm run ai:check`
- targeted product Vitest
- targeted default-media browser acceptance
- existing media lifecycle and persistence browser scenarios
- impact-derived `npm run verify:delivery` with exact selectors
- `npm run dev`

Skip:

- Full performance certification: no renderer pass implementation, workload
  boundary, or performance complaint changed.
- Timeline/layer/video checks: those surfaces remain absent.

## Risks

- The JPG files increase the application payload; conversion quality should
  preserve useful detail without embedding the much larger AVIF source files.
- Advancing persistence intentionally starts this version from the new defaults
  rather than restoring the earlier persisted media collection.
