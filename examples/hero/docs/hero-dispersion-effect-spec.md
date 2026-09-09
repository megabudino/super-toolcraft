# Hero Edge Dispersion Effect Spec

## Source of truth

- Runtime reference: `/Users/alex/Projects/dispersion-carousel-v2`
- Behavior inspected in the running reference at `http://127.0.0.1:3029/`
- Shader and control sources inspected in `src/app/dispersion-carousel/`
- No video or GIF reference was supplied, so `referenceInputs` remains empty.

## Requested result

Replace the hero's frame color, glow, and saturation treatment with the reference app's WebGL dispersion recipe. The treatment is directional per stack:

- Cards in the left stack disperse from their left edge outward.
- Cards in the right stack disperse from their right edge outward.
- The opposite edge and the card center remain clean except where a configured warp, blur, or boundary band reaches inward.
- Each card keeps the existing 7:9 authored image composition and participates in the existing CSS 3D stack transform.

## Repository boundary

- Toolcraft owns the controls, canonical values, persistence, and the versioned `postMessage` payload.
- The website owns image loading, WebGL resources, animation invalidation, and rendering.
- Toolcraft does not reproduce the website renderer or inspect the iframe DOM.
- The website does not contain Toolcraft panels, schema, or persistence logic.

## Controls

Port the reference app's four optical sections with the same defaults, bounds, steps, and conditional branches:

1. Edge Zone: Edge width, Falloff, Edge fade, Turbulence, Turbulence size.
2. Edge Warp: Warp, Style, Offset, Wave, conditional Kind, Strength, Length, Blur, and conditional Prism Face width and Sharpness.
3. Dispersion & Aura: Dispersion, Samples, Spectrum, Hue, Blur, Aura, Motion boost.
4. Boundary Aura: Edge offset, Band width, Glow, Refraction.

The reference's testimonial-text switch, background controls, carousel mechanics, and export controls do not apply to this image-only hero. Existing hero background and stack geometry controls remain unchanged.

## Renderer

- Use the reference raw-WebGL spectral sampling, progressive defocus, turbulence, warp, aura, and boundary-band equations.
- Render one retained canvas surface per card inside a small client-only boundary.
- Mirror the horizontal coordinate and displacement direction for the two stack sides.
- Keep an optimized `next/image` element as the load source and clean fallback while WebGL is unavailable.
- Extend the effect canvas only toward the outward edge so aura and displaced pixels are not clipped by the authored card rectangle.
- Use device-pixel-ratio backing capped to a safe maximum and resize only when the card box changes.
- Coalesce settings and size updates into animation frames and dispose WebGL resources on unmount or context loss.
- Motion boost follows actual card translation changes caused by stack controls, then decays; it does not create autonomous motion.

## Product surfaces

- Timeline: unchanged and disabled; no autonomous animation is introduced.
- Layers: unchanged and disabled; each website card remains implementation detail, not a Toolcraft layer.
- Export: unchanged and not requested; Toolcraft continues to preview the external website only.
- Persistence: unchanged; all new settings use Toolcraft runtime values and the existing workspace persistence slices.
- View interaction: unchanged; Toolcraft viewport navigation frames the external preview and does not edit website card geometry.

## Acceptance

- Every new control maps to a distinct protocol property and invalidates the preview-sync pass.
- Old frame color, glow, and saturation targets are absent from schema, protocol, acceptance, and the website renderer.
- The website creates ten card surfaces using the current eight image URLs and 7:9 aspect ratio.
- Left cards declare a left/outward dispersion side; right cards declare a right/outward side.
- Prism-only and wave-only controls appear only in their accepted branches.
- The browser proof changes one zone control, one warp control, one spectral control, and one boundary control and observes the corresponding version-2 payload and visible canvas output.

## Verification note

Verification tier: Tier 3

Reason: This later feature edit replaces schema targets and the website card renderer with a WebGL effect, changes the iframe protocol, and adds conditional controls without changing Toolcraft runtime internals.

Run: focused product/unit tests for schema-to-protocol mapping; focused Toolcraft browser acceptance for the new effect controls and card surfaces; website format, lint, typecheck, architecture, unit tests, build, and focused visual/e2e checks; browser screenshots of the standalone website and embedded Toolcraft preview.

Skip: the protected first-delivery gate and measured performance suites because an initial delivery receipt already exists and the user did not request a performance audit.
