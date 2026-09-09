# Persistent header divider

- Request: «сделай под шапкой полосу тонкую как при скролле появляется».
- Target: Native hero in the existing Toolcraft app on port 3005.
- Decision: Keep the exact existing lower shadow (`0 1px 2px rgb(0 0 0 / 0.08)`) visible from the first frame by moving it from the scroll-only pseudo-element onto the header. Preserve the existing scroll-triggered backdrop and inset highlight.
- Edit: `src/section/components/sticky-header.module.css` only, plus this plan and the editable worklog. No schema, settings, scene geometry, controls, timeline, layers, renderer, export or persistence changes.
- Preflight: Visual technique route; reuse unchanged runtime-boundary, core/performance, renderer-technique, performance and acceptance documents already read in this conversation. Toolcraft brainstorming and writing-plans skills apply.
- Verification: Later focused presentation edit. Run the existing `pnpm exec vitest run src/app/hero-website-preview.test.tsx`, inspect the header at the top in the embedded browser, and review the CSS to ensure the scroll pseudo-element no longer duplicates the lower shadow.
- Skip: New implementation-mirroring tests, aggregate suites, build, renderer, export and measured performance checks; unnecessary for this CSS-only request.
