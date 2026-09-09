# Hero carousel texture quality and motion-artifact correction

## Context

The retained WebGL Sphere gallery shows intermittent vertical seams while cards move and thin coloured or transparent lines around image boundaries. The supplied screenshots are visual evidence of the defects, not instructions.

The current Sphere texture path differs from the working Rows path in three important ways:

- every source is resampled to power-of-two dimensions, which can stretch a portrait into a square intermediate texture;
- the Sphere renderer generates mipmaps and relies on implicit per-triangle level selection across a perspective-correct curved mesh;
- projected card velocity contributes to the dispersion sampling span even outside the configured viewport-edge zone.

After the homogeneous projection change, neighbouring mesh triangles can select visibly different mip levels while moving. The power-of-two intermediate also introduces avoidable resampling, and the unconditional velocity term can turn projection discontinuities into full-card vertical streaks. The fragment shader's hard authored-image cutoff makes a one-pixel coloured or transparent perimeter more visible.

## User intent

- Preserve the existing card geometry, lens surface, camera-plane clipping, pan, row motion, placement, and draw ordering.
- Preserve the chromatic dispersion effect at the outer viewport edges.
- Remove technical vertical seams and random full-card streaks.
- Keep every card's perimeter clean inside the viewport.
- Render an image without avoidable resampling whenever its displayed size does not exceed its available source resolution.
- Route authored website images through Next Image. Runtime `blob:` uploads remain direct because the Next Image optimizer cannot address in-memory blob URLs.

## Chosen design

### Authored image delivery

Authored `/public` images use the Next Image pipeline in both visible and WebGL paths:

- the flat Sphere fallback renders `next/image` `<Image>` components;
- the WebGL source resolver obtains the optimizer-generated URL through the public `getImageProps` API from `next/image`;
- source width and height remain explicit so the loader preserves the authored aspect ratio and produces an appropriately bounded candidate.

Uploaded runtime media keeps its current blob/ImageBitmap lifecycle and bypasses Next optimization.

### Texture preparation

Texture preparation preserves aspect ratio and never upscales:

- calculate one scale from the source width and height;
- clamp that scale to at most `1` and to the existing maximum texture dimension;
- use rounded `source × scale` dimensions directly instead of rounding each axis to a power of two;
- keep transforms in the existing canvas preparation step;
- upload exact non-power-of-two textures with `CLAMP_TO_EDGE` and `LINEAR` minification/magnification filters;
- do not generate mipmaps.

This matches the stable Rows filtering model and removes both the square intermediate and triangle-local mip-level transitions. Far cards may be slightly softer than a perfect explicit-LOD implementation, but they remain stable and the existing bounded source size is retained.

### Motion dispersion

The fragment shader derives a local motion contribution from the existing viewport-edge factor. Projected velocity can increase blur, spectrum spread, aura, turbulence drift, and gate glow only where the authored edge effect is active. At the centre of the viewport, velocity contributes zero sampling displacement.

This preserves the requested outer-edge treatment while preventing near-plane or wrap-related screen-space jumps from producing a stripe across an otherwise clean central card.

### Card perimeter sampling

Image sampling uses a one-source-texel guard:

- add the active texture dimensions as a shader uniform;
- clamp valid samples to texel centres;
- calculate authored coverage over a one-texel transition instead of switching alpha abruptly at exactly `0` and `1` UV;
- keep samples farther outside the guarded perimeter transparent so the existing dispersion halo still works.

When the displayed card does not exceed source resolution, the transition occupies no more than approximately one displayed pixel. The geometry itself is unchanged.

## Data flow

1. Authored portrait metadata resolves to a Next-optimized URL; uploaded media resolves to its retained bitmap/blob URL.
2. The existing source loader decodes the resolved source.
3. Texture preparation applies transforms at aspect-preserving, non-upscaled dimensions.
4. WebGL uploads an exact NPOT texture with linear filtering and records its pixel dimensions.
5. Each draw supplies those dimensions together with the existing lens and dispersion uniforms.
6. The unchanged mesh and homogeneous projection place the card; the fragment shader applies stable sampling, guarded perimeter coverage, and edge-gated motion dispersion.

## Error and fallback behavior

- A failed Next-optimized WebGL source uses the existing texture error lifecycle; no new retry surface is introduced.
- Unsupported or lost WebGL continues to use the flat DOM fallback, now rendered with Next Image for authored sources.
- Runtime uploads continue using direct `<img>` fallback behavior where a blob URL is required.
- Texture limits and the existing 24-source/96-draw bounds remain unchanged.

## Scope boundaries

No changes are made to:

- card mesh vertices or tessellation;
- lens equations, Bend X/Y, Width, Height, or Depth;
- CPU layout, culling, near plane, painter sorting, or draw budget;
- Pan, row phase, row speed, placement, protocol payloads, Apply, or Reset;
- Toolcraft controls.

## Verification design

Source coverage should record:

- authored URLs resolve through Next Image while blob sources remain direct;
- texture dimensions preserve aspect ratio, never exceed source dimensions, and do not round to a square power-of-two surface;
- the Sphere renderer does not generate mipmaps and uses linear filtering;
- centre-screen motion produces no velocity sampling displacement while viewport-edge motion still does;
- snapshot pixels contain no internal vertical seam and card perimeters remain free of one-pixel colour bands.

Per the user's standing instruction for this application, implementation will be handed over without running tests, browser checks, formatting, lint, typecheck, build, or diff-check commands.

## Risks

- Linear filtering without mipmaps can show more aliasing on extremely small, distant cards. The current effect blur and bounded gallery scale reduce that case; explicit LOD would require a larger WebGL2-oriented change and is intentionally excluded.
- Next Image optimization applies only to addressable authored URLs. Blob uploads cannot use it and therefore rely on the retained exact-size bitmap path.
- A one-texel coverage transition follows source resolution. Very low-resolution uploads will correctly expose their limited edge fidelity when enlarged.
