import { LoadingManager, type Material, type Object3D } from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

import type {
  ToolcraftModelDecodeContext,
  ToolcraftModelDecodeResult,
  ToolcraftModelFormatAdapter,
} from "../model-import-types";
import { preflightFbx } from "./fbx-model-format-preflight";
import {
  readThreeStaticGeometryRoot,
  threeStaticGeometryFailure,
  throwIfThreeStaticGeometryAborted,
  ToolcraftThreeStaticGeometryError,
} from "./obj-stl-ply-model-format-adapter-support";
import { canonicalizeThreeStaticGeometry } from "./three-static-geometry-canonicalizer";
import { TOOLCRAFT_FBX_ADAPTER_VERSION } from "./production-model-format-manifest";

export { TOOLCRAFT_FBX_ADAPTER_VERSION };

function blockedResourceManager(): LoadingManager {
  const manager = new LoadingManager();
  manager.setURLModifier((url) =>
    threeStaticGeometryFailure(
      "format",
      "unsupported-fbx-external-resource",
      `Geometry-only FBX import cannot load external resource ${JSON.stringify(url)}.`,
    )
  );
  return manager;
}

function disposeParsedFbx(root: Object3D): void {
  const geometries = new Set<{ dispose: () => void }>();
  const materials = new Set<Material>();
  root.traverse((node) => {
    const renderable = node as Object3D & {
      geometry?: { dispose?: () => void };
      material?: Material | readonly Material[];
    };
    if (typeof renderable.geometry?.dispose === "function") {
      geometries.add(renderable.geometry as { dispose: () => void });
    }
    const nodeMaterials = Array.isArray(renderable.material)
      ? renderable.material
      : renderable.material
        ? [renderable.material]
        : [];
    for (const material of nodeMaterials) materials.add(material);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}

async function decodeFbx(
  context: ToolcraftModelDecodeContext,
): Promise<ToolcraftModelDecodeResult> {
  const source = readThreeStaticGeometryRoot(context, "fbx");
  preflightFbx(source, context);
  throwIfThreeStaticGeometryAborted(context.signal);
  let object: Object3D | undefined;
  try {
    object = new FBXLoader(blockedResourceManager()).parse(source, "");
    throwIfThreeStaticGeometryAborted(context.signal);
    return canonicalizeThreeStaticGeometry(object, {
      adapterVersion: TOOLCRAFT_FBX_ADAPTER_VERSION,
      limits: context.limits,
      signal: context.signal,
      sourceByteLength: source.byteLength,
      sourceFormat: "fbx",
    });
  } catch (error) {
    throwIfThreeStaticGeometryAborted(context.signal);
    if (error instanceof ToolcraftThreeStaticGeometryError) throw error;
    return threeStaticGeometryFailure(
      "format",
      "fbx-decode-failed",
      "The FBX geometry could not be decoded safely.",
    );
  } finally {
    if (object) disposeParsedFbx(object);
  }
}

export const toolcraftFbxModelFormatAdapter: ToolcraftModelFormatAdapter =
  Object.freeze({
    adapterVersion: TOOLCRAFT_FBX_ADAPTER_VERSION,
    decode: decodeFbx,
    format: "fbx",
    rootExtensions: Object.freeze([".fbx"]),
    workerCapable: true,
  });
