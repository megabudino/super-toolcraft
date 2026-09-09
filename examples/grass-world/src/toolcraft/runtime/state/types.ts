import type {
  ToolcraftCanvasSize,
  ResolvedToolcraftAppSchema,
} from "../schema/types";
import type { ToolcraftModelAssetRecord } from "../model-import/model-import-types";

export type ToolcraftCommand =
  | {
      history?: ToolcraftHistoryMode;
      historyGroup?: string;
      label?: string;
      target: string;
      type: "controls.setValue";
      value: unknown;
    }
  | { type: "controls.apply" }
  | { type: "controls.reset" }
  | { label?: string; targets: string[]; type: "controls.resetTargets" }
  | { insertIndex?: number; layer?: ToolcraftLayerDraft; type: "layers.add" }
  | { layerId: string; type: "layers.delete" }
  | { layerIds: string[]; parentGroupId: string | null; type: "layers.moveToGroup" }
  | { layerId: string; type: "layers.select" }
  | { layerId: string; name: string; type: "layers.rename" }
  | { layerId: string; type: "layers.toggleCollapsed" }
  | { layerId: string; type: "layers.toggleVisibility" }
  | { layers: ToolcraftLayer[]; selectedLayerId?: string | null; type: "layers.reorder" }
  | { delta: ToolcraftPoint; type: "canvas.panBy" }
  | { offset: ToolcraftPoint; type: "canvas.setOffset" }
  | { size: ToolcraftCanvasSize; type: "canvas.setSize" }
  | { type: "canvas.center" }
  | { type: "canvas.zoomIn" }
  | { type: "canvas.zoomOut" }
  | { type: "canvas.zoomReset" }
  | { offset: ToolcraftPoint; type: "canvas.setViewport"; zoom: number }
  | {
      offset: ToolcraftPanelState["offset"];
      panelId: ToolcraftPanelId;
      type: "panels.setOffset";
    }
  | {
      hidden: boolean;
      panelId: ToolcraftPanelId;
      type: "panels.setHidden";
    }
  | { panelId: ToolcraftPanelId; type: "panels.resetOffset" }
  | {
      asset: ToolcraftMediaImportAsset;
      replaceExisting?: boolean;
      type: "media.import";
    }
  | {
      assets: readonly ToolcraftMediaAssetDraft[];
      replaceExisting?: boolean;
      type: "media.importBatch";
    }
  | {
      activeDocumentRef: string;
      analysis: ToolcraftModelAsset["analysis"];
      appliedRepairRecipeId: string;
      assetId: string;
      expectedActiveDocumentRef: string;
      expectedRepairPlanRef: string;
      expectedSourceBundleDigest: string;
      expectedTopologyProfile: ToolcraftModelAsset["topologyProfile"];
      repairedDocumentRef: string;
      type: "media.commitModelRepair";
    }
  | {
      asset: ToolcraftModelAsset;
      expectedSourceBundleDigest: string;
      expectedTopologyProfile: ToolcraftModelAsset["topologyProfile"];
      type: "media.hydrateModel";
    }
  | {
      asset: ToolcraftModelAsset;
      expectedPlaceholderRef: string;
      type: "media.hydrateDefaultModel";
    }
  | {
      assetId: string;
      expectedActiveDocumentRef: string;
      expectedSourceBundleDigest: string;
      feedback: ToolcraftModelAsset["lastRepairError"] | null;
      type: "media.setModelRepairError";
    }
  | { mediaId: string; type: "media.delete" }
  | { mediaIds: string[]; type: "media.reorder" }
  | {
      mediaId: string;
      operation: ToolcraftMediaTransformOperation;
      type: "media.transform";
    }
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
      easing: ToolcraftTimelineKeyframeEasing;
      keyframeId: string;
      type: "timeline.changeKeyframeEasing";
    }
  | { type: "history.undo" }
  | { type: "history.redo" };

export const toolcraftRuntimeCommandTypes = [
  "controls.setValue",
  "controls.apply",
  "controls.reset",
  "controls.resetTargets",
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
  "panels.setHidden",
  "panels.resetOffset",
  "media.import",
  "media.importBatch",
  "media.commitModelRepair",
  "media.hydrateDefaultModel",
  "media.hydrateModel",
  "media.setModelRepairError",
  "media.delete",
  "media.reorder",
  "media.transform",
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
] as const satisfies readonly ToolcraftCommand["type"][];

export type ToolcraftPoint = {
  x: number;
  y: number;
};

export type ToolcraftCanvasState = {
  offset: ToolcraftPoint;
  size: ToolcraftCanvasSize;
  zoom: number;
};

export type ToolcraftLayerKind = "group" | "layer";

export type ToolcraftLayer = {
  collapsed?: boolean;
  displayName?: string;
  id: string;
  kind?: ToolcraftLayerKind;
  name: string;
  parentGroupId?: string;
  visible: boolean;
};

export type ToolcraftLayerDraft = {
  collapsed?: boolean;
  displayName?: string;
  id?: string;
  kind?: ToolcraftLayerKind;
  name?: string;
  parentGroupId?: string;
  visible?: boolean;
};

