"use client";

import * as React from "react";

import {
  resolveToolcraftExportFrame,
  ToolcraftSceneExportError,
  type ToolcraftExportFrame,
  type ToolcraftExportFrameResult,
} from "../../../export";
import type { ToolcraftRendererPipelineClient } from "../../../rendering";
import {
  defaultToolcraftRuntimeSceneVisibility,
  resolveToolcraftSceneBounds,
  type ToolcraftProductSceneBoundsProvider,
  type ToolcraftRuntimeSceneVisibility,
} from "../../../scene";
import type {
  ToolcraftActionCommand,
  ToolcraftActionSchema,
} from "../../../schema/types";
import type {
  ToolcraftCommand,
  ToolcraftState,
} from "../../../state/types";
import { getToolcraftCanvasFrame } from "../../../state/canvas-frame";
import type { ActionControlRunAction } from "../renderers/controls-panel-action-renderer";
import {
  renderToolcraftRuntimeSceneToCanvas,
  type ToolcraftRuntimeSceneExportResult,
} from "../../canvas/runtime-scene-export";
import { useToolcraftPipeline } from "../../app-shell/use-toolcraft-pipeline";
import { useToolcraftSourceAssetCoordinator } from "../../app-shell/toolcraft-source-asset-context";
import {
  renderToolcraftModelsToCanvas,
  type ToolcraftRenderModelsToCanvas,
} from "../../model-rendering/model-export";
import { useOptionalToolcraftModelRenderHost } from "../../model-rendering/model-render-provider";

export type ToolcraftPanelActionFeedback = Readonly<{
  code: string;
  message: string;
}>;

export type ToolcraftControlsSceneExport = Readonly<{
  boundsProvider?: ToolcraftProductSceneBoundsProvider;
  boundsRequired: boolean;
  visibility: ToolcraftRuntimeSceneVisibility;
}>;

export type ToolcraftPanelActionContext = {
  action: ToolcraftActionSchema;
  dispatch: React.Dispatch<ToolcraftCommand>;
  renderRuntimeSceneToCanvas: (
    canvas: HTMLCanvasElement,
    frame: ToolcraftExportFrame,
  ) => Promise<ToolcraftRuntimeSceneExportResult>;
  reportProgress: (progress: number) => void;
  reportFeedback: (feedback: ToolcraftPanelActionFeedback) => void;
  renderModelsToCanvas: ToolcraftRenderModelsToCanvas;
  resolveSceneExportFrame: (options?: Readonly<{
    timeRange?: Readonly<{ endSeconds: number; startSeconds: number }>;
  }>) => ToolcraftExportFrameResult;
  rendererPipeline?: ToolcraftRendererPipelineClient | null;
  state: ToolcraftState;
};

export type ToolcraftPanelActionHandler = (
  context: ToolcraftPanelActionContext,
) => PromiseLike<unknown> | void;

type FooterActionProgressEntry = {
  id: number;
  progress: number | null;
};

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

function noopReportProgress(): void {}

const defaultSceneExport: ToolcraftControlsSceneExport = Object.freeze({
  boundsRequired: false,
  visibility: defaultToolcraftRuntimeSceneVisibility,
});

function unavailableProductBounds(message: string): ToolcraftExportFrameResult {
  return { code: "scene-bounds-unavailable", message, ok: false };
}

function resolveActionSceneExportFrame(
  sceneExport: ToolcraftControlsSceneExport,
  state: ToolcraftState,
  timeRange?: Readonly<{ endSeconds: number; startSeconds: number }>,
): ToolcraftExportFrameResult {
  const finiteFrame = resolveToolcraftExportFrame(state, null);
  if (finiteFrame.ok) return finiteFrame;

  if (sceneExport.boundsRequired && !sceneExport.boundsProvider) {
    return unavailableProductBounds(
      "This infinite product scene does not provide export bounds.",
    );
  }

  let productRects: unknown = [];
  try {
    productRects = sceneExport.boundsProvider?.({ state, timeRange }) ?? [];
  } catch {
    return unavailableProductBounds("Product scene bounds could not be resolved.");
  }
  const bounds = resolveToolcraftSceneBounds(
    state,
    productRects,
    sceneExport.visibility,
  );
  return resolveToolcraftExportFrame(state, bounds);
}

function clampFooterActionProgress(progress: number): number {
  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.max(0, Math.min(1, progress));
}

function getActionCommand(action: ToolcraftActionSchema): ToolcraftActionCommand | null {
  if (action.command) {
    return action.command;
  }

  switch (action.value.toLowerCase()) {
    case "apply":
      return "controls.apply";
    case "reset":
      return "controls.reset";
    default:
      return null;
  }
}

