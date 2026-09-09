import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const sourceRoot = resolve(process.argv[2] ?? "");
if (!sourceRoot) {
  throw new Error(
    "Usage: node scripts/process-grass-scans.mjs /absolute/path/to/scans",
  );
}

const outputRoot = resolve("src/app/grass/assets/scans");
const workRoot = mkdtempSync(join(tmpdir(), "grass-scans-"));

class NodeFileReader {
  result = null;
  error = null;
  onload = null;
  onloadend = null;
  onerror = null;

  async readAsArrayBuffer(blob) {
    try {
      this.result = await blob.arrayBuffer();
      this.onload?.({ target: this });
      this.onloadend?.({ target: this });
    } catch (error) {
      this.error = error;
      this.onerror?.({ target: this });
      this.onloadend?.({ target: this });
    }
  }

  async readAsDataURL(blob) {
    try {
      const bytes = Buffer.from(await blob.arrayBuffer());
      this.result = `data:${blob.type || "application/octet-stream"};base64,${bytes.toString("base64")}`;
      this.onload?.({ target: this });
      this.onloadend?.({ target: this });
    } catch (error) {
      this.error = error;
      this.onerror?.({ target: this });
      this.onloadend?.({ target: this });
    }
  }
}

globalThis.FileReader = NodeFileReader;

THREE.TextureLoader.prototype.load = function loadTextureWithoutDom(
  _url,
  onLoad,
) {
  const texture = new THREE.Texture();
  queueMicrotask(() => onLoad?.(texture));
  return texture;
};

