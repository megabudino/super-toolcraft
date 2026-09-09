import type { ToolcraftModelImportLimits } from "../schema/types";
import type {
  ToolcraftModelSourceBundle,
  ToolcraftModelSourceBundleTransfer,
  ToolcraftModelSourceFile,
} from "./model-import-types";
import {
  selectToolcraftModelFormatAdapter,
  type ToolcraftModelFormatIdentityRegistry,
} from "./formats/model-format-adapter";
import {
  checkedSourceByteTotal,
  snapshotModelSourceBundleLimits,
} from "./model-source-bundle-limits";
import { failModelSourceBundle } from "./model-source-bundle-error";
import {
  copyOwnedBytesToArrayBuffer,
  readOwnedModelSourceBytes,
} from "./model-source-bytes";
import {
  createModelSourceResourceRef,
  digestModelSourceBundle,
  digestModelSourceBytesAsync,
} from "./model-source-digest";
import { inspectGltfSourceBuffers } from "./model-source-gltf";
import {
  assertModelSourceRawBatchAdmission,
  snapshotModelSourceFiles,
  type ModelSourceFileSnapshot,
} from "./model-source-path";

export { ToolcraftModelSourceBundleError } from "./model-source-bundle-error";

export type CreateToolcraftModelSourceBundleOptions = Readonly<{
  limits?: Partial<ToolcraftModelImportLimits>;
  registry: ToolcraftModelFormatIdentityRegistry;
}>;

const APPEARANCE_ONLY_EXTENSIONS: ReadonlySet<string> = new Set([
  ".avif",
  ".basis",
  ".bmp",
  ".dds",
  ".gif",
  ".jpeg",
  ".jpg",
  ".ktx",
  ".ktx2",
  ".mtl",
  ".png",
  ".tga",
  ".webp",
]);

function comparePaths(
  left: ModelSourceFileSnapshot,
  right: ModelSourceFileSnapshot,
): number {
  return left.path < right.path ? -1 : left.path > right.path ? 1 : 0;
}

function assertOnlySelectedOrAppearanceFiles(
  files: readonly ModelSourceFileSnapshot[],
  selectedPaths: ReadonlySet<string>,
): void {
  const unexpected = files
    .filter(
      (file) =>
        !selectedPaths.has(file.path) &&
        !APPEARANCE_ONLY_EXTENSIONS.has(file.extension) &&
        !file.mimeType.startsWith("image/"),
    )
    .sort(comparePaths)[0];
  if (unexpected) {
    failModelSourceBundle(
      "bundle",
      "unexpected-source-file",
      "A selected source file is neither required geometry nor an appearance-only sidecar.",
    );
  }
}

function assertUniqueRootPaths(
  roots: readonly { source: ModelSourceFileSnapshot }[],
): void {
  const rootsByPath = new Map<string, ModelSourceFileSnapshot[]>();
  for (const { source } of roots) {
    const matches = rootsByPath.get(source.path) ?? [];
    matches.push(source);
    rootsByPath.set(source.path, matches);
  }
  for (const matches of rootsByPath.values()) {
    if (matches.length < 2) continue;
    const code =
      new Set(matches.map(({ rawPath }) => rawPath)).size > 1
        ? "ambiguous-normalized-path"
        : "duplicate-source-path";
    failModelSourceBundle(
      "bundle",
      code,
      "More than one selected source file resolves to the model root.",
    );
  }
}

async function createSourceFileDto(
  source: ModelSourceFileSnapshot,
  bytes: Uint8Array,
): Promise<ToolcraftModelSourceFile> {
  const contentDigest = await digestModelSourceBytesAsync(bytes);
  return Object.freeze({
    byteLength: bytes.byteLength,
    contentDigest,
    displayName: source.displayName,
    mimeType: source.mimeType,
    path: source.path,
    resourceRef: createModelSourceResourceRef(contentDigest, source.mimeType),
  });
}

type OwnedModelSourceFile = Readonly<{
  bytes: Uint8Array;
  dto: ToolcraftModelSourceFile;
}>;

function createSourceBundleTransfer(
  bundle: ToolcraftModelSourceBundle,
  ownedFiles: readonly OwnedModelSourceFile[],
): ToolcraftModelSourceBundleTransfer {
  return Object.freeze({
    aggregateDigest: bundle.aggregateDigest,
    rootPath: bundle.rootPath,
    sourceFiles: Object.freeze(
      ownedFiles.map(({ bytes, dto }) =>
        Object.freeze({
          bytes: copyOwnedBytesToArrayBuffer(bytes),
          contentDigest: dto.contentDigest,
          mimeType: dto.mimeType,
          path: dto.path,
        }),
      ),
    ),
  });
}

