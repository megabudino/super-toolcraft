# Sports cover presets design

## Goal

Replace the current bundled Source Photo cover catalog with the four user-supplied sports images, while retaining only the existing third preset, Mesh.

## Catalog and layout

The built-in `imagePicker` keeps its four-column layout. Preset order is:

1. Runner — `Runner Sports Photography Close Crop.png`
2. Profile — `Strict 90 Side Profile Close-up.png`
3. Fitness — `Fitness Banner Explore.png`
4. Pilates — `Pilates Training Group of 8.png`
5. Mesh — the retained third preset from the current catalog

The four supplied images therefore occupy the first row and Mesh starts the second row. All other current presets are removed from the catalog. Runner becomes the new default preset.

## Assets

Store optimized local JPEG copies under `public/covers/` with stable, semantic filenames. Preserve each source image's original crop and aspect ratio. Compression may reduce transfer and decode cost but must not introduce a new crop, overlay, or color treatment.

## State and output

The existing `source.preset` target remains the sole preset selection state. `coverPresetSrc` continues to resolve that value for the live SVG poster and Canvas export. Uploaded `source.image` media continues to override a preset.

The catalog keeps the legacy internal value `atlas` for Runner so the previous default restores without disturbing unrelated poster state. If persisted state contains any other removed preset id, app assembly normalizes only `source.preset` to Runner. The resolver uses the same normalization so preview and export never temporarily lose their cover while that one-target migration commits.

No renderer, export, persistence storage format, canvas sizing, or interaction-ownership architecture changes are required.

## Acceptance

Update schema and acceptance option coverage to the five new ordered values. Browser coverage must click every preset, prove the full-bleed cover changes, and return to Runner. A focused schema test must prove the exact order, new default, and removed-id normalization.

## Verification

Verification tier: Tier 3

Reason: bundled media, live poster background pixels, and exported background pixels change, while the renderer pipeline and workload dimensions remain unchanged.

Run: focused schema test, focused Source Photo browser acceptance, protected targeted delivery, then the local dev server and browser visual verification.

Skip: full performance certification because the user did not request it and the asset set remains bounded to five static images.