const plantFamilies = [
  {
    archive: "Tufted Grass.zip",
    atlasPrefix: "Tufted_Grass_tdcnfcdr_High_4K",
    filePrefix: "Tufted_Grass_tdcnfcdr_High_tdcnfcdr",
    id: "tufted",
    lod: "LOD2",
    variants: ["A", "C", "E"],
  },
  {
    archive: "Wild Grass.zip",
    atlasPrefix: "Wild_Grass_vlkhcbxia_High_4K",
    filePrefix: "Wild_Grass_vlkhcbxia_High_vlkhcbxia",
    id: "wild",
    lod: "LOD2",
    variants: ["A", "D", "G"],
  },
  {
    archive: "White Everlasting.zip",
    atlasPrefix: "White_Everlasting_ucvobbbia_High_4K",
    filePrefix: "White_Everlasting_ucvobbbia_High_ucvobbbia",
    id: "white",
    lod: "LOD2",
    variants: ["A", "C", "F", "H"],
  },
  {
    archive: "Yellow Flower.zip",
    atlasPrefix: "Yellow_Flower_xchjef3ia_High_4K",
    filePrefix: "Yellow_Flower_xchjef3ia_High_xchjef3ia",
    id: "yellow",
    lod: "LOD2",
    variants: ["A", "C", "F", "H"],
  },
];

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed:\n${result.stderr || result.stdout}`,
    );
  }
}

function extract(archiveName, entryName) {
  const archivePath = join(sourceRoot, archiveName);
  const familyWorkRoot = join(
    workRoot,
    basename(archiveName, ".zip").replaceAll(" ", "-"),
  );
  mkdirSync(familyWorkRoot, { recursive: true });
  run("unzip", ["-j", "-o", archivePath, entryName, "-d", familyWorkRoot]);
  return join(familyWorkRoot, basename(entryName));
}

function compactGeometry(source) {
  const keep = new Set(["position", "normal", "uv"]);
  for (const attribute of Object.keys(source.attributes)) {
    if (!keep.has(attribute)) source.deleteAttribute(attribute);
  }
  source.deleteAttribute("uv1");
  source.computeBoundingBox();
  const bounds = source.boundingBox;
  if (!bounds) throw new Error("Scan geometry has no bounding box.");
  const size = bounds.getSize(new THREE.Vector3());
  const maximumExtent = Math.max(size.x, size.y, size.z, 0.000_001);
  const centerX = (bounds.min.x + bounds.max.x) * 0.5;
  const centerZ = (bounds.min.z + bounds.max.z) * 0.5;
  source.translate(-centerX, -bounds.min.y, -centerZ);
  source.scale(1 / maximumExtent, 1 / maximumExtent, 1 / maximumExtent);
  source.computeBoundingBox();
  source.computeBoundingSphere();
  return source;
}

function collectGeometry(root) {
  root.updateMatrixWorld(true);
  const geometries = [];
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const geometry = object.geometry.clone();
    geometry.applyMatrix4(object.matrixWorld);
    geometries.push(geometry);
  });
  if (geometries.length === 0) {
    throw new Error("FBX scan did not contain mesh geometry.");
  }
  const merged =
    geometries.length === 1 ? geometries[0] : mergeGeometries(geometries, false);
  if (!merged) throw new Error("FBX scan geometry could not be merged.");
  for (const geometry of geometries) {
    if (geometry !== merged) geometry.dispose();
  }
  return compactGeometry(merged);
}

async function exportGeometry(geometry, outputPath) {
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color: 0xffffff }),
  );
  mesh.name = basename(outputPath, ".glb");
  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(mesh, {
    binary: true,
    includeCustomExtensions: false,
    onlyVisible: true,
  });
  if (!(result instanceof ArrayBuffer)) {
    throw new Error(`Expected binary GLB output for ${outputPath}.`);
  }
  writeFileSync(outputPath, Buffer.from(result));
  geometry.dispose();
  mesh.material.dispose();
}

async function convertPlantVariant(family, variant) {
  const entryName = `${family.filePrefix}_Var${variant}_${family.lod}.fbx`;
  const inputPath = extract(family.archive, entryName);
  const bytes = readFileSync(inputPath);
  const root = new FBXLoader().parse(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    `${pathToFileURL(inputPath).href}/`,
  );
  const geometry = collectGeometry(root);
  const familyOutputRoot = join(outputRoot, family.id);
  mkdirSync(familyOutputRoot, { recursive: true });
  await exportGeometry(
    geometry,
    join(familyOutputRoot, `${family.id}-${variant.toLowerCase()}.glb`),
  );
}

function convertTexture({
  archive,
  entryName,
  grayscale = false,
  outputPath,
  quality,
  size,
}) {
  const inputPath = extract(archive, entryName);
  mkdirSync(resolve(outputPath, ".."), { recursive: true });
  if (grayscale) {
    run("ffmpeg", [
      "-loglevel",
      "error",
      "-y",
      "-i",
      inputPath,
      "-vf",
      `format=rgb24,extractplanes=r,scale=${size}:${size},format=gray`,
      "-frames:v",
      "1",
      "-c:v",
      "libwebp",
      "-quality",
      String(quality),
      "-compression_level",
      "6",
      outputPath,
    ]);
    return;
  }
  run("cwebp", [
    "-quiet",
    "-mt",
    "-q",
    String(quality),
    "-resize",
    String(size),
    String(size),
    inputPath,
    "-o",
    outputPath,
  ]);
}

function convertFamilyTextures(family) {
  for (const [sourceSuffix, targetSuffix, quality] of [
    ["BaseColor", "basecolor", 88],
    ["Normal", "normal", 94],
    ["Roughness", "roughness", 94],
    ["AO", "ao", 94],
    ["Opacity", "opacity", 94],
  ]) {
    convertTexture({
      archive: family.archive,
      entryName: `${family.atlasPrefix}_${sourceSuffix}.jpg`,
      grayscale: targetSuffix === "opacity",
      outputPath: join(
        outputRoot,
        family.id,
        `${family.id}-${targetSuffix}.webp`,
      ),
      quality,
      size: 1024,
    });
  }
}

async function convertRocks() {
  const archive = "Small Rocks Pack.zip";
  const entryName = "Small_Rocks_Pack_ucdjdfmva_High.fbx";
  const inputPath = extract(archive, entryName);
  const bytes = readFileSync(inputPath);
  const root = new FBXLoader().parse(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    `${pathToFileURL(inputPath).href}/`,
  );
  root.updateMatrixWorld(true);
  const geometries = [];
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const geometry = object.geometry.clone();
    geometry.applyMatrix4(object.matrixWorld);
    geometries.push(compactGeometry(geometry));
  });
  if (geometries.length === 0) {
    throw new Error("Small Rocks Pack did not contain independent meshes.");
  }
  const rocksOutputRoot = join(outputRoot, "rocks");
  mkdirSync(rocksOutputRoot, { recursive: true });
  for (const [index, geometry] of geometries.slice(0, 8).entries()) {
    await exportGeometry(
      geometry,
      join(rocksOutputRoot, `rocks-${String(index + 1).padStart(2, "0")}.glb`),
    );
  }
  for (const geometry of geometries.slice(8)) geometry.dispose();
  for (const [sourceSuffix, targetSuffix, quality] of [
    ["BaseColor", "basecolor", 88],
    ["Normal", "normal", 94],
    ["Roughness", "roughness", 94],
    ["AO", "ao", 94],
  ]) {
    convertTexture({
      archive,
      entryName: `Small_Rocks_Pack_ucdjdfmva_High_4K_${sourceSuffix}.jpg`,
      outputPath: join(
        outputRoot,
        "rocks",
        `rocks-${targetSuffix}.webp`,
      ),
      quality,
      size: 1024,
    });
  }
}

function convertGround() {
  const archive = "Mossy Forest Floor 4K.zip";
  const prefix = "Mossy_Forest_Floor_vfylbge_4K";
  for (const [sourceSuffix, targetSuffix, quality] of [
    ["BaseColor", "basecolor", 90],
    ["Normal", "normal", 95],
    ["Roughness", "roughness", 95],
    ["AO", "ao", 95],
  ]) {
    convertTexture({
      archive,
      entryName: `${prefix}_${sourceSuffix}.jpg`,
      outputPath: join(outputRoot, "ground", `ground-${targetSuffix}.webp`),
      quality,
      size: 2048,
    });
  }
}

convertGround();
for (const family of plantFamilies) {
  convertFamilyTextures(family);
  for (const variant of family.variants) {
    await convertPlantVariant(family, variant);
  }
}
await convertRocks();

console.log(`Processed grass scans into ${outputRoot}`);
