import * as React from "react";
import { createPortal } from "react-dom";
import {
  getToolcraftTimelineLoopProgress,
  shouldIncludeToolcraftPreviewBackground,
  type ToolcraftState,
} from "@/toolcraft/runtime";
import {
  useToolcraftDispatch,
  useToolcraftPipeline,
  useToolcraftSelector,
} from "@/toolcraft/runtime/react";

import {
  createMeshFrameSignature,
  createMeshGlResource,
  disposeMeshGlResource,
  renderMeshGlFrame,
} from "./mesh-webgl";
import {
  readColorHex,
  readMeshColors,
  readMeshPointLayout,
  readMeshTopologySnapshot,
  isInsertedMeshPoint,
  MESH_MAX_COLUMNS,
  type MeshPointLayout,
  type MeshGlResource,
} from "./mesh-model";
import { reconcileMeshCollectionTopology } from "./mesh-collection-topology";
import { MeshEditorOverlay } from "./mesh-editor-overlay";
import {
  createMeshPointCommand,
  insertMeshColumn,
  insertMeshRow,
  toggleMeshPointHandleMode,
} from "./mesh-point-interaction";
import { setActiveMeshPreviewResource } from "./mesh-export";
import {
  meshHandlesPass,
  meshPreviewPass,
  meshWebGlResourcePass,
} from "./renderer-pipeline";
import {
  useMeshHandleDrag,
  useMeshMarqueeSelection,
  useMeshPointDrag,
} from "./use-mesh-point-drag";
import { useMeshPresetSelection } from "./use-mesh-preset-selection";
import styles from "./mesh-gradient.module.css";

const selectMeshCanvasState = (state: ToolcraftState) => ({
  canvasSize: state.canvas.size,
  canvasZoom: state.canvas.zoom,
  durationSeconds: state.timeline.durationSeconds,
  isPlaying: state.timeline.isPlaying,
  state,
  timeSeconds: state.timeline.currentTimeSeconds,
});

