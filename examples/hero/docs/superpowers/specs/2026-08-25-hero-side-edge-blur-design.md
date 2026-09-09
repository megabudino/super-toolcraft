# Hero Side Edge Blur Design

## Goal

On wide screens the outer silhouette of the hero card wall reads sharp against the background at the left and right viewport edges (see the supplied screenshot arrows). Add a dedicated, tunable **side edge blur**: a progressive blur that ramps in from each vertical viewport edge, with two user controls — the band **width** («размер блура с краёв») and the **strength** — tuned from the Toolcraft `hero` workspace.

## Context (checked 2026-08-25)

- The hero renders through a WebGL pipeline with a full-screen **post pass** (`HERO_SPHERE_PASS_SEQUENCE = ['scene', 'field', 'post']`, `hero-sphere-gallery-passes.ts`): the composed scene is already resampled once per pixel by `HERO_DISPERSION_POST_FRAGMENT_SHADER` with edge-zone dispersion machinery (`uEdgeWidth`, `uBlur`, warp, aura, grain/CRT…). That existing `uBlur` belongs to the dispersion optics inside the edge zone — it shapes the chromatic smear, not the outer silhouette, which stays crisp.
- A top/bottom 2D blur existed and was deliberately removed in earlier iterations (`2026-08-22-hero-top-bottom-2d-blur.md`, `2026-08-23-hero-remove-top-bottom-zone.md`) — this design touches the **sides only**.
- The hero workspace runs the full verification machinery (npm scripts, acceptance catalog with per-control browser cases in `e2e/product-effects-preview.spec.ts`, shader unit tests in `hero-dispersion-post-shader.test.ts`); the protocol version moves fast — take current + 1 at implementation time.

## Approach: soften the sampler, in both renderer paths

A review of the running code (2026-08-25) rejected the original "blur after composition" idea and produced the shape below. Two facts drive it:

- The sphere/post pass binds the **default framebuffer** (`gl.bindFramebuffer(gl.FRAMEBUFFER, null)` before the fullscreen draw in `hero-sphere-gallery-passes.ts`): dispersion and aura are composed straight onto the canvas, so no texture holds the composed result. Blurring "after composition" would require a third render target plus another fullscreen pass.
- The Rows path has no fullscreen pass at all: every card owns its own `<canvas>` and WebGL renderer (`hero-dispersion-card.tsx` / `hero-card-dispersion-webgl.ts`), and the browser composites the wall. A screen-space post effect there would mean restructuring Rows into a single surface.

Both renderers already funnel every read of their source through **one sampling function** — `vec4 sampleScene(vec2 point)` in the post shader, and `sampleCard(...)` in the card shader — and both work in **premultiplied alpha** (`straightChannel()` exists precisely to undo it at the end). So the blur belongs inside that sampler, before composition:

- Per fragment, compute the distance to the nearest **vertical** viewport edge in CSS px. The Rows path already has `uCanvasViewportX` and `uViewportWidth`, so each card knows where it sits inside the hero viewport; the post pass has `uScreenSize`. Inside the band `edgeBlur.width`, `factor = smoothstep(width, 0, distance)`; outside it, zero.
- Add `sampleSceneSoft(point)` / `sampleCardSoft(...)`: when `factor × strength < 0.5` it forwards to the existing single-sample function (early-out, byte-identical interior); otherwise it returns a fixed **12-tap Poisson-disk average of premultiplied RGBA** at radius `factor × strength` px.
- Averaging alpha with the color is what actually fixes the screenshot: the card silhouette is an analytic mask (`coverage * roundedCardMask(local)`), not texture content, so taps straddling that boundary feather the outline itself. Dispersion trails, aura and gate terms read the softened value downstream and inherit the softening for free.
- **Cost containment:** the soft sampler replaces only the silhouette-defining reads — the passthrough return, the chroma taps, and the authored-coverage read. The aura and gate loops keep the cheap `sampleScene`; they are already wide low-frequency terms with no hard edge, and routing them through a 12-tap sampler would multiply their loop cost. With that restriction the per-pixel cost stays constant regardless of slider values, so the controls remain honestly `performanceRole: "responsiveness"` and no workload dimension enters the envelope.

