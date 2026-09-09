# Native Hero migration

This independent app owns a copy of the original Hero section in `src/section`. The original repositories are reference inputs and were not edited. `source-manifest.json` records the initial copy identity.

The active composition mounts `HeroNativePreview` and `HeroV4Styles` directly. The section keeps its original DOM, gallery drag/click animation, timed jumps, mirrored Rows, lens, spectral dispersion, Grain, CRT, badge, subtitle, CTA, ticker, reveal, visibility, and WebGL disposal behavior. Next Image and Link use local React adapters and dynamic loading uses React lazy/Suspense. The original export/snapshot provider and external video controller are disconnected. Offscreen retained-frame snapshots remain preview lifecycle resources.

Toolcraft owns settings, commands, history, settings transfer, persistence, and image uploads. The original image collection is attached as runtime default media. Runtime presentation leases feed the local gallery media store; rotations/flips are consumed by the original shaders. Deleting or clearing an image cannot resurrect an authored fallback. Pending media fetches abort and temporary image/bitmap resources release on removal/unmount.

Apply records a canonical local checkpoint in `hero.appliedSettings`, included in runtime persistence/settings transfer. Reset dispatches runtime `controls.reset`. Neither action sends a request to or changes the original website. There are no enabled artifact export actions.

The scoped site CSS imports exact local fonts and preserves the source utility behavior. Final DOM utility tokens are namespaced with `ref-`, after local Button class merging, so Toolcraft's global utilities cannot override the section's theme or responsive behavior. CSS module classes remain unchanged. Width/height breakpoints and viewport units refer to the Toolcraft canvas frame. The user explicitly requested complete website sections, so the source CTA and ticker are retained as website product content.

`scripts/check-hero-native-browser.mjs` performs a focused native browser diagnostic against port 3101: Sphere/Rows mounting, original canvas drag, runtime Apply/reload persistence, editable CTA, mobile canvas breakpoint in a desktop-width browser, Reset, zero iframes, and page errors. It is not a replacement for protected acceptance.

Cross-section anchors such as the CTA's `#fine-details` are retained from the website. This standalone app contains only Hero, so those links do not have another section to scroll to here and do not depend on another app's development port.

Verification is first-delivery functional only. No measured performance audit is authorized. See the current worklog entry for executed checks and blockers; inherited reference-era tests continue to describe the former iframe implementation and are not native acceptance evidence.
