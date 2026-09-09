import type { GrassScanLayerKind } from "./grass-scan-contract";

export type GrassScanTextureSet = Readonly<{
  ao: string;
  baseColor: string;
  normal: string;
  opacity?: string;
  roughness: string;
}>;

export type GrassScanAssetFamily = Readonly<{
  textures: GrassScanTextureSet;
  variants: readonly string[];
}>;

export const grassBoulderScanAsset = {
  geometry: new URL("./assets/scans/boulder/boulder.meshbin", import.meta.url)
    .href,
  textures: {
    ao: new URL("./assets/scans/boulder/boulder-ao.webp", import.meta.url).href,
    baseColor: new URL(
      "./assets/scans/boulder/boulder-basecolor.webp",
      import.meta.url,
    ).href,
    normal: new URL(
      "./assets/scans/boulder/boulder-normal.webp",
      import.meta.url,
    ).href,
    roughness: new URL(
      "./assets/scans/boulder/boulder-roughness.webp",
      import.meta.url,
    ).href,
  },
} as const satisfies Readonly<{
  geometry: string;
  textures: GrassScanTextureSet;
}>;

export const grassGroundScanTextures = {
  ao: new URL("./assets/scans/ground/ground-ao.webp", import.meta.url).href,
  baseColor: new URL(
    "./assets/scans/ground/ground-basecolor.webp",
    import.meta.url,
  ).href,
  normal: new URL("./assets/scans/ground/ground-normal.webp", import.meta.url)
    .href,
  roughness: new URL(
    "./assets/scans/ground/ground-roughness.webp",
    import.meta.url,
  ).href,
} as const satisfies GrassScanTextureSet;

export const grassCloverGroundTextures = {
  ao: new URL("./assets/scans/clover/clover-ao.webp", import.meta.url).href,
  baseColor: new URL(
    "./assets/scans/clover/clover-basecolor.webp",
    import.meta.url,
  ).href,
  normal: new URL("./assets/scans/clover/clover-normal.webp", import.meta.url)
    .href,
  roughness: new URL(
    "./assets/scans/clover/clover-roughness.webp",
    import.meta.url,
  ).href,
} as const satisfies GrassScanTextureSet;

export const grassScanAssetFamilies = {
  rocks: {
    textures: {
      ao: new URL("./assets/scans/rocks/rocks-ao.webp", import.meta.url).href,
      baseColor: new URL(
        "./assets/scans/rocks/rocks-basecolor.webp",
        import.meta.url,
      ).href,
      normal: new URL("./assets/scans/rocks/rocks-normal.webp", import.meta.url)
        .href,
      roughness: new URL(
        "./assets/scans/rocks/rocks-roughness.webp",
        import.meta.url,
      ).href,
    },
    variants: [
      new URL("./assets/scans/rocks/rocks-01.meshbin", import.meta.url).href,
      new URL("./assets/scans/rocks/rocks-02.meshbin", import.meta.url).href,
      new URL("./assets/scans/rocks/rocks-03.meshbin", import.meta.url).href,
      new URL("./assets/scans/rocks/rocks-04.meshbin", import.meta.url).href,
      new URL("./assets/scans/rocks/rocks-05.meshbin", import.meta.url).href,
    ],
  },
  tufted: {
    textures: {
      ao: new URL("./assets/scans/tufted/tufted-ao.webp", import.meta.url).href,
      baseColor: new URL(
        "./assets/scans/tufted/tufted-basecolor.webp",
        import.meta.url,
      ).href,
      normal: new URL(
        "./assets/scans/tufted/tufted-normal.webp",
        import.meta.url,
      ).href,
      opacity: new URL(
        "./assets/scans/tufted/tufted-opacity.webp",
        import.meta.url,
      ).href,
      roughness: new URL(
        "./assets/scans/tufted/tufted-roughness.webp",
        import.meta.url,
      ).href,
    },
    variants: [
      new URL("./assets/scans/tufted/tufted-a.meshbin", import.meta.url).href,
      new URL("./assets/scans/tufted/tufted-c.meshbin", import.meta.url).href,
      new URL("./assets/scans/tufted/tufted-e.meshbin", import.meta.url).href,
    ],
  },
  white: {
    textures: {
      ao: new URL("./assets/scans/white/white-ao.webp", import.meta.url).href,
      baseColor: new URL(
        "./assets/scans/white/white-basecolor.webp",
        import.meta.url,
      ).href,
      normal: new URL("./assets/scans/white/white-normal.webp", import.meta.url)
        .href,
      opacity: new URL(
        "./assets/scans/white/white-opacity.webp",
        import.meta.url,
      ).href,
      roughness: new URL(
        "./assets/scans/white/white-roughness.webp",
        import.meta.url,
      ).href,
    },
    variants: [
      new URL("./assets/scans/white/white-a.meshbin", import.meta.url).href,
      new URL("./assets/scans/white/white-c.meshbin", import.meta.url).href,
      new URL("./assets/scans/white/white-f.meshbin", import.meta.url).href,
      new URL("./assets/scans/white/white-h.meshbin", import.meta.url).href,
    ],
  },
  wild: {
    textures: {
      ao: new URL("./assets/scans/wild/wild-ao.webp", import.meta.url).href,
      baseColor: new URL(
        "./assets/scans/wild/wild-basecolor.webp",
        import.meta.url,
      ).href,
      normal: new URL("./assets/scans/wild/wild-normal.webp", import.meta.url)
        .href,
      opacity: new URL("./assets/scans/wild/wild-opacity.webp", import.meta.url)
        .href,
      roughness: new URL(
        "./assets/scans/wild/wild-roughness.webp",
        import.meta.url,
      ).href,
    },
    variants: [
      new URL("./assets/scans/wild/wild-a.meshbin", import.meta.url).href,
      new URL("./assets/scans/wild/wild-d.meshbin", import.meta.url).href,
      new URL("./assets/scans/wild/wild-g.meshbin", import.meta.url).href,
    ],
  },
  yellow: {
    textures: {
      ao: new URL("./assets/scans/yellow/yellow-ao.webp", import.meta.url).href,
      baseColor: new URL(
        "./assets/scans/yellow/yellow-basecolor.webp",
        import.meta.url,
      ).href,
      normal: new URL(
        "./assets/scans/yellow/yellow-normal.webp",
        import.meta.url,
      ).href,
      opacity: new URL(
        "./assets/scans/yellow/yellow-opacity.webp",
        import.meta.url,
      ).href,
      roughness: new URL(
        "./assets/scans/yellow/yellow-roughness.webp",
        import.meta.url,
      ).href,
    },
    variants: [
      new URL("./assets/scans/yellow/yellow-a.meshbin", import.meta.url).href,
      new URL("./assets/scans/yellow/yellow-c.meshbin", import.meta.url).href,
      new URL("./assets/scans/yellow/yellow-f.meshbin", import.meta.url).href,
      new URL("./assets/scans/yellow/yellow-h.meshbin", import.meta.url).href,
    ],
  },
} as const satisfies Record<GrassScanLayerKind, GrassScanAssetFamily>;
