import logoSvgSources from "./assets/logo-svg-sources.json" with { type: "json" };

export const logoSphereAtlasColumns = 6;
export const logoSphereAtlasCellSize = 256;
export const logoSphereDefaultLogoCount = logoSvgSources.length;
export const logoSphereDefaultAtlasId = "logo-sphere-default-atlas";

// Each supplied SVG is an 82×82 canvas whose white card is an 80×80 rect at
// (0.953, 0) carrying its own authored drop shadow below and 0.5px inner edge
// bevels. Cropping to the clean card interior keeps that baked styling (and
// atlas-edge sampling bleed) out of the projected cards.
export const logoSphereAuthoredCanvasSize = 82;
export const logoSphereAuthoredCardCrop = {
  size: 77,
  x: 2.45,
  y: 1.5,
} as const;

const logoSphereAtlasRows = Math.ceil(
  logoSphereDefaultLogoCount / logoSphereAtlasColumns,
);

function createNamespacedSvgBody(source: string, index: number): string {
  let body = source
    .replace(/^\s*<svg\b[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "");
  const identifiers = Array.from(
    body.matchAll(/\bid="([^"]+)"/g),
    (match) => match[1],
  );

  identifiers.forEach((identifier) => {
    const namespaced = `logo-${index + 1}-${identifier}`;
    body = body
      .replaceAll(`id="${identifier}"`, `id="${namespaced}"`)
      .replaceAll(`url(#${identifier})`, `url(#${namespaced})`)
      .replaceAll(`href="#${identifier}"`, `href="#${namespaced}"`)
      .replaceAll(`xlink:href="#${identifier}"`, `xlink:href="#${namespaced}"`);
  });

  return body;
}

const logoSphereAtlasSvg = [
  `<svg xmlns="http://www.w3.org/2000/svg" width="${
    logoSphereAtlasColumns * logoSphereAtlasCellSize
  }" height="${logoSphereAtlasRows * logoSphereAtlasCellSize}" viewBox="0 0 ${
    logoSphereAtlasColumns * logoSphereAtlasCellSize
  } ${logoSphereAtlasRows * logoSphereAtlasCellSize}">`,
  ...logoSvgSources.map((source, index) => {
    const x = (index % logoSphereAtlasColumns) * logoSphereAtlasCellSize;
    const y = Math.floor(index / logoSphereAtlasColumns) * logoSphereAtlasCellSize;

    return `<svg x="${x}" y="${y}" width="${logoSphereAtlasCellSize}" height="${logoSphereAtlasCellSize}" viewBox="0 0 82 82" preserveAspectRatio="xMidYMid meet">${createNamespacedSvgBody(
      source,
      index,
    )}</svg>`;
  }),
  "</svg>",
].join("");

function encodeSvgDataUrl(source: string): string {
  const bytes = new TextEncoder().encode(source);
  let binary = "";

  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }

  return `data:image/svg+xml;base64,${btoa(binary)}`;
}

export const logoSphereDefaultAssets = [
  {
    assetKind: "file",
    dataUrl: encodeSvgDataUrl(logoSphereAtlasSvg),
    fileName: "supplied-svg-logo-set.svg",
    id: logoSphereDefaultAtlasId,
    layerName: "Supplied logo set",
    mimeType: "image/svg+xml",
    sourceTarget: "logos.defaults",
  },
] as const;
