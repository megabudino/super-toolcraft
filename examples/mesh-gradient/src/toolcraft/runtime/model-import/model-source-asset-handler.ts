import type {
  ToolcraftControlSchema,
  ToolcraftModelFormat,
  ToolcraftModelImportLimits,
  ToolcraftModelTopologyProfile,
} from "../schema/types";
import { createToolcraftSourceAssetPresentation } from "../source-assets/source-asset-presentation";
import type {
  ToolcraftPreparedSourceAssetRecord,
  ToolcraftSourceAssetBatch,
  ToolcraftSourceAssetFeedback,
  ToolcraftSourceAssetHandler,
  ToolcraftSourceAssetPrepareContext,
} from "../source-assets/source-asset-types";
import {
  TOOLCRAFT_ADVERTISED_MODEL_FORMATS,
  TOOLCRAFT_PRODUCTION_GEOMETRY_DECODER_VERSIONS,
  TOOLCRAFT_PRODUCTION_MODEL_FORMAT_ADAPTER_REGISTRY,
  TOOLCRAFT_PRODUCTION_MODEL_FORMAT_REGISTRATIONS,
} from "./formats/production-model-format-registry";
import { normalizeToolcraftModelImportLimits } from "./model-import-limits";
import { projectToolcraftModelAnalysisSummary } from "./model-analysis-summary";
import {
  createToolcraftModelDocumentResourceRef,
  createToolcraftModelRepairPlanResourceRef,
  TOOLCRAFT_MODEL_DOCUMENT_CONTENT_TYPE,
  TOOLCRAFT_MODEL_REPAIR_PLAN_CONTENT_TYPE,
} from "./model-source-asset-handler-resources";
import { createToolcraftModelSourceBundleDescriptorResource } from "./model-source-bundle-codec";
import { createToolcraftModelSourceBundleSnapshot } from "./model-source-bundle";
import type { ToolcraftModelSourceBundle } from "./model-import-types";
import type { ToolcraftModelWorkerClient } from "./worker/model-import-worker-client";
import type { ToolcraftModelWorkerTerminalResponse } from "./worker/model-import-worker-protocol";

export type CreateToolcraftModelSourceAssetHandlerOptions = Readonly<{
  workerClient: ToolcraftModelWorkerClient;
}>;

type ProductionRoot = Readonly<{
  file: File;
  format: ToolcraftModelFormat;
}>;

const rootsByExtension = new Map<string, ToolcraftModelFormat>();
for (const { adapter } of TOOLCRAFT_PRODUCTION_MODEL_FORMAT_REGISTRATIONS) {
  for (const extension of adapter.rootExtensions) {
    rootsByExtension.set(extension, adapter.format);
  }
}

function throwCancelled(): never {
  const error = new Error("Model source import was cancelled.");
  error.name = "AbortError";
  throw error;
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throwCancelled();
}

function rejectWithFeedback(feedback: ToolcraftSourceAssetFeedback): never {
  throw Object.assign(new Error(feedback.message), feedback);
}

function fileExtension(file: File): string {
  const dot = file.name.lastIndexOf(".");
  return dot < 0 ? "" : file.name.slice(dot).toLowerCase();
}

function productionRoots(batch: ToolcraftSourceAssetBatch): readonly ProductionRoot[] {
  return batch.files.flatMap((file) => {
    const format = rootsByExtension.get(fileExtension(file));
    return format ? [{ file, format }] : [];
  });
}

function modelControlDetails(control: ToolcraftControlSchema): Readonly<{
  formats: readonly ToolcraftModelFormat[];
  limits: ToolcraftModelImportLimits;
  topologyProfile: ToolcraftModelTopologyProfile;
}> {
  if (control.assetKind !== "model") {
    throw new Error("Model source handler requires a model fileDrop control.");
  }
  return Object.freeze({
    formats: control.modelFormats ?? TOOLCRAFT_ADVERTISED_MODEL_FORMATS,
    limits: normalizeToolcraftModelImportLimits(control.modelLimits),
    topologyProfile: control.topologyProfile ?? "realtime-mesh",
  });
}

