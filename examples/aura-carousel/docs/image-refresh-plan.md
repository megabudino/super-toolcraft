# Carousel image refresh

Request: regenerate every carousel photograph in the same style, with distinct new subjects and scenes.

Verification tier: Tier 3
Reason: replace five image sources consumed by preview and export; renderer code, geometry, controls, persistence, and workload boundaries stay the same.
Run: visual comparison of all generated images; focused carousel/export browser diagnostics; `npm run dev`.
Skip: aggregate delivery, measured performance and full performance audit under the user's standing `тяжелый проверки не запускай` instruction recorded in worklog iterations 22–23. No new unit tests for a reversible asset replacement. Focused diagnostics do not mint a protected receipt.

## Scope and preflight

- Generated app; selected route: Export, copy, media, background (source image assets only).
- Plan: read `workflow.md`, `core/setup-export.md`, `core/media-upload.md`.
- Implementation: read `schema-reference.md` and `component-rules.md`.
- Apply imagegen and local brainstorming/writing-plans workflows; the explicit replacement request approves the asset refresh.
- Keep the five authored cards, logo identities, 896×1120 dimensions, rounded corners, lower shading, live testimonials, and every existing interaction.
- No supplied motion reference; `referenceInputs: []` remains appropriate.

## Implementation

1. Generate one new photograph for each card using its existing PNG as art-direction reference. Use five distinct fictional people, environments, camera compositions and activities. Preserve top-left brand marks.
2. Inspect generated outputs, save the originals outside the public asset directory for reversibility, and replace the five `public/assets/dispersion-carousel/card-*@2x.png` assets with approved generated images. Normalize dimensions only if necessary.
3. Rebuild the existing `carousel-strip@2x.png` overview from the new cards with the existing live testimonial layout. Keep all production source paths and impact ownership intact.
4. Record source mapping and exact prompts in `docs/image-refresh-prompts.md`, add one current decision-trail entry to the editable worklog, and clarify the superseded image-source spec.
5. Read Verification route documents (`acceptance-testing.md`, `performance.md`), inspect the actual carousel and representative export, and leave the dev app running. Keep the protected delivery gate deferred under the standing no-heavy-checks constraint discovered in the existing worklog.
