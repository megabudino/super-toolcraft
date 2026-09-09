# Fine Details Toolcraft section

## Context

The second homepage section is `FineDetailsSection`, currently rendered immediately after the hero. Its website implementation contains the white/grey grid background plus the `HOLDS ONTO FINE DETAILS` composition, fashion artwork, textured letters, palette, labels, sticky note, clip, and scroll-driven parallax.

The design will be replaced. The requested retained baseline is only the current near-white background with its existing grid texture. All foreground copy, artwork, labels, palette UI, decorative objects, and parallax are removed from the rendered website section. Their source assets do not need to be destructively deleted because a later design may reuse them.

## Product boundary

Create a fourth independent Toolcraft application at `recraft-tools/fine-details`, alongside `hero`, `api-section`, and `pre-footer`. It owns only the Fine Details section and previews the real website component through a pointer-transparent iframe. It must not be embedded into Hero or share Hero state.

The website continues to render the section second in homepage order. A dedicated `/toolcraft/fine-details` route renders only that same section boundary, without the rest of the landing page.

## Retained website output

The section contains one background layer:

- default section height: `1080px` at the `1920px` authoring width, retaining the current responsive `56.25vw` cap on narrower screens;
- default background: the current near-white `#f2f2f2`;
- grid source: the existing `/images/recraft-fine-details/grid.png` texture;
- default grid tile size: `50px`;
- default grid opacity: `80%`.

`FineDetailsParallaxScene` and `FineDetailsColorPalette` are removed from the render path. The resulting section has no text, images other than the grid texture, interactive content, or motion.

## Basic Toolcraft controls

The Toolcraft canvas is `1920 × 1080` with editable output height. The Controls panel contains one `Background` section:

- `Background` — Color, default `#f2f2f2`;
- `Grid size` — continuous Slider, `10–200px`, default `50px`;
- `Grid opacity` — continuous Slider, `0–100%`, default `80%`.

Canvas height remains the canonical section-height control instead of duplicating it in the panel. The final sticky `Website` section contains adjacent `Reset` and `Apply` actions. Reset restores Toolcraft values and the local website to the defaults above. Apply writes the current height and background settings to the local website.

The toolbar keeps History, Radar, and Zoom. There is no Layers panel, Timeline, media upload, canvas object handle, or custom control.

## Preview and persistence flow

Toolcraft canonical state is normalized into:

```ts
interface FineDetailsSettings {
  background: string;
  gridOpacity: number;
  gridSize: number;
  height: number;
}
```

The Toolcraft iframe loads `http://localhost:3000/toolcraft/fine-details`. A version-1, origin-checked `postMessage` protocol carries live settings and request-scoped Apply/Reset messages. The iframe sends ready and save-result acknowledgements. Pending saves time out and are rejected on iframe reload or unmount.

The Next.js boundary normalizes all incoming settings and owns the live preview state. Apply/Reset use a development-only `PUT /api/fine-details-settings` endpoint that validates a small JSON payload and atomically rewrites a tracked applied-settings JSON file. A `BroadcastChannel` publishes the returned settings so a separately opened homepage tab updates after Apply or Reset without a Git push.

The production homepage reads the tracked applied settings. Non-local or non-development writes are rejected. Invalid preview messages or payloads leave the last valid settings visible.

## Export policy

Toolcraft artifact export is entirely absent:

- no export renderer in `appComposition`;
- no export actions in schema or toolbar;
- no PNG, SVG, or video export path;
- performance and acceptance metadata declare `exportRenderer: "none"` and exclude export scenarios.

The website remains the sole renderer of the section.

## Error and reset behavior

- If the iframe is not ready, Apply/Reset reports panel feedback without mutating the website.
- If persistence fails, the website sends a failed acknowledgement and keeps the last valid state.
- Reset writes exactly the default `1080 / #f2f2f2 / 50 / 80` settings to both Toolcraft and the website.
- Website preview and standalone homepage use the same normalized component, preventing visual drift.

## Scope boundaries

This delivery does not introduce the replacement Fine Details design, foreground layers, typography, media, parallax, export, or animation controls. It does not modify Hero, API Section, Pre-footer, Single Reference, Scenarios, or their settings.

Per the user's standing workflow instruction, implementation is handed over for local review without running tests, lint, typecheck, formatting, build, browser verification, or diff-check commands. No commit or push is made unless requested separately.
