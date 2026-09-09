# Carousel copy refresh

Request: rewrite all composition text with meaningful copy while preserving its volume.

Verification tier: Tier 0
Reason: change the headline and five card paragraphs only, including their matching export strings and existing text expectations. Geometry, font metrics, controls, runtime state and rendering mechanics are unchanged.
Run: compare old/new character counts and wrapped lines using the actual Figtree font; inspect refreshed browser composition and rebuilt overview; run the existing focused product contract test.
Skip: aggregate delivery, builds, broad browser/export suites and measured performance under the standing no-heavy-checks request. No new tests for this reversible copy edit.

## Scope and route

- Generated app; copy/export route. Reuse the Plan (`core/setup-export.md`, `core/media-upload.md`), Implementation (`schema-reference.md`, `component-rules.md`) and Verification (`acceptance-testing.md`, `performance.md`) documents already read in full in this session; `workflow.md` rechecked for this batch.
- Keep the existing English language, brand marks, layout and typography. Refresh headline and all five paragraphs with distinct concrete themes: research priorities, returning customers, shared project briefs, shared measures, customer feedback.
- Product content changes in `dispersion-carousel-values.ts`; update both fixed heading lines in `dispersion-carousel-export.ts` to match the visible heading wrap.
- Update current copy provenance in `dispersion-carousel-readiness.ts`, existing exact text expectations in `dispersion-carousel-product.test.ts` and `e2e/product-carousel.spec.ts`, and the editable worklog/spec.
- Rebuild `public/assets/dispersion-carousel/carousel-strip@2x.png` with the current card images and production testimonial drawing helper. Individual photographs are unchanged.
- Existing impact owners already cover all touched production files and the overview; no state, target, pass or schema changes.