export type ToolcraftMediaAssetBase<AssetKind extends "file" | "image" | "model"> = {
  assetKind: AssetKind;
  fileName: string;
  id: string;
  layerId: string;
  mimeType: string;
  sourceTarget?: string;
};

export type ToolcraftImageAsset = ToolcraftMediaAssetBase<"image"> & {
  dataUrl: string;
  position: ToolcraftPoint;
  size?: ToolcraftCanvasSize;
  transform?: ToolcraftMediaTransform;
};

export type ToolcraftFileAsset = ToolcraftMediaAssetBase<"file"> & {
  dataUrl: string;
  position: ToolcraftPoint;
};

export type ToolcraftModelAsset = ToolcraftMediaAssetBase<"model"> &
  ToolcraftModelAssetRecord;

export type ToolcraftMediaAsset =
  | ToolcraftFileAsset
  | ToolcraftImageAsset
  | ToolcraftModelAsset;

type ToolcraftMediaAssetDraftFor<Asset extends ToolcraftMediaAsset> = Omit<
  Asset,
  "id" | "layerId"
> & {
  id?: string;
  layerId?: string;
  layerName?: string;
};

export type ToolcraftFileAssetDraft =
  ToolcraftMediaAssetDraftFor<ToolcraftFileAsset>;

export type ToolcraftImageAssetDraft =
  ToolcraftMediaAssetDraftFor<ToolcraftImageAsset>;

export type ToolcraftModelAssetDraft =
  ToolcraftMediaAssetDraftFor<ToolcraftModelAsset>;

export type ToolcraftMediaAssetDraft =
  | ToolcraftFileAssetDraft
  | ToolcraftImageAssetDraft
  | ToolcraftModelAssetDraft;

export type ToolcraftLegacyImageAsset = Omit<ToolcraftImageAsset, "assetKind"> & {
  assetKind?: "image";
};

export type ToolcraftLegacyImageAssetDraft = Omit<
  ToolcraftImageAssetDraft,
  "assetKind"
> & {
  assetKind?: "image";
};

export type ToolcraftMediaImportAsset =
  | ToolcraftLegacyImageAssetDraft
  | ToolcraftMediaAssetDraft;

export type ToolcraftInitialMediaAsset =
  | ToolcraftLegacyImageAsset
  | ToolcraftMediaAsset;

export type ToolcraftMediaTransform = {
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  rotationDeg?: 0 | 90 | 180 | 270;
};

export type ToolcraftMediaTransformOperation =
  | "flip-horizontal"
  | "flip-vertical"
  | "rotate-left"
  | "rotate-right";

export type ToolcraftHistoryPatch = {
  after: Record<string, unknown>;
  before: Record<string, unknown>;
  group?: string;
  label: string;
};

export type ToolcraftHistoryMode = "merge" | "record" | "skip";

export type ToolcraftTimelineBezierControlPoints = [number, number, number, number];

export type ToolcraftTimelineKeyframeEasing =
  | {
      controlPoints: ToolcraftTimelineBezierControlPoints;
      type: "bezier";
    }
  | {
      type: "step";
    };

export type ToolcraftTimelineKeyframe = {
  controlId: string;
  controlLabel: string;
  easing?: ToolcraftTimelineKeyframeEasing;
  id: string;
  timeSeconds: number;
  value?: unknown;
  valueLabel: string;
};

export type ToolcraftTimelineKeyframeGroup = {
  controlId: string;
  keyframes: ToolcraftTimelineKeyframe[];
  label: string;
};

export type ToolcraftTimelineState = {
  currentTimeSeconds: number;
  durationSeconds: number;
  expanded: boolean;
  isLooping: boolean;
  isPlaying: boolean;
  keyframeGroups: ToolcraftTimelineKeyframeGroup[];
  selectedKeyframeId: string | null;
};

export type ToolcraftPanelId = "controls" | "layers" | "timeline" | "toolbar";

export type ToolcraftPanelState = {
  collapsed?: boolean;
  extended?: boolean;
  hidden?: boolean;
  offset: { x: number; y: number };
};

export type ToolcraftState = {
  canvas: ToolcraftCanvasState;
  defaults: Record<string, unknown>;
  history: {
    redo: ToolcraftHistoryPatch[];
    undo: ToolcraftHistoryPatch[];
  };
  layers: ToolcraftLayer[];
  mediaAssets: ToolcraftMediaAsset[];
  panels: Record<ToolcraftPanelId, ToolcraftPanelState>;
  schema: ResolvedToolcraftAppSchema;
  selectedLayerId: string | null;
  timeline: ToolcraftTimelineState;
  values: Record<string, unknown>;
};

export type ToolcraftInitialState = {
  canvas?: Partial<ToolcraftCanvasState>;
  layers?: ToolcraftLayer[];
  mediaAssets?: ToolcraftInitialMediaAsset[];
  panels?: Partial<Record<ToolcraftPanelId, Partial<ToolcraftPanelState>>>;
  selectedLayerId?: string | null;
  timeline?: Partial<ToolcraftTimelineState>;
  values?: Record<string, unknown>;
};