Both paths share the same two uniforms and the same settings, so the controls behave identically in Rows and Sphere.

Rejected alternatives: a second framebuffer plus an extra fullscreen pass (real "after composition" blur — costs an RT and a draw, and still leaves Rows unsolved); DOM strips with masked `backdrop-filter` over the canvases (extra compositor cost, stepped banding, blurs the DOM heading where it overlaps); fading the edges toward the background (a fade, not a blur); raising the existing dispersion `Blur` (changes the optics character across the whole zone instead of feathering the outline).

## Settings Model (hero protocol current + 1)

```ts
interface HeroEdgeBlurSettings {
  enabled: boolean; // default true
  width: number;    // px from each vertical edge, 0..480, step 5, default 220
  strength: number; // max blur radius px, 0..48, step 1, default 18
}
// heroSceneSettings.edgeBlur; normalizer defaults a missing group, applied JSON stays valid; Apply persists it.
```

## Toolcraft Controls

New section `Edge Blur` (`entityId: "hero-edge-blur"`, entity: viewport side-edge blur — a screen-space feather, deliberately separate from the Edge Zone dispersion entity):

| Control | Type | Target | Applicability |
| --- | --- | --- | --- |
| `Active` | switch (`orderRole: "mode"`) | `edgeBlur.enabled` | always |
| `Width` (px) | slider (`strength`) | `edgeBlur.width` | enabled |
| `Strength` (px) | slider (`strength`) | `edgeBlur.strength` | enabled |

Descriptions state the sides-only scope and that width is measured inward from each vertical edge. Toolcraft pipeline: sliders join the control-drag target list, the switch joins control-change; scenarios derive as usual.

## Accepted Visual Differences

Blurring the source instead of the composed frame is not free of consequences. Two are consciously accepted, each with a cheap fallback if tuning shows them:

- **Aura and gate read the unblurred sampler.** Their loops stay on the plain sampler for cost, so their glow is derived from a crisp silhouette. Both kernels are wide (7–9 px offsets over a 12-tap loop), so the glow itself still reads soft; the theoretical artifact is a thin crisp core inside a soft halo at the extreme edge. Fallback: route only the aura's center sample through the soft sampler — one extra tap set, never the whole loop.
- **Grain and CRT stay sharp over softened content**, because they are applied after sampling. This matches standard film-emulation order and normally reads correctly. Fallback: attenuate grain amplitude inside the band by the same `factor` (one multiply).

Two further notes, both in the "not a regression" column: chromatic fringes near the edge lose a little contrast because their input is pre-blurred — which is the requested softness, not a defect; and the interior of the frame is untouched thanks to the early-out, so nothing changes outside the band.

**Bleed budget (Rows).** The per-card canvas already extends `HORIZONTAL_BLEED = 256` px toward the outer viewport edge (`left: side === 'left' ? -256 : 0`, `width: calc(100% + 256px)`) and `VERTICAL_BLEED = 80` px vertically — the margin exists exactly where the blur is strongest. With `strength` capped at 48 px the feather cannot be truncated at the canvas boundary; the cheap `coverage <= 0.0001` reject must widen its test box by the current blur radius so taps just outside the card still contribute.

## Records & Verification Posture

Hero keeps its real gates: extend `hero-dispersion-post-shader.test.ts` (uniform presence, band math constants), add the three acceptance rows via the existing `controlAcceptance` helper plus browser cases in the effects spec registration (slider End/Home actions visibly soften/sharpen the outer edge; switch toggles it), run the exact unit tests and `npm run test:feature -- <new acceptance ids>`; no measured performance (fixed tap count, no workload change). Worklog gets the iteration entry with this design's decision trail.

## Out of Scope

- Top/bottom edges (previously removed by explicit decision), per-side asymmetric values, exponent/falloff-curve control.
- Any change to dispersion optics, gates, grain/CRT, or the sphere/rows geometry.