async function stageSourceBundle(
  context: ToolcraftSourceAssetPrepareContext,
  limits: ToolcraftModelImportLimits,
): Promise<Readonly<{
  bundle: ToolcraftModelSourceBundle;
  sourceBundleRef: string;
  stagedRefs: Set<string>;
  transfer: Awaited<ReturnType<typeof createToolcraftModelSourceBundleSnapshot>>["transfer"];
}>> {
  context.reportOperation({ phase: "staging", progress: 0 });
  throwIfAborted(context.signal);
  const snapshot = await createToolcraftModelSourceBundleSnapshot(
    context.batch.files,
    {
      limits,
      registry: TOOLCRAFT_PRODUCTION_MODEL_FORMAT_ADAPTER_REGISTRY,
    },
  );
  throwIfAborted(context.signal);
  const transferByPath = new Map(
    snapshot.transfer.sourceFiles.map((source) => [source.path, source]),
  );
  const stagedRefs = new Set<string>();
  for (let index = 0; index < snapshot.bundle.sourceFiles.length; index += 1) {
    const metadata = snapshot.bundle.sourceFiles[index]!;
    const source = transferByPath.get(metadata.path);
    if (!source) {
      throw new Error("Model source transfer is missing declared metadata.");
    }
    await context.stageResource(
      metadata.resourceRef,
      new Uint8Array(source.bytes),
      { contentType: metadata.mimeType, durable: true },
    );
    stagedRefs.add(metadata.resourceRef);
    context.reportOperation({
      phase: "staging",
      progress: (index + 1) / (snapshot.bundle.sourceFiles.length + 1),
    });
    throwIfAborted(context.signal);
  }
  const descriptor = createToolcraftModelSourceBundleDescriptorResource(
    snapshot.bundle,
    {
      limits: {
        maxBundleFiles: limits.maxBundleFiles,
        maxSourceBytes: limits.maxSourceBytes,
      },
    },
  );
  await context.stageResource(
    descriptor.sourceBundleRef,
    descriptor.bytes,
    descriptor.stageOptions,
  );
  stagedRefs.add(descriptor.sourceBundleRef);
  context.reportOperation({ phase: "staging", progress: 1 });
  return Object.freeze({
    bundle: snapshot.bundle,
    sourceBundleRef: descriptor.sourceBundleRef,
    stagedRefs,
    transfer: snapshot.transfer,
  });
}

async function runWorkerImport(
  context: ToolcraftSourceAssetPrepareContext,
  staged: Awaited<ReturnType<typeof stageSourceBundle>>,
  details: ReturnType<typeof modelControlDetails>,
  workerClient: ToolcraftModelWorkerClient,
): Promise<ToolcraftModelWorkerTerminalResponse> {
  const decoderVersion =
    TOOLCRAFT_PRODUCTION_GEOMETRY_DECODER_VERSIONS[staged.bundle.adapter.format];
  if (!decoderVersion) {
    throw new Error("Model source adapter has no production decoder version.");
  }
  let draftStages = Promise.resolve();
  let draftFailure: unknown;
  context.reportOperation({ phase: "decoding", progress: 0 });
  const terminal = await workerClient.importModel({
    adapterVersion: staged.bundle.adapter.adapterVersion,
    bundle: staged.transfer,
    format: staged.bundle.adapter.format,
    geometryDecoderVersion: decoderVersion,
    jobId: context.jobId,
    limits: details.limits,
    topologyProfile: details.topologyProfile,
  }, {
    onDraft: ({ draft }) => {
      draftStages = draftStages.then(async () => {
        throwIfAborted(context.signal);
        const ref = createToolcraftModelDocumentResourceRef(
          draft.canonicalDocumentDigest,
        );
        await context.stageResource(
          ref,
          new Uint8Array(draft.canonicalDocument),
          { contentType: TOOLCRAFT_MODEL_DOCUMENT_CONTENT_TYPE, durable: false },
        );
        staged.stagedRefs.add(ref);
        throwIfAborted(context.signal);
        context.reportOperation({ phase: "analyzing", stagedDocumentRef: ref });
      }).catch((error: unknown) => {
        draftFailure ??= error;
      });
    },
    onProgress: ({ phase, progress }) => {
      context.reportOperation({ phase, progress });
    },
    signal: context.signal,
  });
  await draftStages;
  if (draftFailure !== undefined) throw draftFailure;
  return terminal;
}

