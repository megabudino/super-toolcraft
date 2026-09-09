import * as THREE from "three";

export type GrassHdrLightingProfile = Readonly<{
  ambientColor: readonly [number, number, number];
  ambientStrength: number;
  keyColor: readonly [number, number, number];
  keyDirection: readonly [number, number, number];
  keyStrength: number;
}>;

type GrassHdrImage = Readonly<{
  data: Uint16Array;
  height: number;
  lighting: GrassHdrLightingProfile;
  width: number;
}>;

export type GrassHdrEnvironment = Readonly<{
  lighting: GrassHdrLightingProfile;
  texture: THREE.DataTexture;
}>;

function readHdrLine(bytes: Uint8Array, cursor: { offset: number }): string {
  const start = cursor.offset;
  while (cursor.offset < bytes.length && bytes[cursor.offset] !== 10) {
    cursor.offset += 1;
  }
  if (cursor.offset >= bytes.length) {
    throw new Error("HDR header ended before the image dimensions.");
  }
  const line = new TextDecoder("ascii").decode(
    bytes.subarray(start, cursor.offset),
  );
  cursor.offset += 1;
  return line.replace(/\r$/u, "");
}

function decodeHdrPixels(
  bytes: Uint8Array,
  offset: number,
  width: number,
  height: number,
): Uint8Array {
  const pixelLength = width * height * 4;
  const first = bytes.subarray(offset, offset + 4);
  const usesScanlineRle =
    width >= 8 &&
    width <= 0x7fff &&
    first.length === 4 &&
    first[0] === 2 &&
    first[1] === 2 &&
    (first[2] & 0x80) === 0;

  if (!usesScanlineRle) {
    const flat = bytes.subarray(offset, offset + pixelLength);
    if (flat.length !== pixelLength) {
      throw new Error("HDR pixel payload is truncated.");
    }
    return new Uint8Array(flat);
  }

  const decoded = new Uint8Array(pixelLength);
  const scanline = new Uint8Array(width * 4);
  let sourceOffset = offset;
  let outputOffset = 0;

  for (let row = 0; row < height; row += 1) {
    if (sourceOffset + 4 > bytes.length) {
      throw new Error("HDR scanline header is truncated.");
    }
    const encodedWidth =
      (bytes[sourceOffset + 2] << 8) | bytes[sourceOffset + 3];
    if (
      bytes[sourceOffset] !== 2 ||
      bytes[sourceOffset + 1] !== 2 ||
      encodedWidth !== width
    ) {
      throw new Error("HDR scanline width does not match the header.");
    }
    sourceOffset += 4;

    let scanlineOffset = 0;
    while (scanlineOffset < scanline.length) {
      if (sourceOffset >= bytes.length) {
        throw new Error("HDR scanline data is truncated.");
      }
      let count = bytes[sourceOffset];
      sourceOffset += 1;
      const repeated = count > 128;
      if (repeated) count -= 128;
      if (count === 0 || scanlineOffset + count > scanline.length) {
        throw new Error("HDR scanline contains an invalid run.");
      }
      if (repeated) {
        if (sourceOffset >= bytes.length) {
          throw new Error("HDR repeated scanline value is missing.");
        }
        scanline.fill(
          bytes[sourceOffset],
          scanlineOffset,
          scanlineOffset + count,
        );
        sourceOffset += 1;
      } else {
        if (sourceOffset + count > bytes.length) {
          throw new Error("HDR literal scanline run is truncated.");
        }
        scanline.set(
          bytes.subarray(sourceOffset, sourceOffset + count),
          scanlineOffset,
        );
        sourceOffset += count;
      }
      scanlineOffset += count;
    }

    for (let column = 0; column < width; column += 1) {
      decoded[outputOffset] = scanline[column];
      decoded[outputOffset + 1] = scanline[column + width];
      decoded[outputOffset + 2] = scanline[column + width * 2];
      decoded[outputOffset + 3] = scanline[column + width * 3];
      outputOffset += 4;
    }
  }

  return decoded;
}