async function resolveOwnedModelSourceBundle(
  files: readonly File[],
  options: CreateToolcraftModelSourceBundleOptions,
): Promise<
  Readonly<{
    bundle: ToolcraftModelSourceBundle;
    ownedFiles: readonly OwnedModelSourceFile[];
  }>
> {
  const limits = snapshotModelSourceBundleLimits(options?.limits);
  if (!Array.isArray(files)) {
    return failModelSourceBundle(
      "bundle",
      "invalid-source-batch",
      "Model source files must be provided as one File array.",
    );
  }

  assertModelSourceRawBatchAdmission(files);
  const snapshots = snapshotModelSourceFiles(files.slice());
  const roots = snapshots.flatMap((source) => {
    const adapter = selectToolcraftModelFormatAdapter(
      options.registry,
      source.extension,
    );
    return adapter ? [{ adapter, source }] : [];
  });
  assertUniqueRootPaths(roots);
  if (roots.length === 0) {
    return failModelSourceBundle(
      "format",
      "unsupported-model-root",
      "The selected batch does not contain a root owned by a registered model adapter.",
    );
  }
  if (roots.length !== 1) {
    return failModelSourceBundle(
      "bundle",
      "multiple-model-roots",
      "Select exactly one supported model root per import batch.",
    );
  }

  const root = roots[0]!;
  checkedSourceByteTotal(
    0,
    root.source.size,
    limits.maxSourceBytes,
    "source-byte-limit-exceeded",
  );
  checkedSourceByteTotal(
    0,
    root.source.size,
    limits.maxDecodedBytes,
    "decoded-byte-limit-exceeded",
  );
  const rootBytes = await readOwnedModelSourceBytes(root.source);
  let dependencies: readonly ModelSourceFileSnapshot[] = [];
  if (root.adapter.format === "gltf") {
    dependencies = inspectGltfSourceBuffers(
      root.source,
      rootBytes,
      snapshots,
      limits,
    ).dependencies;
  }

  const orderedSources = [
    root.source,
    ...dependencies
      .filter((dependency) => dependency.path !== root.source.path)
      .sort(comparePaths),
  ];
  const selectedPaths = new Set(orderedSources.map(({ path }) => path));
  assertOnlySelectedOrAppearanceFiles(snapshots, selectedPaths);
  if (orderedSources.length > limits.maxBundleFiles) {
    return failModelSourceBundle(
      "resource-limit",
      "bundle-file-limit-exceeded",
      "The model requires too many geometry source files.",
    );
  }
  let logicalSourceBytes = 0;
  for (const source of orderedSources) {
    logicalSourceBytes = checkedSourceByteTotal(
      logicalSourceBytes,
      source.size,
      limits.maxSourceBytes,
      "source-byte-limit-exceeded",
    );
  }

  const bytesByPath = new Map<string, Uint8Array>([
    [root.source.path, rootBytes],
  ]);
  for (const source of orderedSources.slice(1)) {
    bytesByPath.set(source.path, await readOwnedModelSourceBytes(source));
  }
  const ownedFiles = Object.freeze(
    await Promise.all(orderedSources.map(async (source) => {
      const bytes = bytesByPath.get(source.path)!;
      return Object.freeze({
        bytes,
        dto: await createSourceFileDto(source, bytes),
      });
    })),
  );
  const sourceFiles = Object.freeze(ownedFiles.map(({ dto }) => dto));
  const adapterEvidence = Object.freeze({
    adapterVersion: root.adapter.adapterVersion,
    format: root.adapter.format,
    rootExtension: root.source.extension,
  });
  const aggregateByteLength = sourceFiles.reduce(
    (total, source) => total + source.byteLength,
    0,
  );

  const bundle = Object.freeze({
    adapter: adapterEvidence,
    aggregateByteLength,
    aggregateDigest: digestModelSourceBundle(
      adapterEvidence,
      root.source.path,
      sourceFiles,
    ),
    rootPath: root.source.path,
    sourceFiles,
  });
  return Object.freeze({ bundle, ownedFiles });
}

export async function createToolcraftModelSourceBundle(
  files: readonly File[],
  options: CreateToolcraftModelSourceBundleOptions,
): Promise<ToolcraftModelSourceBundle> {
  return (await resolveOwnedModelSourceBundle(files, options)).bundle;
}

export async function createToolcraftModelSourceBundleSnapshot(
  files: readonly File[],
  options: CreateToolcraftModelSourceBundleOptions,
): Promise<
  Readonly<{
    bundle: ToolcraftModelSourceBundle;
    transfer: ToolcraftModelSourceBundleTransfer;
  }>
> {
  const resolved = await resolveOwnedModelSourceBundle(files, options);
  return Object.freeze({
    bundle: resolved.bundle,
    transfer: createSourceBundleTransfer(resolved.bundle, resolved.ownedFiles),
  });
}
