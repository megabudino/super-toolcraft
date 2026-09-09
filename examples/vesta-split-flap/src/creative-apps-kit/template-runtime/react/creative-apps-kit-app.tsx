"use client";

import * as React from "react";

import type { ResolvedCreativeAppsKitAppSchema } from "../schema/types";
import { CanvasShell } from "./canvas-shell";
import {
  ControlsPanel,
  type CreativeAppsKitPanelActionHandler,
} from "./controls-panel";
import type { CreativeAppsKitControlRendererMap } from "./control-renderers";
import { CreativeAppsKitRoot } from "./creative-apps-kit-root";
import { LayersPanel } from "./layers-panel";
import { TimelinePanel } from "./timeline-panel";
import { ToolbarPanel } from "./toolbar-panel";

export type CreativeAppsKitAppProps = {
  canvasContent?: React.ReactNode;
  className?: string;
  controlRenderers?: CreativeAppsKitControlRendererMap;
  onPanelAction?: CreativeAppsKitPanelActionHandler;
  renderDefaultCanvasMedia?: boolean;
  schema: ResolvedCreativeAppsKitAppSchema;
  style?: React.CSSProperties;
};

const creativeAppsKitMinAppWidthPx = 1024;

function cn(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

export function CreativeAppsKitApp({
  canvasContent,
  className,
  controlRenderers,
  onPanelAction,
  renderDefaultCanvasMedia = true,
  schema,
  style,
}: CreativeAppsKitAppProps): React.JSX.Element {
  const surfaces = schema.assembly.surfaces;

  return (
    <CreativeAppsKitRoot schema={schema}>
      <div
        className={cn(
          "relative min-h-[640px] w-full overflow-hidden bg-[color:var(--background)]",
          className,
        )}
        data-slot="creative-apps-kit-runtime-app"
        style={{
          ...style,
          minWidth: creativeAppsKitMinAppWidthPx,
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
          <TimelinePanel panelPlacement="floating" />
        ) : null}
        {surfaces.panels.toolbar.enabled ? (
          <ToolbarPanel panelPlacement="floating" />
        ) : null}
      </div>
    </CreativeAppsKitRoot>
  );
}
