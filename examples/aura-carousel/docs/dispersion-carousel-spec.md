# Dispersion Carousel Sandbox — Product Spec

## Goal

Build a Toolcraft sandbox for the supplied carousel where the finite canvas is the viewport, changing canvas dimensions crops the carousel, and configurable stationary zones at the left and right edges apply chromatic dispersion, progressive defocus, aura, fade, and refraction. The carousel stays flat with no geometric bend.

## Image refresh — 2026-09-08

The user requested all five photographs to be regenerated in the same style with new and distinct people, scenes, and compositions. The five current `card-*@2x.png` assets replace the historical supplied photographs described below. Warm editorial photography, existing brand marks, 896×1120 backing, rounded-corner alpha and dark lower shading are retained. Testimonials remain live text. Exact generation prompts and output paths are in `image-refresh-prompts.md`.

## Copy refresh — 2026-09-08

The current headline and all five card paragraphs are rewritten at the user's request. English remains the composition language. Copy addresses practical research priorities, returning-customer insight, shared project briefs, shared measures and customer feedback. The heading still occupies two lines, and the paragraphs keep their original 3/3/4/4/3 line counts at 400px text width in Figtree 20px. Each paragraph stays within 3% of its previous character count. Current copy replaces the historical exact-Figma-string requirement below; typography, bottom alignment, photos and brand marks are unchanged.

## Sources Of Truth

- Figma node `6737:6662` in `BZvXRLFX2bR57Gza4vhyxI` supplies the heading, card dimensions, spacing, typography, card artwork, and arrow styling.
- `/Users/kusnizza/Desktop/Wireframes Aug 12 2026/src/components/ui/snap-slider.tsx` supplies carousel behavior: native horizontal scrolling, mandatory snap points, hidden scrollbar, first-item step navigation, smooth scrolling, ArrowLeft/ArrowRight keyboard navigation, passive scroll state, and resize/mutation observation.
- The supplied dispersion references and the user's iterative feedback supply the optical intent for the stationary screen-space WebGL effect.
- The two supplied PNG references supply the visual intent for edge-only chromatic smearing. They do not authorize the curved carousel geometry shown in the references.
- Figma node `6811:7821` supplies the revised five-card order, exact testimonial copy, 24px card padding, Figtree Regular 20px/1.3 testimonial typography, and bottom-aligned text composition.
- The five supplied `Frame 214725756*.png` files are the exact revised 2x card-image sources. They contain the photography, gradient, logos, and 12px clipping, while the testimonial copy remains authored HTML text.

## Product Output

- Initial finite canvas: `1472 × 1034`. The original 1472×714 Figma composition is inset by 160px at the top and bottom.
- Product background: white in preview and export by default.
- Header: Figtree Medium, 48px, 1.1 line height, -0.96px tracking, exact Figma title.
- Header begins at y=160px. The carousel rail begins at y=314px and uses five exact Figma card exports at `448 × 560`, gap `16px`, and the Figma-authored `12px` corner radius.
- Cards remain a flat horizontal strip. No perspective bending, lens bulge, circular squeeze, or arc layout.
- Each card is one authored component containing an exact supplied image and a bottom-aligned testimonial paragraph. The paragraph is live DOM text, not baked into the image asset.
- The accessible DOM rail owns interaction. A screen-space WebGL render of retained image and testimonial textures owns visible card pixels and evaluates symmetrical left/right edge behavior while the native rail scrolls underneath it.
- Card images always participate in the dispersion effect. A `Text effect` switch controls whether testimonial text is sampled by the same shader or remains as a clean DOM overlay while its card image distorts underneath it.
- Edge falloff is nonlinear rather than a flat linear crossfade: the center stays clean, chromatic separation ramps through the transition, and the outer edge reaches maximum distortion.
- Progressive defocus is integrated into the same spectral sampling pass. Blur strength approaches zero at the inner edge-zone boundary and grows toward the outside edge, matching the supplied references without bending the rail.
- The product stays clipped by the runtime-owned finite canvas. Width and height edits change the viewport, not the card or rail dimensions. The 160px vertical insets are part of product geometry and export.

