import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NodeIO } from "@gltf-transform/core";

const scanRoot = path.resolve("src/app/grass/assets/scans");
const outputMagic = 0x314d4754;
const outputHeaderBytes = 16;
const io = new NodeIO();

function expandAttribute(array, itemSize, indices) {
  if (!indices) return Float32Array.from(array);
  const expanded = new Float32Array(indices.length * itemSize);
  for (let index = 0; index < indices.length; index += 1) {
    const sourceIndex = Number(indices[index]);
    for (let component = 0; component < itemSize; component += 1) {
      expanded[index * itemSize + component] =
        Number(array[sourceIndex * itemSize + component]) || 0;
    }
  }
  return expanded;
}

async function exportGeometry(inputPath) {
  const document = await io.read(inputPath);
  const primitives = document
    .getRoot()
    .listMeshes()
    .flatMap((mesh) => mesh.listPrimitives());
  if (primitives.length !== 1) {
    throw new Error(`${inputPath} must contain exactly one mesh primitive.`);
  }
  const primitive = primitives[0];
  const positionAccessor = primitive.getAttribute("POSITION");
  const uvAccessor = primitive.getAttribute("TEXCOORD_0");
  const normalAccessor = primitive.getAttribute("NORMAL");
  if (!positionAccessor || !uvAccessor) {
    throw new Error(`${inputPath} must contain positions and UVs.`);
  }
  const indices = primitive.getIndices()?.getArray() ?? null;
  const positions = expandAttribute(positionAccessor.getArray(), 3, indices);
  const uvs = expandAttribute(uvAccessor.getArray(), 2, indices);
  const normals = normalAccessor
    ? expandAttribute(normalAccessor.getArray(), 3, indices)
    : null;
  const vertexCount = positions.length / 3;
  if (uvs.length !== vertexCount * 2) {
    throw new Error(`${inputPath} produced a mismatched UV stream.`);
  }
  const flags = (normals ? 1 : 0) | 2;
  const byteLength =
    outputHeaderBytes +
    positions.byteLength +
    (normals?.byteLength ?? 0) +
    uvs.byteLength;
  const output = new ArrayBuffer(byteLength);
  const header = new DataView(output);
  header.setUint32(0, outputMagic, true);
  header.setUint32(4, vertexCount, true);
  header.setUint32(8, flags, true);
  header.setUint32(12, 0, true);
  let byteOffset = outputHeaderBytes;
  new Float32Array(output, byteOffset, positions.length).set(positions);
  byteOffset += positions.byteLength;
  if (normals) {
    new Float32Array(output, byteOffset, normals.length).set(normals);
    byteOffset += normals.byteLength;
  }
  new Float32Array(output, byteOffset, uvs.length).set(uvs);
  const outputPath = inputPath.replace(/\.glb$/u, ".meshbin");
  await writeFile(outputPath, new Uint8Array(output));
  process.stdout.write(
    `${path.relative(process.cwd(), outputPath)} ${vertexCount} vertices\n`,
  );
}

async function collectGlbs(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...(await collectGlbs(entryPath)));
    else if (entry.name.endsWith(".glb")) results.push(entryPath);
  }
  return results.sort();
}

for (const inputPath of await collectGlbs(scanRoot)) {
  await exportGeometry(inputPath);
}
