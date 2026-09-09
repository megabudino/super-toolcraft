import {
  BufferAttribute,
  BufferGeometry,
  DataTexture,
  EquirectangularReflectionMapping,
  FloatType,
  Group,
  LinearFilter,
  LinearSRGBColorSpace,
  Mesh,
  MeshBasicMaterial,
  RGBAFormat,
  SRGBColorSpace,
  Texture,
} from "three";

import { DONUT_ASSETS } from "./donut-reference";
import type { DonutFoodTextures } from "./donut-food-shader";

const MAGIC = "DNT1";

function readText(
  view: DataView,
  offset: number,
  length: number,
): string {
  return new TextDecoder().decode(
    new Uint8Array(view.buffer, view.byteOffset + offset, length),
  );
}

function align4(offset: number): number {
  return (offset + 3) & ~3;
}

export function parseDonutReferenceGeometry(buffer: ArrayBuffer): Group {
  const view = new DataView(buffer);
  if (view.byteLength < 8 || readText(view, 0, 4) !== MAGIC) {
    throw new Error("Invalid Donut Studio geometry asset.");
  }
  let offset = 4;
  const meshCount = view.getUint32(offset, true);
  offset += 4;
  if (meshCount !== 2) {
    throw new Error(`Donut Studio requires 2 authored meshes, received ${meshCount}.`);
  }

  const root = new Group();
  root.name = "Donut.Reference";
  for (let meshIndex = 0; meshIndex < meshCount; meshIndex += 1) {
    const nameLength = view.getUint32(offset, true);
    offset += 4;
    const name = readText(view, offset, nameLength);
    offset = align4(offset + nameLength);
    const vertexCount = view.getUint32(offset, true);
    const indexCount = view.getUint32(offset + 4, true);
    offset += 8;
    if (vertexCount <= 0 || indexCount <= 0 || indexCount % 3 !== 0) {
      throw new Error(`Donut mesh ${name} has invalid geometry counts.`);
    }

    const positionBytes = vertexCount * 3 * Float32Array.BYTES_PER_ELEMENT;
    const normalBytes = positionBytes;
    const indexBytes = indexCount * Uint32Array.BYTES_PER_ELEMENT;
    if (offset + positionBytes + normalBytes + indexBytes > view.byteLength) {
      throw new Error(`Donut mesh ${name} exceeds the geometry asset bounds.`);
    }
    const positions = new Float32Array(buffer, offset, vertexCount * 3);
    offset += positionBytes;
    const normals = new Float32Array(buffer, offset, vertexCount * 3);
    offset += normalBytes;
    const indices = new Uint32Array(buffer, offset, indexCount);
    offset += indexBytes;

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new BufferAttribute(normals, 3));
    geometry.setIndex(new BufferAttribute(indices, 1));
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    const mesh = new Mesh(geometry, new MeshBasicMaterial());
    mesh.name = name;
    root.add(mesh);
  }
  if (offset !== view.byteLength) {
    throw new Error("Donut Studio geometry asset has trailing bytes.");
  }
  return root;
}

function writeRgbePixel(
  target: Float32Array,
  at: number,
  r: number,
  g: number,
  b: number,
  e: number,
): void {
  const scale = e === 0 ? 0 : 2 ** (e - 136);
  target[at] = r * scale;
  target[at + 1] = g * scale;
  target[at + 2] = b * scale;
  target[at + 3] = 1;
}