export function MeshGradientCanvas(): React.JSX.Element {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const didApplyInitialPause = React.useRef(false);
  const dispatch = useToolcraftDispatch();
  const pipeline = useToolcraftPipeline();
  const selection = useToolcraftSelector(selectMeshCanvasState);
  const [resource, setResource] = React.useState<MeshGlResource | null>(null);
  const [editorHost, setEditorHost] = React.useState<HTMLElement | null>(null);
  const [isDraggingMesh, setIsDraggingMesh] = React.useState(false);
  const [previewPixels, setPreviewPixels] = React.useState({ height: 1, width: 1 });
  const values = selection.state.values;
  const colors = readMeshColors(values["mesh.colors"]);
  const columns = Math.max(
    2,
    Math.min(MESH_MAX_COLUMNS, Number(values["mesh.columns"] ?? 3)),
  );
  const layout = readMeshPointLayout(values["mesh.points"], colors.length, columns);
  useMeshPresetSelection({
    colors,
    columns,
    dispatch,
    layout,
    presetValue: values["mesh.preset"],
  });
  const editing = values["mesh.editing"] !== false;
  const guides = values["mesh.guides"] !== false;
  const pinEdges = values["mesh.pinEdges"] === true;
  const includeBackground = shouldIncludeToolcraftPreviewBackground({ state: selection.state });
  const renderScale = Math.max(1, Number(values["canvas.renderScale"] ?? 1));
  const previewTessellation = isDraggingMesh ? 16 : 64;
  const progress = getToolcraftTimelineLoopProgress({
    currentTimeSeconds: selection.timeSeconds,
    durationSeconds: selection.durationSeconds,
  });
  const frameSignature = createMeshFrameSignature(selection.state, progress);
  const previewFrameSignature = `${frameSignature}|preview:${previewPixels.width}x${previewPixels.height}|tessellation:${previewTessellation}`;
  const handlesSignature = `${colors.join(",")}|${JSON.stringify(layout)}|${columns}|${editing}|${guides}`;

  React.useLayoutEffect(() => {
    if (didApplyInitialPause.current) return;
    didApplyInitialPause.current = true;
    if (selection.isPlaying && selection.timeSeconds === 0) {
      dispatch({ isPlaying: false, type: "timeline.setPlaying" });
    }
  }, [dispatch, selection.isPlaying, selection.timeSeconds]);

  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updatePreviewPixels = () => {
      const next = {
        height: Math.max(1, Math.round(canvas.clientHeight * renderScale)),
        width: Math.max(1, Math.round(canvas.clientWidth * renderScale)),
      };
      setPreviewPixels((current) =>
        current.height === next.height && current.width === next.width ? current : next,
      );
    };

    updatePreviewPixels();
    const observer = new ResizeObserver(updatePreviewPixels);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [renderScale]);

  React.useLayoutEffect(() => {
    setEditorHost(
      canvasRef.current?.closest<HTMLElement>("[data-toolcraft-canvas-world]") ?? null,
    );
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let active = true;

    const create = () => createMeshGlResource(canvas);
    if (!pipeline) {
      const fallback = create();
      setResource(fallback);
      return () => disposeMeshGlResource(fallback);
    }

    void pipeline
      .runPass(meshWebGlResourcePass, { "canvas.element": canvas }, (context) =>
        context.getOrCreateResource([canvas], create, disposeMeshGlResource),
      )
      .then((nextResource) => {
        if (active) setResource(nextResource);
      });

    return () => {
      active = false;
    };
  }, [pipeline]);

  React.useEffect(() => {
    if (!resource) return;
    setActiveMeshPreviewResource(resource);
    return () => setActiveMeshPreviewResource(null);
  }, [resource]);

  React.useEffect(() => {
    if (!resource) return;
    const render = () => {
      renderMeshGlFrame({
        height: previewPixels.height,
        includeBackground,
        progress,
        resource,
        state: selection.state,
        tessellation: previewTessellation,
        width: previewPixels.width,
      });
    };

    if (!pipeline) {
      render();
      return;
    }

    void pipeline.runPass(
      meshPreviewPass,
      undefined,
      render,
    );
  }, [includeBackground, pipeline, previewFrameSignature, previewPixels, previewTessellation, progress, resource, selection.state]);

  React.useEffect(() => {
    if (!pipeline) return;
    void pipeline.runPass(
      meshHandlesPass,
      undefined,
      () => undefined,
    );
  }, [handlesSignature, pipeline]);

  const getCanvasBounds = React.useCallback(
    () => canvasRef.current?.getBoundingClientRect(),
    [],
  );
  const beginDrag = useMeshPointDrag({
    columns,
    count: colors.length,
    dispatch,
    getBounds: getCanvasBounds,
    layoutValue: values["mesh.points"],
    onDraggingChange: setIsDraggingMesh,
    pinEdges,
  });
  const beginHandleDrag = useMeshHandleDrag({
    columns,
    count: colors.length,
    dispatch,
    getBounds: getCanvasBounds,
    layoutValue: values["mesh.points"],
    onDraggingChange: setIsDraggingMesh,
  });
  const { marquee, onBackgroundPointerDown } = useMeshMarqueeSelection({
    columns,
    count: colors.length,
    dispatch,
    getBounds: getCanvasBounds,
    layoutValue: values["mesh.points"],
    pinEdges,
  });
  const uiScale = 100 / Math.max(1, selection.canvasZoom);

  React.useEffect(() => {
    const reconciliation = reconcileMeshCollectionTopology({
      colors,
      columns,
      layoutValue: values["mesh.points"],
    });
    if (!reconciliation) return;

    if (reconciliation.columns !== columns) {
      dispatch({
        history: "skip",
        label: reconciliation.label,
        target: "mesh.columns",
        type: "controls.setValue",
        value: reconciliation.columns,
      });
    }

    dispatch(
      createMeshPointCommand({
        label: reconciliation.label,
        layout: reconciliation.layout,
        record: false,
      }),
    );
  }, [colors, columns, dispatch, values]);

  React.useEffect(() => {
    const snapshot = readMeshTopologySnapshot(values["mesh.points"]);
    if (!snapshot) return;

    let isTopologyPending = false;
    if (
      snapshot.colors.length !== colors.length ||
      snapshot.colors.some((color, index) => color !== colors[index])
    ) {
      isTopologyPending = true;
      dispatch({
        history: "skip",
        label: "Restore mesh topology colors",
        target: "mesh.colors",
        type: "controls.setValue",
        value: snapshot.colors,
      });
    }
    if (snapshot.columns !== columns) {
      isTopologyPending = true;
      dispatch({
        history: "skip",
        label: "Restore mesh topology columns",
        target: "mesh.columns",
        type: "controls.setValue",
        value: snapshot.columns,
      });
    }
    if (isTopologyPending) return;

    const { topologySnapshot: _snapshot, ...pointLayout } = values[
      "mesh.points"
    ] as MeshPointLayout;
    dispatch({
      history: "skip",
      label: "Complete mesh topology change",
      target: "mesh.points",
      type: "controls.setValue",
      value: pointLayout,
    });
  }, [colors, columns, dispatch, values]);

  const commitMeshTopology = React.useCallback(
    ({
      colors: nextColors,
      columns: nextColumns,
      label,
      layout: nextLayout,
    }: {
      colors: readonly string[];
      columns: number;
      label: string;
      layout: MeshPointLayout;
    }) => {
      const revision = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      dispatch(
        createMeshPointCommand({
          layout: {
            ...layout,
            topologySnapshot: {
              colors: [...colors],
              columns,
              revision: `${revision}-before`,
            },
          },
          record: false,
        }),
      );
      dispatch(
        createMeshPointCommand({
          label,
          layout: {
            ...nextLayout,
            topologySnapshot: {
              colors: [...nextColors],
              columns: nextColumns,
              revision: `${revision}-after`,
            },
          },
          record: true,
        }),
      );
    },
    [colors, columns, dispatch, layout],
  );

  const toggleSelectedHandleMode = React.useCallback(
    (index: number) => {
      const next = toggleMeshPointHandleMode({
        columns,
        count: colors.length,
        index,
        layoutValue: values["mesh.points"],
      });
      dispatch(
        createMeshPointCommand({
          label: next.handles[index]?.type === "smooth" ? "Mirror mesh handles" : "Free mesh handles",
          layout: next,
          record: true,
        }),
      );
    },
    [colors.length, columns, dispatch, values],
  );

  const insertMeshDivider = React.useCallback(
    ({
      axis,
      column,
      row,
      t,
    }: {
      axis: "horizontal" | "vertical";
      column: number;
      row: number;
      t: number;
    }) => {
      const insertion =
        axis === "horizontal"
          ? insertMeshColumn({
              colors,
              column,
              columns,
              layoutValue: values["mesh.points"],
              t,
            })
          : insertMeshRow({
              colors,
              columns,
              layoutValue: values["mesh.points"],
              row,
              t,
            });
      if (!insertion) return;

      const label =
        insertion.kind === "column" ? "Insert mesh column" : "Insert mesh row";
      commitMeshTopology({
        colors: insertion.colors,
        columns: insertion.columns,
        label,
        layout: insertion.layout,
      });
    },
    [colors, columns, commitMeshTopology, values],
  );

  React.useEffect(() => {
    if (!editing) return;

    const handleDelete = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || target.closest("input, textarea, select, [contenteditable='true']"))
      ) {
        return;
      }

      const selectedIndex =
        layout.selectedIndices.length === 1 ? layout.selectedIndices[0]! : -1;
      if (!isInsertedMeshPoint(layout, selectedIndex)) return;

      event.preventDefault();
      dispatch({
        label: "Remove mesh point",
        target: "mesh.colors",
        type: "controls.setValue",
        value: colors.filter((_, index) => index !== selectedIndex),
      });
    };

    window.addEventListener("keydown", handleDelete);
    return () => window.removeEventListener("keydown", handleDelete);
  }, [colors, dispatch, editing, layout]);

  const editorOverlay = editing ? (
    <div
      className={styles.canvasEditorPortal}
      data-mesh-editor-portal="true"
      data-mesh-selected-count={layout.selectedIndices.length}
      style={{
        height: selection.canvasSize.height,
        width: selection.canvasSize.width,
      }}
    >
      <MeshEditorOverlay
        canvasHeight={selection.canvasSize.height}
        canvasWidth={selection.canvasSize.width}
        colors={colors}
        columns={columns}
        guides={guides}
        layout={layout}
        marquee={marquee}
        onBackgroundPointerDown={onBackgroundPointerDown}
        onHandlePointerDown={beginHandleDrag}
        onGridSegmentDoubleClick={insertMeshDivider}
        onPointDoubleClick={(event, index) => {
          event.preventDefault();
          event.stopPropagation();
          toggleSelectedHandleMode(index);
        }}
        onPointPointerDown={beginDrag}
        pinEdges={pinEdges}
        uiScale={uiScale}
      />
    </div>
  ) : null;

  return (
    <>
      <div
        className={styles.canvasRoot}
        data-mesh-gradient-root="true"
        data-mesh-preset={String(values["mesh.preset"] ?? "custom")}
      >
        <div
          className={styles.canvasBackground}
          data-mesh-gradient-background="true"
          style={{
            backgroundColor: includeBackground
              ? readColorHex(values["appearance.background"])
              : "transparent",
          }}
        />
        <canvas
          aria-label="Animated mesh gradient output"
          className={styles.canvas}
          data-mesh-frame-signature={frameSignature}
          data-mesh-gradient-canvas="true"
          data-mesh-tessellation={previewTessellation}
          ref={canvasRef}
        />
      </div>
      {editorHost && editorOverlay ? createPortal(editorOverlay, editorHost) : null}
    </>
  );
}
