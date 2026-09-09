import type { CreativeAppsKitCanvasSize, ResolvedCreativeAppsKitAppSchema } from "../schema/types";

export type CreativeAppsKitCommand =
  | {
      history?: CreativeAppsKitHistoryMode;
      historyGroup?: string;
      label?: string;
      target: string;
      type: "controls.setValue";
      value: unknown;
    }
  | { type: "controls.apply" }
  | { type: "controls.reset" }
  | { insertIndex?: number; layer?: CreativeAppsKitLayerDraft; type: "layers.add" }
  | { layerId: string; type: "layers.delete" }
  | { layerIds: string[]; parentGroupId: string | null; type: "layers.moveToGroup" }
  | { layerId: string; type: "layers.select" }
  | { layerId: string; name: string; type: "layers.rename" }
  | { layerId: string; type: "layers.toggleCollapsed" }
  | { layerId: string; type: "layers.toggleVisibility" }
  | { layers: CreativeAppsKitLayer[]; selectedLayerId?: string | null; type: "layers.reorder" }
  | { delta: CreativeAppsKitPoint; type: "canvas.panBy" }
  | { offset: CreativeAppsKitPoint; type: "canvas.setOffset" }
  | { size: CreativeAppsKitCanvasSize; type: "canvas.setSize" }
  | { type: "canvas.center" }
  | { type: "canvas.zoomIn" }
  | { type: "canvas.zoomOut" }
  | { type: "canvas.zoomReset" }
  | { offset: CreativeAppsKitPoint; type: "canvas.setViewport"; zoom: number }
  | {
      offset: CreativeAppsKitPanelState["offset"];
      panelId: CreativeAppsKitPanelId;
      type: "panels.setOffset";
    }
  | { panelId: CreativeAppsKitPanelId; type: "panels.resetOffset" }
  | {
      asset: Omit<CreativeAppsKitMediaAsset, "id" | "layerId"> & {
        id?: string;
        layerId?: string;
        layerName?: string;
      };
      type: "media.import";
    }
  | { mediaId: string; type: "media.delete" }
  | { currentTimeSeconds: number; type: "timeline.setCurrentTime" }
  | { durationSeconds: number; type: "timeline.setDuration" }
  | { expanded: boolean; type: "timeline.setExpanded" }
  | { isPlaying: boolean; type: "timeline.setPlaying" }
  | { type: "timeline.toggleExpanded" }
  | { type: "timeline.togglePlayback" }
  | { type: "timeline.toggleLoop" }
  | { keyframeId: string | null; type: "timeline.selectKeyframe" }
  | { keyframeId: string; type: "timeline.deleteKeyframe" }
  | { controlId: string; type: "timeline.deleteControlKeyframes" }
  | {
      controlId: string;
      controlLabel: string;
      timeSeconds?: number;
      type: "timeline.toggleControlKeyframes";
      value: unknown;
      valueLabel: string;
    }
  | {
      controlId: string;
      controlLabel: string;
      timeSeconds?: number;
      type: "timeline.upsertControlKeyframe";
      value: unknown;
      valueLabel: string;
    }
  | { keyframeId: string; timeSeconds: number; type: "timeline.moveKeyframe" }
  | {
      easing: CreativeAppsKitTimelineKeyframeEasing;
      keyframeId: string;
      type: "timeline.changeKeyframeEasing";
    }
  | { type: "history.undo" }
  | { type: "history.redo" };

export const creativeAppsKitRuntimeCommandTypes = [
  "controls.setValue",
  "controls.apply",
  "controls.reset",
  "layers.add",
  "layers.delete",
  "layers.moveToGroup",
  "layers.select",
  "layers.rename",
  "layers.toggleCollapsed",
  "layers.toggleVisibility",
  "layers.reorder",
  "canvas.panBy",
  "canvas.setOffset",
  "canvas.setSize",
  "canvas.center",
  "canvas.zoomIn",
  "canvas.zoomOut",
  "canvas.zoomReset",
  "canvas.setViewport",
  "panels.setOffset",
  "panels.resetOffset",
  "media.import",
  "media.delete",
  "timeline.setCurrentTime",
  "timeline.setDuration",
  "timeline.setExpanded",
  "timeline.setPlaying",
  "timeline.toggleExpanded",
  "timeline.togglePlayback",
  "timeline.toggleLoop",
  "timeline.selectKeyframe",
  "timeline.deleteKeyframe",
  "timeline.deleteControlKeyframes",
  "timeline.toggleControlKeyframes",
  "timeline.upsertControlKeyframe",
  "timeline.moveKeyframe",
  "timeline.changeKeyframeEasing",
  "history.undo",
  "history.redo",
] as const satisfies readonly CreativeAppsKitCommand["type"][];

