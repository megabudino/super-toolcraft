# Hero card portrait update plan

## Product decision

- Keep the website repository as the only owner of the eight supplied portrait assets and the card-stack markup.
- Keep Toolcraft controls, persistence, the iframe canvas, and the `postMessage` bridge unchanged.
- Preserve five cards per side. The left stack uses portraits 1–5 and the right stack uses portraits 8–4, so all eight supplied images appear across the ten existing card slots.
- Use each source file's native 1792×2304 ratio, simplified to `7 / 9`, for every 3D card.
- Keep `next/image` with `fill`, an explicit responsive `sizes` value, and decorative empty alternative text.

## Files and surfaces

- Add eight immutable assets under `/Users/alex/Projects/recraft-v4-styles/public/images/recraft-hero/card-stack/` with descriptive filenames.
- Update `/Users/alex/Projects/recraft-v4-styles/src/components/pages/home/hero-v4-styles.tsx` for the asset inventory and `aspect-[7/9]` card geometry.
- Update `/Users/alex/Projects/recraft-tools/hero/e2e/app-controls.spec.ts` with focused browser proof for ten loaded cards, eight unique supplied asset URLs, and a `7 / 9` rendered ratio.
- Update `/Users/alex/Projects/recraft-tools/hero/docs/toolcraft/agent-worklog.md` with the later-edit decision trail.

## Unchanged Toolcraft behavior

- Schema controls and control-section inventory: unchanged.
- Panel actions, timeline, layers, persistence, settings transfer, and export: unchanged.
- Renderer ownership: the iframe stays in Toolcraft; the website DOM remains the visual renderer.
- Performance: ordinary product work only. No measured performance or full audit is authorized.

## Focused verification

- Format and statically validate the touched Next.js component.
- Run the website format, lint, type, architecture, unit, and production build checks required by its local contract.
- Run the focused Toolcraft browser smoke scenario for the supplied portraits and inspect the live iframe visually.
- Do not rerun the protected aggregate Toolcraft delivery gate; the first-delivery receipt already exists.