export function createToolcraftModelSourceAssetHandler({
  workerClient,
}: CreateToolcraftModelSourceAssetHandlerOptions): ToolcraftSourceAssetHandler<
  "model",
  ToolcraftPreparedSourceAssetRecord<"model">
> {
  return {
    kind: "model",
    match: (batch, control) => {
      if (control.type !== "fileDrop" || control.assetKind !== "model" ||
          batch.files.length === 0) return null;
      const roots = productionRoots(batch);
      const allowed = new Set(
        control.modelFormats ?? TOOLCRAFT_ADVERTISED_MODEL_FORMATS,
      );
      if (roots.length === 0 || roots.some(({ format }) => !allowed.has(format))) {
        return null;
      }
      return Object.freeze({
        handlerKind: "model" as const,
        rootFileNames: Object.freeze(roots.map(({ file }) => file.name)),
        specificity: 200,
      });
    },
    plan: (batch, control, claim) => Object.freeze({
      claim,
      logicalAssetCount: 1,
      replaceExisting: true,
      target: batch.target ?? control.target,
    }),
    prepare: async (context) => {
      const details = modelControlDetails(context.control);
      const staged = await stageSourceBundle(context, details.limits);
      const terminal = await runWorkerImport(
        context,
        staged,
        details,
        workerClient,
      );
      throwIfAborted(context.signal);
      if (terminal.kind === "cancelled") {
        throwCancelled();
      }
      if (terminal.kind === "error") {
        return rejectWithFeedback(terminal.feedback);
      }
      if (terminal.result.operation !== "decode-and-analyze") {
        throw new Error("Model worker returned the wrong operation result.");
      }
      const result = terminal.result;
      const documentRef = createToolcraftModelDocumentResourceRef(
        result.canonicalDocumentDigest,
      );
      await context.stageResource(
        documentRef,
        new Uint8Array(result.canonicalDocument),
        { contentType: TOOLCRAFT_MODEL_DOCUMENT_CONTENT_TYPE, durable: false },
      );
      staged.stagedRefs.add(documentRef);
      let repairPlanRef: string | undefined;
      if (result.repairPlanEnvelope) {
        repairPlanRef = createToolcraftModelRepairPlanResourceRef(
          result.repairPlanEnvelope,
        );
        await context.stageResource(
          repairPlanRef,
          new Uint8Array(result.repairPlanEnvelope.bytes),
          { contentType: TOOLCRAFT_MODEL_REPAIR_PLAN_CONTENT_TYPE, durable: false },
        );
        staged.stagedRefs.add(repairPlanRef);
      }
      throwIfAborted(context.signal);
      const projected = projectToolcraftModelAnalysisSummary(result.analysis, {
        repairPlanRef,
      });
      if (projected.outcome === "fatal") {
        return rejectWithFeedback(Object.freeze({
          category: "topology",
          code: "model-topology-fatal",
          message: "The model contains fatal topology errors and was not imported.",
        }));
      }
      const root = staged.bundle.sourceFiles.find(
        ({ path }) => path === staged.bundle.rootPath,
      );
      if (!root) throw new Error("Model source bundle root metadata is missing.");
      const lifecycle = projected.outcome === "repairable"
        ? "repairable" as const
        : "clean" as const;
      const asset = Object.freeze({
        activeDocumentRef: documentRef,
        analysis: projected,
        assetKind: "model" as const,
        fileName: root.displayName,
        lifecycle,
        mimeType: root.mimeType,
        originalAnalysis: projected,
        originalDocumentRef: documentRef,
        sourceBundleDigest: staged.bundle.aggregateDigest,
        sourceBundleRef: staged.sourceBundleRef,
        topologyProfile: details.topologyProfile,
        ...(context.plan.sourceTarget
          ? { sourceTarget: context.plan.sourceTarget }
          : {}),
      });
      return Object.freeze({
        assets: Object.freeze([asset]),
        stagedResourceRefs: Object.freeze([...staged.stagedRefs].sort()),
      });
    },
    present: ({ control, mediaAssets, operation }) =>
      createToolcraftSourceAssetPresentation(
        "model",
        control,
        mediaAssets,
        operation,
      ),
  };
}