## Interaction Ownership

- Canvas owns carousel navigation: native touch/trackpad scrolling, wheel scrolling, keyboard ArrowLeft/ArrowRight, and the textless previous/next handles from the Figma design.
- Panel owns exact effect values and export settings. It does not duplicate carousel navigation.
- Runtime Setup owns canvas dimensions, background, Infinity availability, render scale, and settings transfer.
- Runtime sticky actions own PNG/JPG export.

## Controls

### Edge Zone

- Edge width — symmetric percentage of the visible carousel viewport used by the effect mask.
- Falloff, Edge fade, Turbulence, Turbulence size — shape the transition and the irregular halo contour.

### Card Content

- Text effect — includes testimonial typography in the same dispersive/blurred sampling path; off keeps the text sharp while images remain distorted.

### Dispersion & Aura

- Dispersion, Samples, Spectrum, Hue, Blur, Aura, Motion boost.

### Boundary Aura

- Band width, Glow, Refraction.

All controls use built-in Toolcraft value models with explicit defaults and applicability. Geometric curvature controls are intentionally absent because the user excluded bending.

## Timeline, Layers, Media, Persistence

- Timeline: disabled. Carousel movement is direct navigation, not authored playback.
- Layers: disabled. The heading, rail, and edge composite form one product output.
- Media upload: disabled. The Figma card exports are the supplied default source content, not user-owned uploads.
- Persistence: runtime default slices for values, canvas, and panels.

## Export

- Image export only; video was not requested.
- Runtime owns format, resolution, encoding, and download.
- The product export renderer draws the heading and current carousel position, then captures the same deterministic velocity-free WebGL pass through both edge zones.
- Image export preserves the selected text-effect mode: distorted text is part of the WebGL snapshot when enabled, while clean text is drawn after the shader snapshot when disabled.
- PNG may be transparent when Background is off; JPG remains opaque through runtime behavior.

## Renderer And Performance Model

- Base product layer: DOM card components for exact image bytes, selectable testimonial copy, accessibility, and native carousel semantics.
- Effect layer: one retained WebGL canvas samples a 2x image-strip texture and, when selected, a transparent 2x testimonial texture. The stationary field is evaluated from viewport coordinates while both textures translate with native scroll.
- Clean text layer: when `Text effect` is off, a pointer-transparent DOM track follows the same `scrollLeft` above the WebGL images.
- Workload dimensions: shader sample count (`6..48`), maximum progressive defocus radius (`0..48px`), and export long edge (`2K..8K`).
- Raster quality: exact selected Toolcraft Resolution scale for interaction and steady states.
- Canvas zoom changes backing density and on-screen scale without changing the shader's logical 1472px coordinate system, including after a reload at reduced zoom.
- No measured performance run is authorized by this ordinary product request.

## Acceptance

- Exact five-card Figma layout and title are visible.
- The revised card order and all five exact Figma testimonial strings are rendered as selectable DOM text with 24px inset, 20px Figtree Regular type, 1.3 line height, and bottom alignment.
- `Text effect` visibly switches testimonial copy between shader-affected pixels and a clean overlay without changing carousel position or card geometry.
- Native rail scroll, snap, keyboard, and arrow navigation change the visible card position.
- Edge width changes the affected zone while the center remains clean.
- The default 30% edge zone combines 90px spectral dispersion, 22px maximum defocus, 28 samples, 0.8 spectrum, 0.6 aura, and the stationary boundary-light recipe.
- Blur changes the outer loss of focus while preserving a sharp center and a smooth inward falloff without visible vertical seams.
- Every exposed shader parameter visibly changes the accepted output on its finite sibling cases.
- Canvas size crops the product without rescaling the cards.
- The default white canvas preserves 160px above and below the Figma composition, and cards keep a 12px radius in clean and distorted layers.
- Preview and exported still preserve the same current rail position and edge-only effect.
- Reload restores product values, canvas, rail position, and panels.