export function parseRadianceHdr(buffer: ArrayBuffer): Readonly<{
  data: Float32Array;
  height: number;
  width: number;
}> {
  const bytes = new Uint8Array(buffer);
  let offset = 0;
  const readLine = (): string => {
    let line = "";
    while (offset < bytes.length) {
      const code = bytes[offset];
      offset += 1;
      if (code === 10) break;
      line += String.fromCharCode(code ?? 0);
    }
    return line;
  };

  if (!readLine().startsWith("#?")) {
    throw new Error("Donut Studio environment is not a Radiance HDR asset.");
  }
  let formatSupported = false;
  for (let line = readLine(); line !== ""; line = readLine()) {
    if (line.startsWith("FORMAT=")) {
      formatSupported = line.includes("32-bit_rle_rgbe");
    }
  }
  const dimensions = /^-Y (\d+) \+X (\d+)$/.exec(readLine());
  if (!formatSupported || !dimensions) {
    throw new Error("Donut Studio environment must be 32-bit RLE RGBE.");
  }
  const height = Number(dimensions[1]);
  const width = Number(dimensions[2]);
  const data = new Float32Array(width * height * 4);
  const planar = new Uint8Array(width * 4);

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * width * 4;
    const newRle =
      width >= 8 &&
      width < 32_768 &&
      bytes[offset] === 2 &&
      bytes[offset + 1] === 2 &&
      ((bytes[offset + 2] ?? 0) << 8 | (bytes[offset + 3] ?? 0)) === width;
    if (newRle) {
      offset += 4;
      for (let channel = 0; channel < 4; channel += 1) {
        let x = 0;
        while (x < width) {
          const count = bytes[offset] ?? 0;
          offset += 1;
          if (offset >= bytes.length) {
            throw new Error("Donut Studio environment scanline is truncated.");
          }
          if (count > 128) {
            const value = bytes[offset] ?? 0;
            offset += 1;
            for (let run = 0; run < count - 128; run += 1) {
              planar[channel * width + x] = value;
              x += 1;
            }
          } else {
            for (let run = 0; run < count; run += 1) {
              planar[channel * width + x] = bytes[offset] ?? 0;
              offset += 1;
              x += 1;
            }
          }
        }
      }
      for (let x = 0; x < width; x += 1) {
        writeRgbePixel(
          data,
          rowStart + x * 4,
          planar[x] ?? 0,
          planar[width + x] ?? 0,
          planar[2 * width + x] ?? 0,
          planar[3 * width + x] ?? 0,
        );
      }
    } else {
      for (let x = 0; x < width; x += 1) {
        writeRgbePixel(
          data,
          rowStart + x * 4,
          bytes[offset] ?? 0,
          bytes[offset + 1] ?? 0,
          bytes[offset + 2] ?? 0,
          bytes[offset + 3] ?? 0,
        );
        offset += 4;
      }
    }
  }
  return { data, height, width };
}

async function loadEnvironmentTexture(url: string): Promise<Texture> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Donut environment request failed with status ${response.status}.`,
    );
  }
  const { data, height, width } = parseRadianceHdr(await response.arrayBuffer());
  const texture = new DataTexture(data, width, height, RGBAFormat, FloatType);
  texture.name = "brown_photostudio_02";
  texture.colorSpace = LinearSRGBColorSpace;
  texture.mapping = EquirectangularReflectionMapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.flipY = true;
  texture.needsUpdate = true;
  return texture;
}

async function loadMaterialTexture(
  url: string,
  name: string,
  colorSpace?: Texture["colorSpace"],
): Promise<Texture> {
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  await image.decode();
  const texture = new Texture(image);
  texture.name = name;
  if (colorSpace) texture.colorSpace = colorSpace;
  texture.needsUpdate = true;
  return texture;
}

export async function loadDonutReferenceAssets(): Promise<
  Readonly<{
    environment: Texture;
    foodTextures: DonutFoodTextures;
    root: Group;
  }>
> {
  const [response, environment, baseColor, normal, roughness] =
    await Promise.all([
      fetch(DONUT_ASSETS.geometry),
      loadEnvironmentTexture(DONUT_ASSETS.environment),
      loadMaterialTexture(
        DONUT_ASSETS.materialBaseColor,
        "Megascans.Donut.BaseColor",
        SRGBColorSpace,
      ),
      loadMaterialTexture(
        DONUT_ASSETS.materialNormal,
        "Megascans.Donut.Normal",
      ),
      loadMaterialTexture(
        DONUT_ASSETS.materialRoughness,
        "Megascans.Donut.Roughness",
      ),
    ]);
  const foodTextures = Object.freeze({ baseColor, normal, roughness });
  if (!response.ok) {
    environment.dispose();
    for (const texture of Object.values(foodTextures)) texture.dispose();
    throw new Error(
      `Donut geometry request failed with status ${response.status}.`,
    );
  }
  try {
    return {
      environment,
      foodTextures,
      root: parseDonutReferenceGeometry(await response.arrayBuffer()),
    };
  } catch (error) {
    environment.dispose();
    for (const texture of Object.values(foodTextures)) texture.dispose();
    throw error;
  }
}
