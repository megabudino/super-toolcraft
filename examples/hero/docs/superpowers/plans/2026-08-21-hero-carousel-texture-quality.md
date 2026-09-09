# Hero Carousel Texture Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove motion-time vertical seams and card-edge sampling bands while preserving the current gallery geometry and routing authored images through Next Image.

**Architecture:** Keep the existing CPU layout, mesh, homogeneous projection, clipping, pan, and controls unchanged. Separate source delivery from texture upload: authored sources expose a Next Image optimizer URL for WebGL and their original URL for `<Image>`, while blob uploads remain direct. Upload aspect-preserving NPOT textures without mipmaps, then make the shared fragment shader texel-aware and restrict velocity displacement to the existing viewport-edge envelope.

**Tech Stack:** Next.js 16.3 `next/image` and `getImageProps`, React 19, TypeScript, WebGL1/GLSL ES 1.00.

---

## File map

- `recraft-v4-styles/src/components/pages/home/hero-gallery-sources.ts`: distinguish visible source URLs from Next-optimized WebGL URLs.
- `recraft-v4-styles/src/components/pages/home/hero-sphere-gallery.tsx`: render the authored flat fallback with Next `<Image>`.
- `recraft-v4-styles/src/components/pages/home/hero-gallery-media-store.ts`: retain uploaded ImageBitmaps at aspect-preserving, non-upscaled dimensions.
- `recraft-v4-styles/src/components/pages/home/hero-sphere-gallery-webgl.ts`: prepare exact NPOT textures, remove mipmaps, and supply texture dimensions to the shared shader.
- `recraft-v4-styles/src/components/pages/home/hero-card-dispersion-webgl.ts`: add texel-aware perimeter coverage and edge-gated motion sampling for both Rows and Sphere.
- `recraft-tools/hero/docs/toolcraft/agent-worklog.md`: record the correction, unchanged geometry, and intentionally skipped verification.

### Task 1: Route authored sources through Next Image

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/hero-gallery-sources.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-sphere-gallery.tsx`

- [x] **Step 1: Add a separate optimized texture URL**

Import `getImageProps` and extend the source contract without changing `url`, `key`, or geometry metadata:

```ts
import { getImageProps } from 'next/image';

export interface HeroGalleryImageSource {
  bitmap?: ImageBitmap;
  height: number;
  id: string;
  key: string;
  ready: boolean;
  transform: HeroGalleryImageTransform;
  textureUrl?: string;
  url: string;
  width: number;
}

function getAuthoredTextureUrl(url: string, width: number, height: number) {
  return getImageProps({
    alt: '',
    height,
    quality: 95,
    src: url,
    width,
  }).props.src;
}
```

For every authored portrait, retain the original `url` for React rendering and set:

```ts
textureUrl: getAuthoredTextureUrl(url, 1080, 1389),
```

Do not add `textureUrl` to blob-backed runtime sources.

- [x] **Step 2: Make the WebGL loader consume the optimized URL**

In `loadSourceImage`, keep bitmap precedence and use:

```ts
image.src = source.textureUrl ?? source.url;
```

The stable texture key remains `source.key`; changing request URL must not reset card identity.

- [x] **Step 3: Replace only the authored Sphere fallback `<img>`**

Import `Image` from `next/image`. For sources whose original URL starts with `/`, render:

```tsx
<Image
  alt=""
  className="object-cover"
  height={Math.max(1, Math.round(settings.gallery.cardHeight))}
  key={source.key}
  quality={95}
  sizes={`${Math.max(1, Math.round(settings.gallery.cardHeight * getHeroGallerySourceAspect(source)))}px`}
  src={source.url}
  style={{
    height: settings.gallery.cardHeight,
    width: settings.gallery.cardHeight * getHeroGallerySourceAspect(source),
  }}
  width={Math.max(1, Math.round(settings.gallery.cardHeight * getHeroGallerySourceAspect(source)))}
/>
```

Keep the existing direct `<img>` branch for blob/object URLs. Do not change row positions, gaps, card aspect calculation, or fallback visibility.

### Task 2: Preserve source aspect and remove mipmap LOD seams

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/hero-gallery-media-store.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-sphere-gallery-webgl.ts`

- [x] **Step 1: Stop resizing uploaded bitmaps to independent powers of two**

Delete `nextPowerOfTwo`. In `decodeEntry`, preserve one scale for both axes:

```ts
const scale = Math.min(1, 2048 / Math.max(original.width, original.height));
const resizeWidth = Math.max(1, Math.round(original.width * scale));
const resizeHeight = Math.max(1, Math.round(original.height * scale));

if (resizeWidth === original.width && resizeHeight === original.height) {
  entry.bitmap = original;
} else {
  entry.bitmap = await createImageBitmap(entry.blob, {
    resizeHeight,
    resizeQuality: 'high',
    resizeWidth,
  });
  original.close();
}
```

Keep `entry.width` and `entry.height` as the original dimensions so existing card geometry does not change.

- [x] **Step 2: Prepare exact NPOT Sphere textures**

Delete `nextPowerOfTwo` from `hero-sphere-gallery-webgl.ts`. Resolve decoded dimensions from the actual `HTMLImageElement` or `ImageBitmap`, rotate the dimensions when needed, and set:

```ts
const scale = Math.min(1, 2048 / Math.max(sourceWidth, sourceHeight));
canvas.width = Math.max(1, Math.round(sourceWidth * scale));
canvas.height = Math.max(1, Math.round(sourceHeight * scale));
```

Return the prepared canvas together with its width and height, and extend `TextureEntry`:

```ts
interface TextureEntry {
  height: number;
  status: 'loading' | 'ready' | 'error';
  texture: WebGLTexture;
  width: number;
}
```