export function useControlsPanelActions({
  dispatch,
  getState,
  onPanelAction,
  sceneExport = defaultSceneExport,
}: {
  dispatch: React.Dispatch<ToolcraftCommand>;
  getState: () => ToolcraftState;
  onPanelAction?: ToolcraftPanelActionHandler;
  sceneExport?: ToolcraftControlsSceneExport;
}): {
  panelActionFeedback: ToolcraftPanelActionFeedback | null;
  runAction: ActionControlRunAction;
  stickyFooterActive: boolean;
  stickyFooterProgress: number | null;
} {
  const rendererPipeline = useToolcraftPipeline();
  const modelRenderHost = useOptionalToolcraftModelRenderHost();
  const sourceAssetCoordinator = useToolcraftSourceAssetCoordinator();
  const nextActionIdRef = React.useRef(0);
  const latestActionIdRef = React.useRef(-1);
  const [panelActionFeedback, setPanelActionFeedback] =
    React.useState<ToolcraftPanelActionFeedback | null>(null);
  const nextFooterActionIdRef = React.useRef(0);
  const [footerActionProgressEntries, setFooterActionProgressEntries] =
    React.useState<readonly FooterActionProgressEntry[]>([]);
  const stickyFooterProgress = React.useMemo(() => {
    for (let index = footerActionProgressEntries.length - 1; index >= 0; index -= 1) {
      const progress = footerActionProgressEntries[index]?.progress;

      if (typeof progress === "number") {
        return progress;
      }
    }

    return null;
  }, [footerActionProgressEntries]);

  function createFooterActionProgressTracker(
    reportFeedback: (feedback: ToolcraftPanelActionFeedback) => void,
  ): {
    reportProgress: (progress: number) => void;
    trackResult: (result: PromiseLike<unknown> | void) => void;
  } {
    const id = nextFooterActionIdRef.current;
    nextFooterActionIdRef.current += 1;

    let latestProgress: number | null = null;
    let isTracked = false;

    function reportProgress(progress: number): void {
      latestProgress = clampFooterActionProgress(progress);

      if (!isTracked) {
        return;
      }

      setFooterActionProgressEntries((entries) =>
        entries.map((entry) =>
          entry.id === id ? { ...entry, progress: latestProgress } : entry,
        ),
      );
    }

    function trackResult(result: PromiseLike<unknown> | void): void {
      if (!isPromiseLike(result)) {
        return;
      }

      isTracked = true;
      setFooterActionProgressEntries((entries) => [
        ...entries,
        { id, progress: latestProgress },
      ]);

      void Promise.resolve(result)
        .catch((error: unknown) => {
          if (error instanceof ToolcraftSceneExportError) {
            reportFeedback(error.feedback);
          } else {
            console.error("Toolcraft panel action failed.", error);
          }
        })
        .finally(() => {
          setFooterActionProgressEntries((entries) =>
            entries.filter((entry) => entry.id !== id),
          );
        });
    }

    return { reportProgress, trackResult };
  }

  function runAction(
    action: ToolcraftActionSchema,
    options: { trackFooterPending?: boolean } = {},
  ): void {
    const actionId = nextActionIdRef.current;
    nextActionIdRef.current += 1;
    latestActionIdRef.current = actionId;
    setPanelActionFeedback(null);
    const reportFeedback = (feedback: ToolcraftPanelActionFeedback): void => {
      if (latestActionIdRef.current === actionId) {
        setPanelActionFeedback(feedback);
      }
    };
    const command = action.command ?? (onPanelAction ? null : getActionCommand(action));

    if (command) {
      dispatch({ type: command });
      return;
    }

    const footerActionProgressTracker = options.trackFooterPending
      ? createFooterActionProgressTracker(reportFeedback)
      : null;
    const actionState = getState();
    let result: PromiseLike<unknown> | void;
    try {
      result = onPanelAction?.({
        action,
        dispatch,
        renderRuntimeSceneToCanvas: (canvas, frame) =>
          renderToolcraftRuntimeSceneToCanvas({
            canvas,
            canvasFrame: getToolcraftCanvasFrame(actionState.canvas),
            exportFrame: frame,
            host: modelRenderHost,
            resolveImageResource: sourceAssetCoordinator.resolveResource,
            state: actionState,
            visibility: sceneExport.visibility,
          }),
        reportFeedback,
        reportProgress:
          footerActionProgressTracker?.reportProgress ?? noopReportProgress,
        renderModelsToCanvas: (canvas) =>
          renderToolcraftModelsToCanvas(modelRenderHost, actionState, canvas),
        resolveSceneExportFrame: (resolveOptions) =>
          resolveActionSceneExportFrame(
            sceneExport,
            actionState,
            resolveOptions?.timeRange,
          ),
        rendererPipeline,
        state: actionState,
      });
    } catch (error) {
      if (error instanceof ToolcraftSceneExportError) {
        reportFeedback(error.feedback);
        result = undefined;
      } else {
        throw error;
      }
    }

    footerActionProgressTracker?.trackResult(result);
  }

  return {
    panelActionFeedback,
    runAction,
    stickyFooterActive: footerActionProgressEntries.length > 0,
    stickyFooterProgress,
  };
}
