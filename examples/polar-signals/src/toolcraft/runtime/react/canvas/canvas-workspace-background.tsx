"use client";

import { useToolcraftCommittedSelector } from "../app-shell/toolcraft-selectors";
import { CanvasDotPattern, FieldDescription } from "@/toolcraft/ui";
import { toolcraftCanvasWorkspaceBackgroundTarget } from "../../schema/runtime-targets";
import { useToolcraftValue } from "../app-shell/use-toolcraft";
import { useCanvasViewportTransform } from "./canvas-viewport-world";
import { documentWorkspaceDotColor } from "../../modules/built-ins/external-site/workspace-appearance";

function WorkspaceDots({ color }: { color?: string }): React.JSX.Element {
  const { offsetX, offsetY, zoom } = useCanvasViewportTransform();
  return <CanvasDotPattern color={color} offset={{ x: offsetX, y: offsetY }} scale={zoom / 100} />;
}

export function CanvasWorkspaceBackground(): React.JSX.Element | null {
  const measurement = useToolcraftCommittedSelector((state) => state.documentViewport);
  const color = useToolcraftValue("canvas.workspaceColor");
  const mode = useToolcraftValue(toolcraftCanvasWorkspaceBackgroundTarget);
  if (measurement) {
    const background = typeof color === "string" ? color : "#D4D4D4";
    return (
      <>
        <div
          data-toolcraft-workspace-color=""
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: background }}
        />
        {mode === "dots" ? <WorkspaceDots color={documentWorkspaceDotColor(background)} /> : null}
        <div
          data-document-viewport-status={measurement?.status}
          className="pointer-events-none absolute bottom-4 left-4 z-40 max-w-sm"
        >
          {measurement?.error ? (
            <FieldDescription role="status">{measurement.error}</FieldDescription>
          ) : null}
        </div>
      </>
    );
  }
  return mode === "dots" ? <WorkspaceDots /> : null;
}
