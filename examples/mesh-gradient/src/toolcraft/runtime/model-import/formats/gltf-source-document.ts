import { type GLTF, type JSONDocument } from "@gltf-transform/core";

import type {
  ToolcraftModelFormat,
  ToolcraftModelImportLimits,
} from "../../schema/types";
import { inspectBufferDataUri } from "../model-source-data-uri";
import { preflightAndParseGltfJson } from "../model-source-json-preflight";
import { normalizeLocalBufferUri } from "../model-source-path";
import type { GltfFeatureInventory } from "./gltf-canonical-metadata";
import {
  checkedGltfTotal,
  gltfDecodeCheckpoint,
  gltfDecodeFailure,
  throwIfGltfDecodeAborted,
} from "./gltf-decode-safety";
import { validateAndSanitizeGltfJson } from "./gltf-document-sanitizer";
import { extractGlbDocument } from "./gltf-glb-document";
import { preflightGltfJsonDocument } from "./gltf-json-preflight";
import type { GltfDecodedCountExpectation } from "./gltf-primitive-preflight";
import type { GltfSourceSnapshot } from "./gltf-source-snapshot";

const REMOTE_URI_PATTERN = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/iu;

type JsonRecord = Record<string, unknown>;

export type PreparedGltfSourceDocument = Readonly<{
  decodedCountExpectations: readonly GltfDecodedCountExpectation[];
  features: GltfFeatureInventory;
  jsonDocument: JSONDocument;
  retainedWorkerBytes: number;
}>;

function parseRootJson(
  bytes: Uint8Array<ArrayBuffer>,
  sourceWorkerBytes: number,
  maxWorkerBytes: number,
  signal: AbortSignal,
): { json: GLTF.IGLTF; workerBytes: number } {
  throwIfGltfDecodeAborted(signal);
  const remaining = maxWorkerBytes - sourceWorkerBytes;
  if (remaining <= 0) {
    return gltfDecodeFailure(
      "resource-limit",
      "estimated-worker-memory-limit-exceeded",
      "The source snapshot leaves no bounded memory for glTF JSON parsing.",
    );
  }
  const parsed = preflightAndParseGltfJson(bytes, remaining);
  throwIfGltfDecodeAborted(signal);
  if (
    typeof parsed.value !== "object" ||
    parsed.value === null ||
    Array.isArray(parsed.value)
  ) {
    return gltfDecodeFailure(
      "format",
      "malformed-gltf-json",
      "The glTF root must contain a JSON object.",
    );
  }
  const workerBytes = checkedGltfTotal(
    sourceWorkerBytes,
    parsed.preflight.estimatedWorkerBytes,
    maxWorkerBytes,
    "estimated-worker-memory-limit-exceeded",
    "glTF source and JSON memory",
  );
  return { json: parsed.value as GLTF.IGLTF, workerBytes };
}

function mapGltfBufferResources(
  json: GLTF.IGLTF,
  snapshot: GltfSourceSnapshot,
  format: Extract<ToolcraftModelFormat, "glb" | "gltf">,
  maxDecodedBytes: number,
  signal: AbortSignal,
): JSONDocument["resources"] {
  const resources = Object.create(null) as JSONDocument["resources"];
  const usedPaths = new Set([snapshot.root.path]);
  const rootDirectory = snapshot.root.path.split("/").slice(0, -1);
  const buffers = Array.isArray(json.buffers) ? json.buffers : [];
  buffers.forEach((bufferValue, index) => {
    gltfDecodeCheckpoint(signal, index);
    if (typeof bufferValue !== "object" || bufferValue === null) return;
    const uri = (bufferValue as unknown as JsonRecord).uri;
    if (typeof uri !== "string") return;
    if (inspectBufferDataUri(uri, maxDecodedBytes) !== undefined) return;
    if (format === "glb" || REMOTE_URI_PATTERN.test(uri)) {
      return gltfDecodeFailure(
        "bundle",
        "remote-buffer-uri",
        "Geometry buffer URIs must resolve to selected local glTF files.",
      );
    }
    const path = [...rootDirectory, ...normalizeLocalBufferUri(uri)].join("/");
    const source = snapshot.filesByPath.get(path);
    if (!source) {
      return gltfDecodeFailure(
        "bundle",
        "missing-buffer-file",
        `Selected source file ${path} is required by buffer URI ${uri}.`,
      );
    }
    resources[uri] = source.bytes;
    usedPaths.add(path);
  });
  const unexpected = snapshot.files.find((file) => !usedPaths.has(file.path));
  if (unexpected) {
    return gltfDecodeFailure(
      "bundle",
      "unexpected-source-file",
      `Selected source file ${unexpected.path} is not an exact buffer dependency.`,
    );
  }
  return resources;
}

export function prepareGltfSourceDocument(
  snapshot: GltfSourceSnapshot,
  format: Extract<ToolcraftModelFormat, "glb" | "gltf">,
  supportedExtensions: ReadonlySet<string>,
  limits: ToolcraftModelImportLimits,
  signal: AbortSignal,
): PreparedGltfSourceDocument {
  const extracted =
    format === "glb"
      ? extractGlbDocument(snapshot.root.bytes, signal)
      : { jsonBytes: snapshot.root.bytes, resources: undefined };
  const parsed = parseRootJson(
    extracted.jsonBytes,
    snapshot.sourceWorkerBytes,
    limits.maxEstimatedWorkerBytes,
    signal,
  );
  const features = validateAndSanitizeGltfJson(
    parsed.json,
    supportedExtensions,
    signal,
  );
  const resources =
    format === "glb"
      ? extracted.resources!
      : mapGltfBufferResources(
          parsed.json,
          snapshot,
          format,
          limits.maxDecodedBytes,
          signal,
        );
  const preflight = preflightGltfJsonDocument(
    parsed.json,
    resources,
    parsed.workerBytes,
    limits,
    signal,
  );
  return Object.freeze({
    decodedCountExpectations: Object.freeze(preflight.decodedCountExpectations),
    features,
    jsonDocument: { json: parsed.json, resources },
    retainedWorkerBytes: preflight.retainedWorkerBytes,
  });
}
