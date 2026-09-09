import * as React from "react";
import { FileDrop } from "@/toolcraft/ui";

import type { ToolcraftCanvasSize, ToolcraftControlSchema } from "../../../schema/types";
import type { ToolcraftSourceAssetCoordinator } from "../../../source-assets/source-asset-coordinator";
import type {
  ToolcraftCommand,
  ToolcraftMediaAsset,
  ToolcraftMediaTransformOperation,
} from "../../../state/types";
import { useToolcraftMediaPresentationUrls } from "../../app-shell/toolcraft-source-asset-context";

export type FileDropControlRenderArgs = {
  canvasSize: ToolcraftCanvasSize;
  control: ToolcraftControlSchema;
  dispatchCommand: (command: ToolcraftCommand) => void;
  id: string;
  mediaAssets: readonly ToolcraftMediaAsset[];
  sourceAssetCoordinator: ToolcraftSourceAssetCoordinator;
};

const IMAGE_TRANSFORM_OPERATIONS = new Set<ToolcraftMediaTransformOperation>([
  "flip-horizontal",
  "flip-vertical",
  "rotate-left",
  "rotate-right",
]);

const MODEL_REPAIR_ACTION = "model.fix";

function isImageTransformOperation(
  value: string,
): value is ToolcraftMediaTransformOperation {
  return IMAGE_TRANSFORM_OPERATIONS.has(value as ToolcraftMediaTransformOperation);
}

function FileDropControlRenderer({
  control,
  dispatchCommand,
  id,
  mediaAssets,
  sourceAssetCoordinator,
}: Omit<FileDropControlRenderArgs, "canvasSize">): React.JSX.Element | null {
  const assetKind = control.assetKind === "file"
    ? "file"
    : control.assetKind === "model"
      ? "model"
      : "image";
  const getOperation = React.useCallback(
    () => sourceAssetCoordinator.getOperation(control.target),
    [control.target, sourceAssetCoordinator],
  );
  const operation = React.useSyncExternalStore(
    sourceAssetCoordinator.subscribe,
    getOperation,
    getOperation,
  );
  const previewUrls = useToolcraftMediaPresentationUrls(mediaAssets);
  const [selectedMediaId, setSelectedMediaId] = React.useState<string | null>(null);
  const unresolvedPresentation = sourceAssetCoordinator.getPresentation(
    control,
    mediaAssets,
    operation,
  );
  const basePresentation = unresolvedPresentation
    ? {
        ...unresolvedPresentation,
        items: unresolvedPresentation.items.map((item) => {
          const previewSrc = previewUrls.get(item.id);

          return previewSrc ? { ...item, previewSrc } : item;
        }),
      }
    : null;
  const previewMediaIds = basePresentation?.items.map((item) => item.id) ?? [];
  const activeImageId = assetKind === "image"
    ? basePresentation?.items.length === 1
      ? basePresentation.items[0]?.id ?? null
      : selectedMediaId
    : null;
  const activeModelId = assetKind === "model"
    ? basePresentation?.items[0]?.id ?? null
    : null;
  const presentation =
    basePresentation && assetKind === "image" && !activeImageId
      ? { ...basePresentation, secondaryActions: [] }
      : basePresentation;

  React.useEffect(() => {
    if (selectedMediaId && !previewMediaIds.includes(selectedMediaId)) {
      setSelectedMediaId(null);
    }
  }, [previewMediaIds, selectedMediaId]);

  if (!basePresentation || !presentation) {
    return null;
  }

  const reorderItems = (orderedIds: readonly string[]): void => {
    if (orderedIds.length !== previewMediaIds.length) {
      return;
    }

    const previewIdSet = new Set(previewMediaIds);
    let orderedPreviewIndex = 0;
    const mediaIds = mediaAssets.map((asset) => {
      if (!previewIdSet.has(asset.id)) {
        return asset.id;
      }

      const nextId = orderedIds[orderedPreviewIndex];
      orderedPreviewIndex += 1;
      return nextId ?? asset.id;
    });

    dispatchCommand({ mediaIds, type: "media.reorder" });
  };

  const importFiles = (files: File[]): void => {
    void sourceAssetCoordinator.importBatch(
      {
        files,
        origin: "panel",
        target: control.target,
      },
      control,
    );
  };

  return (
    <FileDrop
      key={id}
      onAction={
        activeImageId
          ? (value) => {
              if (!isImageTransformOperation(value)) {
                return;
              }

              dispatchCommand({
                mediaId: activeImageId,
                operation: value,
                type: "media.transform",
              });
            }
          : activeModelId
            ? (value) => {
                if (value !== MODEL_REPAIR_ACTION) return;
                void sourceAssetCoordinator.repairModel(activeModelId);
              }
          : undefined
      }
      onFilesSelect={importFiles}
      onFolderSelect={
        presentation.allowsFolderSelection ? importFiles : undefined
      }
      onItemRemove={(item) => {
        dispatchCommand({ mediaId: item.id, type: "media.delete" });
      }}
      onItemSelect={
        assetKind === "image" && basePresentation.presenter === "image-grid"
          ? (item) => setSelectedMediaId(item.id)
          : undefined
      }
      onItemsReorder={
        basePresentation.presenter === "file-list" ||
        basePresentation.presenter === "image-grid"
          ? (items) => reorderItems(items.map((item) => item.id))
          : undefined
      }
      presentation={presentation}
    />
  );
}

export function renderFileDropControl({
  canvasSize: _canvasSize,
  control,
  ...rendererProps
}: FileDropControlRenderArgs): React.ReactNode {
  return <FileDropControlRenderer control={control} {...rendererProps} />;
}
