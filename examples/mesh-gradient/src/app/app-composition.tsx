import type { ToolcraftPanelActionHandler } from "@/toolcraft/runtime/react";
import type { ToolcraftAppComposition } from "@/toolcraft/runtime/react";

import { appSchema } from "./app-schema";
import { MeshGradientCanvas } from "./mesh-gradient/mesh-canvas";
import { MeshColorPointsControl } from "./mesh-gradient/mesh-color-points-control";
import {
  exportMeshImage,
  exportMeshSvg,
  exportMeshVideo,
} from "./mesh-gradient/mesh-export";
import {
  createGridPoints,
  createMeshPointLayout,
  createShuffledPointLayout,
  MESH_MAX_COLUMNS,
  readMeshColors,
} from "./mesh-gradient/mesh-model";
import {
  meshExportPass,
  meshRendererPipelineRegistration,
} from "./mesh-gradient/renderer-pipeline";

const onPanelAction: ToolcraftPanelActionHandler = ({
  action,
  dispatch,
  rendererPipeline,
  reportProgress,
  state,
}) => {
  const value = action.value;
  const colors = readMeshColors(state.values["mesh.colors"]);
  const columns = Math.max(
    2,
    Math.min(MESH_MAX_COLUMNS, Number(state.values["mesh.columns"] ?? 3)),
  );

  if (value === "mesh.reflow") {
    dispatch({
      label: "Reflow mesh points",
      target: "mesh.points",
      type: "controls.setValue",
      value: createMeshPointLayout(createGridPoints(colors.length, columns), columns),
    });
    return;
  }

  if (value === "mesh.shuffle") {
    dispatch({
      label: "Shuffle mesh points",
      target: "mesh.points",
      type: "controls.setValue",
      value: createShuffledPointLayout(colors.length, columns, Date.now() / 1000),
    });
    return;
  }

  const runExport = () => {
    if (value === "export.png") return exportMeshImage(state, reportProgress);
    if (value === "export.svg") return exportMeshSvg(state, reportProgress);
    if (value === "export.video") return exportMeshVideo(state, reportProgress);
    return Promise.resolve();
  };

  return rendererPipeline
    ? rendererPipeline.runPass(meshExportPass, undefined, runExport)
    : runExport();
};

export const appComposition = {
  canvasContent: <MeshGradientCanvas />,
  controlRenderers: { meshColorPoints: MeshColorPointsControl },
  onPanelAction,
  renderDefaultCanvasMedia: false,
  rendererPipelineRegistration: meshRendererPipelineRegistration,
  schema: appSchema,
} satisfies ToolcraftAppComposition;
