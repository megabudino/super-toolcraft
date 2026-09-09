import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const groundArchive = resolve(process.argv[2] ?? "");
const boulderArchive = resolve(process.argv[3] ?? "");
if (!process.argv[2] || !process.argv[3]) {
  throw new Error(
    "Usage: node scripts/process-tundra-assets.mjs /absolute/path/to/uncut-grass.zip /absolute/path/to/tundra-boulder.zip",
  );
}

const outputRoot = resolve("src/app/grass/assets/scans");
const workRoot = mkdtempSync(join(tmpdir(), "grass-tundra-assets-"));
const meshbinMagic = 0x314d4754;
const meshbinHeaderBytes = 16;

THREE.TextureLoader.prototype.load = function loadTextureWithoutDom(
  _url,
  onLoad,
) {
  const texture = new THREE.Texture();
  queueMicrotask(() => onLoad?.(texture));
  return texture;
};

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed:\n${result.stderr || result.stdout}`,
    );
  }
}

function extract(archivePath, entryName) {
  const targetRoot = join(
    workRoot,
    basename(archivePath, ".zip").replaceAll(" ", "-"),
  );
  mkdirSync(targetRoot, { recursive: true });
  run("unzip", ["-j", "-o", archivePath, entryName, "-d", targetRoot]);
  return join(targetRoot, basename(entryName));
}

function convertTexture({ archivePath, entryName, outputPath, quality }) {
  const inputPath = extract(archivePath, entryName);
  mkdirSync(resolve(outputPath, ".."), { recursive: true });
  run("cwebp", [
    "-quiet",
    "-mt",
    "-q",
    String(quality),
    "-resize",
    "2048",
    "2048",
    inputPath,
    "-o",
    outputPath,
  ]);
}

function compactGeometry(source) {
  const keep = new Set(["position", "normal", "uv"]);
  for (const attribute of Object.keys(source.attributes)) {
    if (!keep.has(attribute)) source.deleteAttribute(attribute);
  }
  source.deleteAttribute("uv1");
  if (!source.getAttribute("uv")) {
    throw new Error("Tundra boulder geometry has no UV coordinates.");
  }
  if (!source.getAttribute("normal")) source.computeVertexNormals();
  const geometry = source.index ? source.toNonIndexed() : source;
  if (geometry !== source) source.dispose();
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  if (!bounds) throw new Error("Tundra boulder geometry has no bounds.");
  const size = bounds.getSize(new THREE.Vector3());
  const maximumExtent = Math.max(size.x, size.y, size.z, 0.000_001);
  const centerX = (bounds.min.x + bounds.max.x) * 0.5;
  const centerZ = (bounds.min.z + bounds.max.z) * 0.5;
  geometry.translate(-centerX, -bounds.min.y, -centerZ);
  geometry.scale(1 / maximumExtent, 1 / maximumExtent, 1 / maximumExtent);
  const uvs = geometry.getAttribute("uv");
  for (let index = 0; index < uvs.count; index += 1) {
    uvs.setY(index, 1 - uvs.getY(index));
  }
  uvs.needsUpdate = true;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function collectBoulderGeometry(inputPath) {
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
    for (const attribute of Object.keys(geometry.attributes)) {
      if (!["position", "normal", "uv"].includes(attribute)) {
        geometry.deleteAttribute(attribute);
      }
    }
    if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
    geometries.push(geometry);
  });
  if (geometries.length === 0) {
    throw new Error("Tundra boulder FBX did not contain mesh geometry.");
  }
  const merged =
    geometries.length === 1 ? geometries[0] : mergeGeometries(geometries, false);
  if (!merged) throw new Error("Tundra boulder geometry could not be merged.");
  for (const geometry of geometries) {
    if (geometry !== merged) geometry.dispose();
  }
  return compactGeometry(merged);
}

function writeMeshbin(geometry, outputPath) {
  const positions = geometry.getAttribute("position");
  const normals = geometry.getAttribute("normal");
  const uvs = geometry.getAttribute("uv");
  if (
    !(positions.array instanceof Float32Array) ||
    !(normals.array instanceof Float32Array) ||
    !(uvs.array instanceof Float32Array)
  ) {
    throw new Error("Tundra boulder attributes must be Float32 arrays.");
  }
  if (positions.count === 0 || positions.count > 100_000) {
    throw new Error(
      `Tundra boulder vertex count ${positions.count} is outside the runtime boundary.`,
    );
  }
  const byteLength =
    meshbinHeaderBytes +
    positions.array.byteLength +
    normals.array.byteLength +
    uvs.array.byteLength;
  const output = Buffer.allocUnsafe(byteLength);
  output.writeUInt32LE(meshbinMagic, 0);
  output.writeUInt32LE(positions.count, 4);
  output.writeUInt32LE(3, 8);
  output.writeUInt32LE(0, 12);
  let byteOffset = meshbinHeaderBytes;
  for (const array of [positions.array, normals.array, uvs.array]) {
    Buffer.from(array.buffer, array.byteOffset, array.byteLength).copy(
      output,
      byteOffset,
    );
    byteOffset += array.byteLength;
  }
  mkdirSync(resolve(outputPath, ".."), { recursive: true });
  writeFileSync(outputPath, output);
  return positions.count;
}

try {
  const groundPrefix = "Uncut_Grass_oeeb70_4K";
  for (const [sourceSuffix, targetSuffix, quality] of [
    ["BaseColor", "basecolor", 90],
    ["AO", "ao", 95],
    ["Normal", "normal", 95],
    ["Roughness", "roughness", 95],
  ]) {
    convertTexture({
      archivePath: groundArchive,
      entryName: `${groundPrefix}_${sourceSuffix}.jpg`,
      outputPath: join(outputRoot, "ground", `ground-${targetSuffix}.webp`),
      quality,
    });
  }

  const boulderPrefix = "Tundra_Mossy_Boulder_vivvecldw_High_4K";
  for (const [sourceSuffix, targetSuffix, quality] of [
    ["BaseColor", "basecolor", 90],
    ["AO", "ao", 95],
    ["Normal", "normal", 95],
    ["Roughness", "roughness", 95],
  ]) {
    convertTexture({
      archivePath: boulderArchive,
      entryName: `${boulderPrefix}_${sourceSuffix}.jpg`,
      outputPath: join(outputRoot, "boulder", `boulder-${targetSuffix}.webp`),
      quality,
    });
  }

  const boulderFbx = extract(
    boulderArchive,
    "Tundra_Mossy_Boulder_vivvecldw_High.fbx",
  );
  const boulderGeometry = collectBoulderGeometry(boulderFbx);
  const vertexCount = writeMeshbin(
    boulderGeometry,
    join(outputRoot, "boulder", "boulder.meshbin"),
  );
  boulderGeometry.dispose();
  process.stdout.write(
    `Processed Uncut Grass and Tundra Boulder assets (${vertexCount} boulder vertices).\n`,
  );
} finally {
  rmSync(workRoot, { recursive: true, force: true });
}