export function parseGrassHdr(buffer: ArrayBuffer): GrassHdrImage {
  const bytes = new Uint8Array(buffer);
  const cursor = { offset: 0 };
  const signature = readHdrLine(bytes, cursor);
  if (!signature.startsWith("#?")) {
    throw new Error("The selected file is not a Radiance HDR image.");
  }

  let formatFound = false;
  let width = 0;
  let height = 0;
  while (cursor.offset < bytes.length) {
    const line = readHdrLine(bytes, cursor);
    if (line === "FORMAT=32-bit_rle_rgbe") formatFound = true;
    const dimensions = /^\s*-Y\s+(\d+)\s+\+X\s+(\d+)\s*$/u.exec(line);
    if (dimensions) {
      height = Number(dimensions[1]);
      width = Number(dimensions[2]);
      break;
    }
  }
  if (!formatFound || width <= 0 || height <= 0) {
    throw new Error("The HDR header is missing RGBE format or dimensions.");
  }

  const rgbe = decodeHdrPixels(bytes, cursor.offset, width, height);
  const data = new Uint16Array(rgbe.length);
  let ambientRed = 0;
  let ambientGreen = 0;
  let ambientBlue = 0;
  let brightestIndex = 0;
  let brightestLuminance = 0;
  let brightestRed = 1;
  let brightestGreen = 1;
  let brightestBlue = 1;
  for (let index = 0; index < rgbe.length; index += 4) {
    const scale = 2 ** (rgbe[index + 3] - 128) / 255;
    const red = Math.min(rgbe[index] * scale, 65_504);
    const green = Math.min(rgbe[index + 1] * scale, 65_504);
    const blue = Math.min(rgbe[index + 2] * scale, 65_504);
    data[index] = THREE.DataUtils.toHalfFloat(red);
    data[index + 1] = THREE.DataUtils.toHalfFloat(green);
    data[index + 2] = THREE.DataUtils.toHalfFloat(blue);
    data[index + 3] = THREE.DataUtils.toHalfFloat(1);
    ambientRed += Math.log1p(red);
    ambientGreen += Math.log1p(green);
    ambientBlue += Math.log1p(blue);
    const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
    if (luminance > brightestLuminance) {
      brightestIndex = index / 4;
      brightestLuminance = luminance;
      brightestRed = red;
      brightestGreen = green;
      brightestBlue = blue;
    }
  }

  const pixelCount = Math.max(1, width * height);
  const averageLog = [
    ambientRed / pixelCount,
    ambientGreen / pixelCount,
    ambientBlue / pixelCount,
  ] as const;
  const averageMaximum = Math.max(...averageLog, 0.0001);
  const ambientColor = averageLog.map((channel) =>
    THREE.MathUtils.clamp(0.28 + (channel / averageMaximum) * 0.72, 0, 1),
  ) as [number, number, number];
  const averageLuminance = Math.max(
    0.0001,
    Math.expm1(
      averageLog[0] * 0.2126 +
        averageLog[1] * 0.7152 +
        averageLog[2] * 0.0722,
    ),
  );
  const keyMaximum = Math.max(
    brightestRed,
    brightestGreen,
    brightestBlue,
    0.0001,
  );
  const keyColor = [brightestRed, brightestGreen, brightestBlue].map(
    (channel) =>
      THREE.MathUtils.clamp(0.18 + (channel / keyMaximum) * 0.82, 0, 1),
  ) as [number, number, number];
  const keyX = brightestIndex % width;
  const keyY = Math.floor(brightestIndex / width);
  const longitude = ((keyX + 0.5) / width) * Math.PI * 2 - Math.PI;
  const latitude = ((keyY + 0.5) / height) * Math.PI;
  const keyDirection = [
    Math.sin(latitude) * Math.sin(longitude),
    Math.cos(latitude),
    Math.sin(latitude) * Math.cos(longitude),
  ] as const;
  const dynamicRange = brightestLuminance / averageLuminance;
  const lighting: GrassHdrLightingProfile = {
    ambientColor,
    ambientStrength: THREE.MathUtils.clamp(
      0.62 + Math.log2(1 + averageLuminance) * 0.2,
      0.62,
      1.5,
    ),
    keyColor,
    keyDirection,
    keyStrength: THREE.MathUtils.clamp(
      0.72 + Math.log2(1 + dynamicRange) * 0.16,
      0.72,
      2.8,
    ),
  };
  return { data, height, lighting, width };
}

function createGrassHdrTexture(image: GrassHdrImage): THREE.DataTexture {
  const texture = new THREE.DataTexture(
    image.data,
    image.width,
    image.height,
    THREE.RGBAFormat,
    THREE.HalfFloatType,
  );
  texture.colorSpace = THREE.LinearSRGBColorSpace;
  texture.flipY = true;
  texture.generateMipmaps = false;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export async function loadGrassHdrEnvironment(
  url: string,
): Promise<GrassHdrEnvironment> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HDR source could not be loaded (${response.status}).`);
  }
  const image = parseGrassHdr(await response.arrayBuffer());
  return { lighting: image.lighting, texture: createGrassHdrTexture(image) };
}

export async function loadGrassHdrTexture(
  url: string,
): Promise<THREE.DataTexture> {
  return (await loadGrassHdrEnvironment(url)).texture;
}
