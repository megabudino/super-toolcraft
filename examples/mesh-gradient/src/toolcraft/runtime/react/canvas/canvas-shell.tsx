"use client";

import * as React from "react";

import {
  DIRECT_CANVAS_OPERATION_TARGET,
  DIRECT_CANVAS_SOURCE_ASSET_CONTROL,
} from "../../source-assets/source-asset-coordinator";
import type { ToolcraftState } from "../../state/types";
import {
  CanvasDefaultMediaLayer,
  getVisibleCanvasImageAssets,
} from "./canvas-default-media-layer";
import { CanvasViewportWorld } from "./canvas-viewport-world";
import {
  useCanvasDropImport,
  type ToolcraftCanvasUploadPresentationState,
} from "./use-canvas-drop-import";
import { useCanvasViewportInteractions } from "./use-canvas-viewport-interactions";
import { useToolcraftStore } from "../app-shell/toolcraft-store-context";
import { useToolcraftSourceAssetCoordinator } from "../app-shell/toolcraft-source-asset-context";
import { useToolcraftCommittedSelector } from "../app-shell/toolcraft-selectors";
import { useToolcraftDispatch } from "../app-shell/use-toolcraft";
import { ToolcraftCanvasHandleLayers } from "../canvas-handles/canvas-handle-layer-registry";
import {
  getVisibleCanvasModelAssets,
  ToolcraftModelCanvasLayers,
} from "../model-rendering/model-canvas-layer";

const directCanvasModelOperationTargets = [
  DIRECT_CANVAS_OPERATION_TARGET,
] as const;

export type CanvasShellProps = {
  children?: React.ReactNode;
  renderDefaultMedia?: boolean;
};

function isDragLeavingCurrentTarget(
  event: React.DragEvent<HTMLElement>,
): boolean {
  const nextTarget = event.relatedTarget;

  return !(
    nextTarget instanceof Node && event.currentTarget.contains(nextTarget)
  );
}

function mediaAssetListsEqual<MediaAsset>(
  previous: readonly MediaAsset[],
  next: readonly MediaAsset[],
): boolean {
  return (
    previous.length === next.length &&
    previous.every((mediaAsset, index) => mediaAsset === next[index])
  );
}

const selectCanvasSchema = (state: ToolcraftState) => state.schema.canvas;
const selectSelectedLayerId = (state: ToolcraftState) => state.selectedLayerId;
const selectCanvasSize = (state: ToolcraftState) => state.canvas.size;