Initialize loading entries with `width: 1` and `height: 1`, then replace both values after preparation.

- [x] **Step 3: Remove mipmap generation and implicit LOD selection**

After `texImage2D`, remove `generateMipmap` and configure the exact NPOT texture as:

```ts
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
```

This is valid in WebGL1 for NPOT textures and matches the existing stable Rows filter mode.

### Task 3: Make shared image sampling texel-aware and motion edge-local

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/hero-card-dispersion-webgl.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-sphere-gallery-webgl.ts`

- [x] **Step 1: Add texture dimensions to the shared fragment shader**

Declare:

```glsl
uniform vec2 uTextureSize;
```

Replace the hard UV cutoff in `sampleCard` with a one-texel guard:

```glsl
vec4 sampleCard(vec2 point) {
  vec2 local = point - uCardOrigin;
  vec2 uv = local / uCardSize;
  vec2 texel = 1.0 / max(uTextureSize, vec2(1.0));
  vec2 lower = smoothstep(-texel, texel, uv);
  vec2 upper = 1.0 - smoothstep(vec2(1.0) - texel, vec2(1.0) + texel, uv);
  float coverage = lower.x * lower.y * upper.x * upper.y;
  if (coverage <= 0.0001) return vec4(0.0);
  vec2 sampleUv = clamp(uv, texel * 0.5, vec2(1.0) - texel * 0.5);
  vec4 texelColor = texture2D(uImage, sampleUv);
  return vec4(texelColor.rgb * texelColor.a, texelColor.a) * coverage;
}
```

Samples more than one source texel outside the card remain transparent, so the authored dispersion halo is preserved.

- [x] **Step 2: Restrict projected velocity to the existing edge envelope**

Immediately after calculating `edge`, add:

```glsl
float motionVelocity = uVelocity * edge;
```

Replace every motion sampling use of `uVelocity` with `motionVelocity`: turbulence drift, `extent`, main spectral offset, aura offset, and gate `motionKick`. Do not change `span`, amount, blur, spectrum, aura, warp, or fade equations.

- [x] **Step 3: Supply texture size in the Rows renderer**

Add a `getTexImageSourceSize` helper that checks decoded dimensions in priority order and falls back to `1`:

```ts
function getTexImageSourceSize(image: TexImageSource) {
  const dimensions = image as TexImageSource & {
    displayHeight?: number;
    displayWidth?: number;
    height?: number;
    naturalHeight?: number;
    naturalWidth?: number;
    videoHeight?: number;
    videoWidth?: number;
    width?: number;
  };
  const width =
    dimensions.naturalWidth ??
    dimensions.videoWidth ??
    dimensions.displayWidth ??
    dimensions.width ??
    1;
  const height =
    dimensions.naturalHeight ??
    dimensions.videoHeight ??
    dimensions.displayHeight ??
    dimensions.height ??
    1;
  return {
    height: Number.isFinite(height) ? Math.max(1, height) : 1,
    width: Number.isFinite(width) ? Math.max(1, width) : 1,
  };
}
```

Add `textureSize: location('uTextureSize')` and set it during Rows draws:

```ts
const textureSize = getTexImageSourceSize(image);
gl.uniform2f(locations.textureSize, textureSize.width, textureSize.height);
```

- [x] **Step 4: Supply the active Sphere texture size per card**

Add `textureSize: location('uTextureSize')`. Before each Sphere draw, after binding `texture.texture`, set:

```ts
gl.uniform2f(locations.textureSize, texture.width, texture.height);
```

No vertex shader, mesh, layout, lens, culling, phase, or painter-order code changes in this task.

### Task 4: Record the correction and hand it over

**Files:**
- Modify: `recraft-tools/hero/docs/toolcraft/agent-worklog.md`

- [x] **Step 1: Add Delivery 23**

Record `Delivery 23 — Stable Next Image textures and clean card sampling` with:

- the two supplied screenshots as visual defect evidence;
- root cause: POT aspect distortion, triangle-local mip LOD changes, unconditional velocity displacement, and hard UV coverage;
- decision: Next Image for authored sources, direct blobs, exact NPOT linear textures, no mipmaps, one-texel coverage, edge-gated motion;
- explicit unchanged geometry/lens/clipping/pan/protocol/controls;
- ordinary-product-work performance intent and the retained 2048/24-source/96-draw bounds;
- the user's standing no-verification instruction.

Update current Renderer, Performance, Verification, and Risks summaries without rewriting historical deliveries.

- [x] **Step 2: Perform source-only review**

Confirm by reading changed sources that:

- `generateMipmap` and `LINEAR_MIPMAP_LINEAR` are absent from the Sphere renderer;
- `nextPowerOfTwo` is absent from gallery media and Sphere texture preparation;
- authored sources retain original `url` and add `textureUrl`;
- both WebGL renderers supply `uTextureSize`;
- `motionVelocity` replaces velocity displacement uses in the fragment shader;
- no diff touches `hero-sphere-layout.ts`, mesh creation, lens uniforms, or protocol files.

- [x] **Step 3: Document intentionally skipped commands**

The normal focused commands would be:

```bash
pnpm exec oxfmt src/components/pages/home/hero-gallery-sources.ts src/components/pages/home/hero-sphere-gallery.tsx src/components/pages/home/hero-gallery-media-store.ts src/components/pages/home/hero-sphere-gallery-webgl.ts src/components/pages/home/hero-card-dispersion-webgl.ts
pnpm lint
pnpm typecheck
pnpm build
git diff --check
```

Do not execute them in this delivery. The user explicitly requested implementation followed by manual local evaluation without checks. Do not commit or push without a separate request.
