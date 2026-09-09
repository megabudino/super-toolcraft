# Native Percents hero preview

## Approved scope

User request: follow Recraft's three independent native applications, remove the iframe, bring the website section into the preview project, and retain only the hero screen and its reachable assets.

The active iframe lives in `percent-hero-iframe-generator`, not the older `percent-hero` renderer project. Change this existing preview app in place. Keep the original Percents website, Recraft applications, and 3D-generator projects unchanged.

## Decisions

- Follow `recraft-apps/hero`: local `src/section` source, scoped CSS, native React output inside the existing Toolcraft host, and canvas-relative breakpoints. No Next.js server, iframe, message bridge, symlink, or source-project runtime import.
- Port the actual `Header` and `HeroSection` dependency closure. Preserve authored content, header logo motion, rotating partner-logo grid, and the current preview-only frozen hero media. Retain all 24 logo candidates because rotation reaches them, not only the initially visible 12.
- Retain existing typography/layout targets, wave renderer, presets, masks, playback, history, settings transfer and local persistence. Direct props/CSS variables replace message transport. No new controls, timeline, layers or export actions.
- Keep the current wave as the background; this migration does not change video compression or replace the editable renderer with a movie.
- Restrict media to explicit section references and exact local font faces. Do not copy footer, blog, case-study, diagram or unused hero experiments. Existing reference evidence and signed framework assets are not unused shipping assets and will not be deleted.

## Implementation

1. Record source hashes and copy only the reachable hero modules/assets into `src/section` and `public`. Replace Next Image/Link with local equivalents; retain original component structure and animation logic.
2. Generate a scoped CSS module from the source theme plus only section utility candidates. Namespace utility classes, localize viewport units, and replace viewport breakpoints with a named container. Copy only referenced fonts.
3. Replace `hero-website-preview.tsx` iframe with native header/hero composition and direct canonical settings. Keep the wave layer and mask-handle layering unchanged.
4. Remove dead message-transport exports and update product-owned acceptance/performance descriptions and focused tests. Document the standalone run command and an asset manifest.
5. Verify the independent app while requests to the source server are blocked; confirm typography/layout updates, viewport sizing, local assets, logos and frozen media.

## Verification

Verification tier: Tier 3, later focused migration
Reason: foreground presentation moves from a separate document into the local product scene; the existing WebGL algorithm and runtime state contract are unchanged.
Run: targeted serializer/native-section tests; explicit hero preview acceptance IDs; focused headless native independence/responsive test; embedded browser visual inspection. One production build is justified to prove the copied dependency/asset closure ships without the source project.
Skip: full delivery, unrelated renderer tests, exports, performance measurement and aggregate browser matrix. This request authorizes migration, not an audit.

Routes: app assembly and reference-runtime port. Plan: runtime-boundary, assembly-workflow, reference-study. Implementation: schema-reference, decision-contract. Browser skill supplies focused live visual inspection after implementation.

## Completed

Native section and exact 28-file asset closure shipped. Production build, TypeScript and 19 focused unit tests passed. All 10 selected browser cases passed against the production preview (eight controls, persistence and standalone/responsive behavior). A final rebuild incorporated the CSS cascade-order fix; the supported preview-server mode avoided dev navigation interference. No full delivery or performance audit was run.