export function CanvasShell({
  children,
  renderDefaultMedia = true,
}: CanvasShellProps): React.JSX.Element {
  const dispatch = useToolcraftDispatch();
  const store = useToolcraftStore();
  const sourceAssetCoordinator = useToolcraftSourceAssetCoordinator();
  const [dragOver, setDragOver] = React.useState(false);
  const [uploadPresentation, setUploadPresentation] =
    React.useState<ToolcraftCanvasUploadPresentationState>({
      directOperation: false,
      feedback: null,
    });
  const canvasSchema = useToolcraftCommittedSelector(selectCanvasSchema);
  const selectedLayerId = useToolcraftCommittedSelector(selectSelectedLayerId);
  const size = useToolcraftCommittedSelector(selectCanvasSize);
  const visibleMediaAssets = useToolcraftCommittedSelector(
    getVisibleCanvasImageAssets,
    mediaAssetListsEqual,
  );
  const visibleModelAssets = useToolcraftCommittedSelector(
    getVisibleCanvasModelAssets,
    mediaAssetListsEqual,
  );
  const getDirectCanvasOperation = React.useCallback(
    () => sourceAssetCoordinator.getOperation(DIRECT_CANVAS_OPERATION_TARGET),
    [sourceAssetCoordinator],
  );
  const directCanvasOperation = React.useSyncExternalStore(
    sourceAssetCoordinator.subscribe,
    getDirectCanvasOperation,
    getDirectCanvasOperation,
  );
  const directCanvasPresentation = sourceAssetCoordinator.getPresentation(
    DIRECT_CANVAS_SOURCE_ASSET_CONTROL,
    visibleMediaAssets,
    directCanvasOperation,
  );
  const uploadStatus = uploadPresentation.directOperation
    ? directCanvasPresentation?.status
    : undefined;
  const uploadFeedback = uploadPresentation.feedback ??
    (uploadPresentation.directOperation
      ? directCanvasPresentation?.feedback ?? null
      : null);
  const uploadEnabled = canvasSchema.upload;
  const { handlePointerDown, handlePointerMove, handlePointerUp, viewportRef } =
    useCanvasViewportInteractions({
      draggable: canvasSchema.draggable,
      store,
    });
  const handleDrop = useCanvasDropImport({
    coordinator: sourceAssetCoordinator,
    onPresentationChange: setUploadPresentation,
    setDragOver,
    store,
    uploadEnabled,
  });
  const hasCanvasContent =
    visibleMediaAssets.length > 0 || visibleModelAssets.length > 0;
  const hasCanvasSlot = React.Children.count(children) > 0;
  const renderEditableCanvas =
    canvasSchema.sizing.mode !== "intrinsic-media" ||
    canvasSchema.sizeSource === "app" ||
    hasCanvasContent ||
    hasCanvasSlot;

  const beginDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    if (!uploadEnabled) {
      return;
    }

    event.preventDefault();
    setDragOver(true);
  };

  return (
    <div
      aria-label="Canvas viewport"
      className="group/canvas absolute inset-0 cursor-grab touch-none overflow-hidden bg-[color:var(--background)] active:cursor-grabbing"
      data-drag-over={dragOver}
      data-slot="toolcraft-runtime-canvas"
      onDragEnter={beginDragOver}
      onDragLeave={(event) => {
        if (isDragLeavingCurrentTarget(event)) {
          setDragOver(false);
        }
      }}
      onDragOver={beginDragOver}
      onDrop={handleDrop}
      onPointerCancel={handlePointerUp}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      ref={viewportRef}
      role="application"
    >
      <CanvasViewportWorld>
        {renderEditableCanvas ? (
          <div
            className="relative z-10 overflow-hidden"
            data-toolcraft-canvas-content=""
            data-toolcraft-editable-canvas=""
            style={{
              height: size.height,
              width: size.width,
            }}
          >
            <ToolcraftModelCanvasLayers
              dispatch={dispatch}
              operationTargets={directCanvasModelOperationTargets}
              operationSource={sourceAssetCoordinator}
            />
            {renderDefaultMedia
              ? visibleMediaAssets.map((mediaAsset) => (
                  <CanvasDefaultMediaLayer
                    canvasSize={size}
                    dispatch={dispatch}
                    key={mediaAsset.id}
                    mediaAsset={mediaAsset}
                    selected={selectedLayerId === mediaAsset.layerId}
                  />
                ))
              : null}
            {children ? (
              <div
                className="absolute inset-0 z-20"
                data-toolcraft-canvas-slot=""
              >
                {children}
              </div>
            ) : null}
          </div>
        ) : null}
      </CanvasViewportWorld>
      <ToolcraftCanvasHandleLayers />
      {uploadStatus || uploadFeedback ? (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 flex max-w-[min(32rem,calc(100%-1.5rem))] -translate-x-1/2 flex-col gap-1 border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-center text-xs leading-snug shadow-sm">
          {uploadStatus ? (
            <p
              aria-live="polite"
              className="m-0 text-[color:var(--muted-foreground)]"
              data-slot="canvas-upload-status"
              role="status"
            >
              {uploadStatus.label}
              {uploadStatus.progress === undefined
                ? ""
                : ` ${Math.round(uploadStatus.progress * 100)}%`}
            </p>
          ) : null}
          {uploadFeedback ? (
            <p
              className="m-0 text-[color:var(--destructive)]"
              data-slot="canvas-upload-feedback"
              role="alert"
            >
              {uploadFeedback.message}
            </p>
          ) : null}
        </div>
      ) : null}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-[color:color-mix(in_oklab,var(--link)_8%,transparent)] opacity-0 transition-opacity duration-150 ease-out group-data-[drag-over=true]/canvas:opacity-100"
        data-canvas-drag-highlight=""
      />
    </div>
  );
}
