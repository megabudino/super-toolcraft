import {
  isToolcraftImageFile,
  readImportedImageFile,
} from "../react/canvas/media-file";
import {
  doesToolcraftControlAcceptBatch,
} from "./file-source-asset-handler";
import { prepareToolcraftSourceAssetBatch } from "./source-asset-batch-preparation";
import { createToolcraftSourceAssetPresentation } from "./source-asset-presentation";
import type {
  ToolcraftPreparedSourceAssetRecord,
  ToolcraftSourceAssetHandler,
} from "./source-asset-types";

function throwIfAborted(signal: AbortSignal): void {
  if (!signal.aborted) {
    return;
  }

  const error = new Error("Source asset import was cancelled");
  error.name = "AbortError";
  throw error;
}

export const toolcraftImageSourceAssetHandler: ToolcraftSourceAssetHandler<
  "image",
  ToolcraftPreparedSourceAssetRecord<"image">
> = {
  kind: "image",
  match: (batch, control) => {
    if (
      control.type !== "fileDrop" ||
      control.assetKind === "file" ||
      control.assetKind === "model" ||
      !doesToolcraftControlAcceptBatch(control, batch) ||
      !batch.files.every(isToolcraftImageFile)
    ) {
      return null;
    }

    return {
      handlerKind: "image",
      rootFileNames: batch.files.map((file) => file.name),
      specificity: 100,
    };
  },
  plan: (batch, control, claim) => ({
    claim,
    logicalAssetCount: batch.files.length,
    replaceExisting: control.multiple !== true,
    target: batch.target ?? control.target,
  }),
  prepare: async (context) => {
    let completedCount = 0;
    context.reportOperation({ phase: "decoding", progress: 0 });
    const assets = await prepareToolcraftSourceAssetBatch(
      context.batch.files,
      context.signal,
      async (file, signal) => {
        throwIfAborted(signal);
        const imported = await readImportedImageFile(
          file,
          context.canvasSize,
          signal,
        );
        throwIfAborted(signal);

        if (!imported) {
          throw new Error(`Could not decode image file "${file.name}".`);
        }

        completedCount += 1;
        context.reportOperation({
          phase: "decoding",
          progress: completedCount / context.batch.files.length,
        });

        return {
          assetKind: "image" as const,
          dataUrl: imported.dataUrl,
          fileName: file.name,
          mimeType: file.type || "image/*",
          position: context.batch.position
            ? { ...context.batch.position }
            : { x: 0, y: 0 },
          size: imported.size,
          ...(context.plan.sourceTarget
            ? { sourceTarget: context.plan.sourceTarget }
            : {}),
        };
      },
    );

    return { assets, stagedResourceRefs: [] };
  },
  present: ({ control, mediaAssets, operation }) =>
    createToolcraftSourceAssetPresentation(
      "image",
      control,
      mediaAssets,
      operation,
    ),
};
