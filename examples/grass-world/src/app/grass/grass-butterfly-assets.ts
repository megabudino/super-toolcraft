import * as THREE from "three";

export const grassButterflyTextureSizes = {
  baseColor: 512,
  normal: 256,
  opacity: 1024,
  roughness: 256,
} as const;

export const grassButterflyAssetUrls = {
  baseColor: new URL(
    "./assets/butterflies/butterflies-basecolor.webp",
    import.meta.url,
  ).href,
  normal: new URL(
    "./assets/butterflies/butterflies-normal.webp",
    import.meta.url,
  ).href,
  opacity: new URL(
    "./assets/butterflies/butterflies-opacity.webp",
    import.meta.url,
  ).href,
  roughness: new URL(
    "./assets/butterflies/butterflies-roughness.webp",
    import.meta.url,
  ).href,
} as const;

export type GrassButterflyTextures = Readonly<{
  baseColor: THREE.Texture;
  normal: THREE.Texture;
  opacity: THREE.Texture;
  roughness: THREE.Texture;
}>;

let sharedButterflyTextures: Promise<GrassButterflyTextures> | null = null;

function configureTexture(
  texture: THREE.Texture,
  colorSpace: THREE.ColorSpace,
): THREE.Texture {
  texture.anisotropy = 4;
  texture.colorSpace = colorSpace;
  texture.flipY = false;
  texture.needsUpdate = true;
  return texture;
}

export function loadGrassButterflyTextures(
  loader: THREE.TextureLoader,
): Promise<GrassButterflyTextures> {
  sharedButterflyTextures ??= Promise.all([
    loader.loadAsync(grassButterflyAssetUrls.baseColor),
    loader.loadAsync(grassButterflyAssetUrls.normal),
    loader.loadAsync(grassButterflyAssetUrls.opacity),
    loader.loadAsync(grassButterflyAssetUrls.roughness),
  ]).then(([baseColor, normal, opacity, roughness]) => ({
    baseColor: configureTexture(baseColor, THREE.SRGBColorSpace),
    normal: configureTexture(normal, THREE.NoColorSpace),
    opacity: configureTexture(opacity, THREE.NoColorSpace),
    roughness: configureTexture(roughness, THREE.NoColorSpace),
  }));
  return sharedButterflyTextures;
}

export function cloneGrassButterflyTextures(
  textures: GrassButterflyTextures,
): GrassButterflyTextures {
  const clone = (texture: THREE.Texture): THREE.Texture => {
    const copy = texture.clone();
    copy.needsUpdate = true;
    return copy;
  };
  return {
    baseColor: clone(textures.baseColor),
    normal: clone(textures.normal),
    opacity: clone(textures.opacity),
    roughness: clone(textures.roughness),
  };
}
