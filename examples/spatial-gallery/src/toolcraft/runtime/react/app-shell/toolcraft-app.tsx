"use client";

import * as React from "react";

import type { ResolvedToolcraftAppSchema } from "../../schema/types";
import type { AnyToolcraftRendererPipelineRegistration } from "../../rendering";
import type { ToolcraftState } from "../../state/types";
import { CanvasShell } from "../canvas/canvas-shell";
import {
  ControlsPanel,
  type ToolcraftPanelActionHandler,
} from "../controls-panel/controls-panel";
import type { ToolcraftControlRendererMap } from "../controls-panel/control-renderers";
import { ToolcraftRoot } from "./toolcraft-root";
import { LayersPanel } from "../layers/layers-panel";
import { useToolcraftModelRenderPreparationStatus } from "../model-rendering/model-render-provider";
import { TimelinePanel } from "../timeline/timeline-panel";
import { ToolbarPanel } from "./toolbar-panel";
import { useToolcraftCommittedSelector } from "./toolcraft-selectors";
import type { ToolcraftModelPresentationMode } from "../model-rendering/model-render-binding";

export type ToolcraftAppComposition = {
  canvasContent?: React.ReactNode;
  controlRenderers?: ToolcraftControlRendererMap;
  modelPresentation?: ToolcraftModelPresentationMode;
  onPanelAction?: ToolcraftPanelActionHandler;
  renderDefaultCanvasMedia?: boolean;
  rendererPipelineRegistration?: AnyToolcraftRendererPipelineRegistration;
  schema: ResolvedToolcraftAppSchema;
};

export type ToolcraftAppProps = ToolcraftAppComposition & {
  className?: string;
  style?: React.CSSProperties;
};

const toolcraftMinAppWidthPx = 1024;

const selectAppSurfaces = (state: ToolcraftState) =>
  state.schema.assembly.surfaces;
const selectTimelinePanelHidden = (state: ToolcraftState) =>
  state.panels.timeline.hidden === true;
const selectTimelinePanelExtended = (state: ToolcraftState) =>
  state.panels.timeline.extended === true;

function cn(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

function ToolcraftAppContent({
  canvasContent,
  className,
  controlRenderers,
  onPanelAction,
  renderDefaultCanvasMedia = true,
  style,
}: Omit<ToolcraftAppProps, "rendererPipelineRegistration" | "schema">): React.JSX.Element {
  const surfaces = useToolcraftCommittedSelector(selectAppSurfaces);
  const timelinePanelHidden = useToolcraftCommittedSelector(
    selectTimelinePanelHidden,
  );
  const timelinePanelVariant =
    useToolcraftCommittedSelector(selectTimelinePanelExtended)
      ? "extended"
      : "compact";
  const modelRendererStatus = useToolcraftModelRenderPreparationStatus();

  return (
    <div
      className={cn(
        "relative min-h-[640px] w-full overflow-hidden bg-[color:var(--background)]",
        className,
      )}
      data-slot="toolcraft-runtime-app"
      data-toolcraft-model-renderer-status={modelRendererStatus}
      style={{
        ...style,
        minWidth: toolcraftMinAppWidthPx,
      }}
    >
      {surfaces.canvas.enabled ? (
        <CanvasShell renderDefaultMedia={renderDefaultCanvasMedia}>
          {canvasContent}
        </CanvasShell>
      ) : null}
      {surfaces.panels.layers?.enabled ? (
        <LayersPanel panelPlacement="floating" />
      ) : null}
      {surfaces.panels.controls?.enabled ? (
        <ControlsPanel
          controlRenderers={controlRenderers}
          onPanelAction={onPanelAction}
          panelPlacement="floating"
        />
      ) : null}
      {surfaces.panels.timeline?.enabled ? (
        <div
          data-toolcraft-timeline-panel-hidden={timelinePanelHidden ? "true" : undefined}
          data-toolcraft-timeline-panel-variant={timelinePanelVariant}
          hidden={timelinePanelHidden}
        >
          <TimelinePanel panelPlacement="floating" variant={timelinePanelVariant} />
        </div>
      ) : null}
      {surfaces.panels.toolbar.enabled ? (
        <ToolbarPanel panelPlacement="floating" />
      ) : null}
    </div>
  );
}

export function ToolcraftApp({
  modelPresentation,
  rendererPipelineRegistration,
  schema,
  ...props
}: ToolcraftAppProps): React.JSX.Element {
  return (
    <ToolcraftRoot
      modelPresentation={modelPresentation}
      rendererPipelineRegistration={rendererPipelineRegistration}
      schema={schema}
    >
      <ToolcraftAppContent {...props} />
    </ToolcraftRoot>
  );
}