export type CreativeAppsKitPoint = {
  x: number;
  y: number;
};

export type CreativeAppsKitCanvasState = {
  offset: CreativeAppsKitPoint;
  size: CreativeAppsKitCanvasSize;
  zoom: number;
};

export type CreativeAppsKitLayerKind = "group" | "layer";

export type CreativeAppsKitLayer = {
  collapsed?: boolean;
  displayName?: string;
  id: string;
  kind?: CreativeAppsKitLayerKind;
  name: string;
  parentGroupId?: string;
  visible: boolean;
};

export type CreativeAppsKitLayerDraft = {
  collapsed?: boolean;
  displayName?: string;
  id?: string;
  kind?: CreativeAppsKitLayerKind;
  name?: string;
  parentGroupId?: string;
  visible?: boolean;
};

export type CreativeAppsKitMediaAsset = {
  dataUrl: string;
  fileName: string;
  id: string;
  layerId: string;
  mimeType: string;
  position: CreativeAppsKitPoint;
  size: CreativeAppsKitCanvasSize;
};

export type CreativeAppsKitHistoryPatch = {
  after: Record<string, unknown>;
  before: Record<string, unknown>;
  group?: string;
  label: string;
};

export type CreativeAppsKitHistoryMode = "merge" | "record" | "skip";

export type CreativeAppsKitTimelineBezierControlPoints = [number, number, number, number];

export type CreativeAppsKitTimelineKeyframeEasing =
  | {
      controlPoints: CreativeAppsKitTimelineBezierControlPoints;
      type: "bezier";
    }
  | {
      type: "step";
    };

export type CreativeAppsKitTimelineKeyframe = {
  controlId: string;
  controlLabel: string;
  easing?: CreativeAppsKitTimelineKeyframeEasing;
  id: string;
  timeSeconds: number;
  value?: unknown;
  valueLabel: string;
};

export type CreativeAppsKitTimelineKeyframeGroup = {
  controlId: string;
  keyframes: CreativeAppsKitTimelineKeyframe[];
  label: string;
};

export type CreativeAppsKitTimelineState = {
  currentTimeSeconds: number;
  durationSeconds: number;
  expanded: boolean;
  isLooping: boolean;
  isPlaying: boolean;
  keyframeGroups: CreativeAppsKitTimelineKeyframeGroup[];
  selectedKeyframeId: string | null;
};

export type CreativeAppsKitPanelId = "controls" | "layers" | "timeline" | "toolbar";

export type CreativeAppsKitPanelState = {
  collapsed?: boolean;
  offset: { x: number; y: number };
};

export type CreativeAppsKitState = {
  canvas: CreativeAppsKitCanvasState;
  defaults: Record<string, unknown>;
  history: {
    redo: CreativeAppsKitHistoryPatch[];
    undo: CreativeAppsKitHistoryPatch[];
  };
  layers: CreativeAppsKitLayer[];
  mediaAssets: CreativeAppsKitMediaAsset[];
  panels: Record<CreativeAppsKitPanelId, CreativeAppsKitPanelState>;
  schema: ResolvedCreativeAppsKitAppSchema;
  selectedLayerId: string | null;
  timeline: CreativeAppsKitTimelineState;
  values: Record<string, unknown>;
};

export type CreativeAppsKitInitialState = {
  canvas?: Partial<CreativeAppsKitCanvasState>;
  layers?: CreativeAppsKitLayer[];
  mediaAssets?: CreativeAppsKitMediaAsset[];
  panels?: Partial<Record<CreativeAppsKitPanelId, Partial<CreativeAppsKitPanelState>>>;
  selectedLayerId?: string | null;
  timeline?: Partial<CreativeAppsKitTimelineState>;
  values?: Record<string, unknown>;
};
