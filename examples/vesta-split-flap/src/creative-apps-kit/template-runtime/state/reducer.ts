import { getCreativeAppsKitCanvasSizeTargetDimension } from "../schema/runtime-targets";
import {
  clampCreativeAppsKitCanvasZoom,
  creativeAppsKitCanvasZoomDefault,
  creativeAppsKitCanvasZoomStep,
} from "./canvas-zoom";
import { getMediaReadyTimelineState } from "./timeline-readiness";
import type {
  CreativeAppsKitCommand,
  CreativeAppsKitHistoryPatch,
  CreativeAppsKitHistoryMode,
  CreativeAppsKitLayer,
  CreativeAppsKitLayerDraft,
  CreativeAppsKitState,
  CreativeAppsKitTimelineKeyframe,
  CreativeAppsKitTimelineKeyframeGroup,
} from "./types";

const minTimelineDurationSeconds = 1;
const maxTimelineDurationSeconds = 60;

function asCanvasSizeDimension(value: unknown): number | null {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.NaN;

  if (!Number.isFinite(numberValue)) {
    return null;
  }

  return Math.max(1, Math.round(numberValue));
}

function getResetCanvasSize(
  state: CreativeAppsKitState,
): CreativeAppsKitState["canvas"]["size"] | null {
  const width = asCanvasSizeDimension(state.defaults["canvas.size.width"]);
  const height = asCanvasSizeDimension(state.defaults["canvas.size.height"]);

  if (width === null && height === null) {
    return null;
  }

  return {
    ...state.canvas.size,
    height: height ?? state.canvas.size.height,
    width: width ?? state.canvas.size.width,
  };
}

function clampTimelineDuration(value: number): number {
  if (!Number.isFinite(value)) {
    return minTimelineDurationSeconds;
  }

  return Math.max(minTimelineDurationSeconds, Math.min(maxTimelineDurationSeconds, value));
}

function clampTimelineTime(value: number, durationSeconds: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(durationSeconds, value));
}

function formatTimelineSeconds(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function getRoundedTimelineKeyframeTime(value: number): number {
  return Math.round(value * 100) / 100;
}

function getTimelineKeyframeId(controlId: string, timeSeconds: number): string {
  return `${controlId}::${formatTimelineSeconds(timeSeconds)}`;
}

function createTimelineControlKeyframe({
  controlId,
  controlLabel,
  state,
  timeSeconds,
  value,
  valueLabel,
}: {
  controlId: string;
  controlLabel: string;
  state: CreativeAppsKitState;
  timeSeconds?: number;
  value: unknown;
  valueLabel: string;
}): CreativeAppsKitTimelineKeyframe {
  const resolvedTimeSeconds = getRoundedTimelineKeyframeTime(
    clampTimelineTime(
      timeSeconds ?? state.timeline.currentTimeSeconds,
      state.timeline.durationSeconds,
    ),
  );

  return {
    controlId,
    controlLabel,
    id: getTimelineKeyframeId(controlId, resolvedTimeSeconds),
    timeSeconds: resolvedTimeSeconds,
    value,
    valueLabel,
  };
}

function upsertTimelineControlKeyframeGroup({
  controlId,
  controlLabel,
  keyframe,
  keyframeGroups,
}: {
  controlId: string;
  controlLabel: string;
  keyframe: CreativeAppsKitTimelineKeyframe;
  keyframeGroups: readonly CreativeAppsKitTimelineKeyframeGroup[];
}): CreativeAppsKitTimelineKeyframeGroup[] {
  const existingGroup = keyframeGroups.find((group) => group.controlId === controlId);
  const nextKeyframes = [
    ...(existingGroup?.keyframes.filter((item) => item.id !== keyframe.id) ?? []),
    keyframe,
  ].sort(
    (firstKeyframe, secondKeyframe) => firstKeyframe.timeSeconds - secondKeyframe.timeSeconds,
  );
  const nextGroup: CreativeAppsKitTimelineKeyframeGroup = {
    controlId,
    keyframes: nextKeyframes,
    label: existingGroup?.label ?? controlLabel,
  };

  if (!existingGroup) {
    return [...keyframeGroups, nextGroup];
  }

  return keyframeGroups.map((group) => (group.controlId === controlId ? nextGroup : group));
}

function commitPatch(
  state: CreativeAppsKitState,
  patch: CreativeAppsKitHistoryPatch,
  values: Record<string, unknown>,
  historyOptions?: CreativeAppsKitHistoryOptions,
): CreativeAppsKitState {
  return {
    ...state,
    history: getNextHistoryState(state, patch, historyOptions),
    values,
  };
}

function commitStatePatch(
  state: CreativeAppsKitState,
  patch: CreativeAppsKitHistoryPatch,
  historyOptions?: CreativeAppsKitHistoryOptions,
): CreativeAppsKitState {
  const next = applyHistoryPatch(state, patch.after);

  return {
    ...state,
    canvas: next.canvas,
    history: getNextHistoryState(state, patch, historyOptions),
    layers: next.layers,
    mediaAssets: next.mediaAssets,
    selectedLayerId: next.selectedLayerId,
    timeline: next.timeline,
    values: next.values,
  };
}

type CreativeAppsKitHistoryOptions = {
  group?: string;
  mode?: CreativeAppsKitHistoryMode;
};

function getNextHistoryState(
  state: CreativeAppsKitState,
  patch: CreativeAppsKitHistoryPatch,
  options?: CreativeAppsKitHistoryOptions,
): CreativeAppsKitState["history"] {
  const mode = options?.mode ?? "record";

  if (mode === "skip") {
    return state.history;
  }

  const group = mode === "merge" ? options?.group : undefined;

  if (group) {
    const previousPatch = state.history.undo.at(-1);

    if (previousPatch?.group === group) {
      return {
        redo: [],
        undo: [
          ...state.history.undo.slice(0, -1),
          {
            ...previousPatch,
            after: patch.after,
            label: patch.label,
          },
        ],
      };
    }
  }

  return {
    redo: [],
    undo: [...state.history.undo, group ? { ...patch, group } : patch],
  };
}

function applyValuePatch(
  values: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const nextValues = { ...values };

  for (const [target, value] of Object.entries(patch)) {
    if (target in nextValues) {
      nextValues[target] = value;
    }
  }

  return nextValues;
}

function applyHistoryPatch(
  state: CreativeAppsKitState,
  patch: Record<string, unknown>,
): Pick<
  CreativeAppsKitState,
  "canvas" | "layers" | "mediaAssets" | "selectedLayerId" | "timeline" | "values"
> {
  const nextCanvas =
    "canvas.size" in patch
      ? {
          ...state.canvas,
          size: patch["canvas.size"] as CreativeAppsKitState["canvas"]["size"],
        }
      : state.canvas;

  return {
    canvas: nextCanvas,
    layers: "layers" in patch ? (patch.layers as CreativeAppsKitState["layers"]) : state.layers,
    mediaAssets:
      "mediaAssets" in patch
        ? (patch.mediaAssets as CreativeAppsKitState["mediaAssets"])
        : state.mediaAssets,
    selectedLayerId:
      "selectedLayerId" in patch
        ? (patch.selectedLayerId as CreativeAppsKitState["selectedLayerId"])
        : state.selectedLayerId,
    timeline:
      "timeline" in patch ? (patch.timeline as CreativeAppsKitState["timeline"]) : state.timeline,
    values: applyValuePatch(state.values, patch),
  };
}

function getNextMediaId(state: CreativeAppsKitState): string {
  const existingIds = new Set(state.mediaAssets.map((asset) => asset.id));
  let index = state.mediaAssets.length + 1;

  while (existingIds.has(`media-${index}`)) {
    index += 1;
  }

  return `media-${index}`;
}

function getNextLayerId(state: CreativeAppsKitState): string {
  const existingIds = new Set(state.layers.map((layer) => layer.id));
  let index = state.layers.length + 1;

  while (existingIds.has(`layer-${index}`)) {
    index += 1;
  }

  return `layer-${index}`;
}

function getSingleLayerImportId(state: CreativeAppsKitState): string | undefined {
  return state.schema.panels.layers ? undefined : state.layers.find((layer) => layer.kind !== "group")?.id;
}

function getSingleMediaImportId(state: CreativeAppsKitState): string | undefined {
  return state.schema.panels.layers ? undefined : state.mediaAssets[0]?.id;
}

function getImportedLayerName(fileName: string): string {
  const name = fileName.replace(/\.[^.]+$/, "").trim();

  return name || "Material";
}

function getNextLayerName(
  layers: readonly CreativeAppsKitLayer[],
  prefix: "Group" | "Layer",
): string {
  const nextIndex =
    layers.reduce((highestIndex, layer) => {
      const label = layer.displayName ?? layer.name;
      const match = new RegExp(`^${prefix} (\\d+)$`).exec(label);
      const currentIndex = Number(match?.[1] ?? 0);

      return Math.max(highestIndex, currentIndex);
    }, 0) + 1;

  return `${prefix} ${nextIndex}`;
}

function createLayer(
  state: CreativeAppsKitState,
  draft: CreativeAppsKitLayerDraft | undefined,
): CreativeAppsKitLayer {
  const kind = draft?.kind ?? "layer";
  const name =
    draft?.name ??
    draft?.displayName ??
    getNextLayerName(state.layers, kind === "group" ? "Group" : "Layer");

  return {
    collapsed: kind === "group" ? (draft?.collapsed ?? false) : draft?.collapsed,
    displayName: draft?.displayName ?? name,
    id: draft?.id ?? getNextLayerId(state),
    kind,
    name,
    parentGroupId: draft?.parentGroupId,
    visible: draft?.visible ?? true,
  };
}

function clampInsertIndex(length: number, insertIndex: number | undefined): number {
  return Math.max(0, Math.min(length, insertIndex ?? length));
}

function getLayerBlockIds(
  layers: readonly CreativeAppsKitLayer[],
  layerId: string,
): Set<string> {
  const blockIds = new Set<string>([layerId]);
  let changed = true;

  while (changed) {
    changed = false;

    for (const layer of layers) {
      if (layer.parentGroupId && blockIds.has(layer.parentGroupId) && !blockIds.has(layer.id)) {
        blockIds.add(layer.id);
        changed = true;
      }
    }
  }

  return blockIds;
}

function canMoveLayerToParent(
  layers: readonly CreativeAppsKitLayer[],
  layerId: string,
  parentGroupId: string | null,
): boolean {
  if (!parentGroupId) {
    return true;
  }

  if (layerId === parentGroupId) {
    return false;
  }

  const parent = layers.find((layer) => layer.id === parentGroupId);

  if (!parent || parent.kind !== "group") {
    return false;
  }

  return !getLayerBlockIds(layers, layerId).has(parentGroupId);
}

function mapTimelineKeyframeGroups(
  keyframeGroups: readonly CreativeAppsKitTimelineKeyframeGroup[],
  keyframeId: string,
  updateKeyframe: (
    keyframe: CreativeAppsKitTimelineKeyframeGroup["keyframes"][number],
  ) => CreativeAppsKitTimelineKeyframeGroup["keyframes"][number],
): CreativeAppsKitTimelineKeyframeGroup[] {
  return keyframeGroups.map((group) => ({
    ...group,
    keyframes: group.keyframes.map((keyframe) =>
      keyframe.id === keyframeId ? updateKeyframe(keyframe) : keyframe,
    ),
  }));
}

export function creativeAppsKitReducer(
  state: CreativeAppsKitState,
  command: CreativeAppsKitCommand,
): CreativeAppsKitState {
  switch (command.type) {
    case "controls.setValue": {
      const canvasSizeDimension = getCreativeAppsKitCanvasSizeTargetDimension(command.target);

      if (canvasSizeDimension) {
        const dimensionValue = asCanvasSizeDimension(command.value);

        if (dimensionValue === null) {
          return state;
        }

        if (
          state.canvas.size[canvasSizeDimension] === dimensionValue &&
          state.values[command.target] === dimensionValue
        ) {
          return state;
        }

        const size = {
          ...state.canvas.size,
          [canvasSizeDimension]: dimensionValue,
        };

        return commitStatePatch(state, {
          after: {
            "canvas.size": size,
            [command.target]: dimensionValue,
          },
          before: {
            "canvas.size": state.canvas.size,
            [command.target]: state.values[command.target],
          },
          label: command.label ?? command.target,
        }, {
          group: command.historyGroup,
          mode: command.history,
        });
      }

      if (Object.is(state.values[command.target], command.value)) {
        return state;
      }

      return commitPatch(
        state,
        {
          after: { [command.target]: command.value },
          before: { [command.target]: state.values[command.target] },
          label: command.label ?? command.target,
        },
        { ...state.values, [command.target]: command.value },
        {
          group: command.historyGroup,
          mode: command.history,
        },
      );
    }

    case "controls.apply":
      return state;

    case "controls.reset": {
      const resetCanvasSize = getResetCanvasSize(state);

      if (resetCanvasSize) {
        return commitStatePatch(state, {
          after: {
            ...state.defaults,
            "canvas.size": resetCanvasSize,
          },
          before: {
            ...state.values,
            "canvas.size": state.canvas.size,
          },
          label: "Reset controls",
        });
      }

      return commitPatch(
        state,
        {
          after: { ...state.defaults },
          before: { ...state.values },
          label: "Reset controls",
        },
        { ...state.defaults },
      );
    }

    case "layers.add": {
      const layer = createLayer(state, command.layer);
      const insertIndex = clampInsertIndex(state.layers.length, command.insertIndex);
      const layers = [
        ...state.layers.slice(0, insertIndex),
        layer,
        ...state.layers.slice(insertIndex),
      ];

      return commitStatePatch(state, {
        after: {
          layers,
          selectedLayerId: layer.id,
        },
        before: {
          layers: state.layers,
          selectedLayerId: state.selectedLayerId,
        },
        label: layer.kind === "group" ? "Add group" : "Add layer",
      });
    }

    case "layers.delete": {
      if (!state.layers.some((layer) => layer.id === command.layerId)) {
        return state;
      }

      const deletedLayerIds = getLayerBlockIds(state.layers, command.layerId);
      const layers = state.layers.filter((layer) => !deletedLayerIds.has(layer.id));
      const mediaAssets = state.mediaAssets.filter((asset) => !deletedLayerIds.has(asset.layerId));
      const selectedLayerId = deletedLayerIds.has(state.selectedLayerId ?? "")
        ? (layers[0]?.id ?? null)
        : state.selectedLayerId;

      return commitStatePatch(state, {
        after: {
          layers,
          mediaAssets,
          selectedLayerId,
        },
        before: {
          layers: state.layers,
          mediaAssets: state.mediaAssets,
          selectedLayerId: state.selectedLayerId,
        },
        label: "Delete layer",
      });
    }

    case "layers.moveToGroup": {
      const movedRootLayerIds = new Set(
        command.layerIds.filter((layerId) =>
          canMoveLayerToParent(state.layers, layerId, command.parentGroupId),
        ),
      );

      if (movedRootLayerIds.size === 0) {
        return state;
      }

      const nextParentGroupId = command.parentGroupId ?? undefined;
      const movedBlockIds = new Set<string>();

      for (const layerId of movedRootLayerIds) {
        getLayerBlockIds(state.layers, layerId).forEach((blockLayerId) => {
          movedBlockIds.add(blockLayerId);
        });
      }

      const movingBlock = state.layers.filter((layer) => movedBlockIds.has(layer.id));
      const updatedMovingBlock = movingBlock.map((layer) =>
        movedRootLayerIds.has(layer.id) ? { ...layer, parentGroupId: nextParentGroupId } : layer,
      );
      const remainingLayers = state.layers.filter((layer) => !movedBlockIds.has(layer.id));
      const targetGroupIndex = command.parentGroupId
        ? remainingLayers.findIndex((layer) => layer.id === command.parentGroupId)
        : -1;
      const movedLayers = command.parentGroupId
        ? targetGroupIndex >= 0
          ? [
              ...remainingLayers.slice(0, targetGroupIndex + 1),
              ...updatedMovingBlock,
              ...remainingLayers.slice(targetGroupIndex + 1),
            ]
          : state.layers
        : state.layers.map((layer) =>
            movedRootLayerIds.has(layer.id) ? { ...layer, parentGroupId: nextParentGroupId } : layer,
          );
      const layers = command.parentGroupId
        ? movedLayers.map((layer) =>
            layer.id === command.parentGroupId && layer.kind === "group" && layer.collapsed
              ? { ...layer, collapsed: false }
              : layer,
          )
        : movedLayers;

      if (layers === state.layers) {
        return state;
      }

      if (
        layers.every(
          (layer, index) =>
            layer.id === state.layers[index]?.id &&
            layer.parentGroupId === state.layers[index]?.parentGroupId &&
            layer.collapsed === state.layers[index]?.collapsed,
        )
      ) {
        return state;
      }

      return commitStatePatch(state, {
        after: { layers },
        before: { layers: state.layers },
        label: command.parentGroupId ? "Move layers to group" : "Move layers to root",
      });
    }

    case "layers.select":
      if (!state.layers.some((layer) => layer.id === command.layerId)) {
        return state;
      }

      return {
        ...state,
        selectedLayerId: command.layerId,
      };

    case "layers.rename": {
      const name = command.name.trim();

      if (!name || !state.layers.some((layer) => layer.id === command.layerId)) {
        return state;
      }

      const layers = state.layers.map((layer) =>
        layer.id === command.layerId ? { ...layer, displayName: name } : layer,
      );

      return commitStatePatch(state, {
        after: { layers },
        before: { layers: state.layers },
        label: "Rename layer",
      });
    }

    case "layers.toggleCollapsed": {
      const targetLayer = state.layers.find((layer) => layer.id === command.layerId);

      if (!targetLayer || targetLayer.kind !== "group") {
        return state;
      }

      const layers = state.layers.map((layer) =>
        layer.id === command.layerId ? { ...layer, collapsed: !layer.collapsed } : layer,
      );

      return commitStatePatch(state, {
        after: { layers },
        before: { layers: state.layers },
        label: "Toggle group",
      });
    }

    case "layers.toggleVisibility": {
      if (!state.layers.some((layer) => layer.id === command.layerId)) {
        return state;
      }

      const layers = state.layers.map((layer) =>
        layer.id === command.layerId ? { ...layer, visible: !layer.visible } : layer,
      );

      return commitStatePatch(state, {
        after: { layers },
        before: { layers: state.layers },
        label: "Toggle layer visibility",
      });
    }

    case "layers.reorder": {
      const nextLayerIds = new Set(command.layers.map((layer) => layer.id));

      if (nextLayerIds.size !== command.layers.length || nextLayerIds.size !== state.layers.length) {
        return state;
      }

      if (!state.layers.every((layer) => nextLayerIds.has(layer.id))) {
        return state;
      }

      return commitStatePatch(state, {
        after: {
          layers: command.layers,
          selectedLayerId: command.selectedLayerId ?? state.selectedLayerId,
        },
        before: {
          layers: state.layers,
          selectedLayerId: state.selectedLayerId,
        },
        label: "Reorder layers",
      });
    }

    case "canvas.setOffset":
      return {
        ...state,
        canvas: {
          ...state.canvas,
          offset: command.offset,
        },
      };

    case "canvas.panBy":
      return {
        ...state,
        canvas: {
          ...state.canvas,
          offset: {
            x: state.canvas.offset.x + command.delta.x,
            y: state.canvas.offset.y + command.delta.y,
          },
        },
      };

    case "canvas.setSize":
      return {
        ...state,
        canvas: {
          ...state.canvas,
          size: command.size,
        },
        history: {
          redo: [],
          undo: [
            ...state.history.undo,
            {
              after: { "canvas.size": command.size },
              before: { "canvas.size": state.canvas.size },
              label: "Resize canvas",
            },
          ],
        },
      };

    case "canvas.center":
      return {
        ...state,
        canvas: {
          ...state.canvas,
          offset: { x: 0, y: 0 },
        },
      };

    case "canvas.zoomIn":
      return {
        ...state,
        canvas: {
          ...state.canvas,
          zoom: clampCreativeAppsKitCanvasZoom(state.canvas.zoom + creativeAppsKitCanvasZoomStep),
        },
      };

    case "canvas.zoomOut":
      return {
        ...state,
        canvas: {
          ...state.canvas,
          zoom: clampCreativeAppsKitCanvasZoom(state.canvas.zoom - creativeAppsKitCanvasZoomStep),
        },
      };

    case "canvas.zoomReset":
      return {
        ...state,
        canvas: {
          ...state.canvas,
          zoom: creativeAppsKitCanvasZoomDefault,
        },
      };

    case "canvas.setViewport":
      return {
        ...state,
        canvas: {
          ...state.canvas,
          offset: command.offset,
          zoom: clampCreativeAppsKitCanvasZoom(command.zoom),
        },
      };

    case "panels.setOffset":
      return {
        ...state,
        panels: {
          ...state.panels,
          [command.panelId]: {
            ...state.panels[command.panelId],
            offset: command.offset,
          },
        },
      };

    case "panels.resetOffset":
      return {
        ...state,
        panels: {
          ...state.panels,
          [command.panelId]: {
            ...state.panels[command.panelId],
            offset: { x: 0, y: 0 },
          },
        },
      };

    case "media.import": {
      const shouldReplaceSingleLayerMedia = !state.schema.panels.layers;
      const shouldResizeCanvas =
        state.schema.canvas.sizing.mode === "intrinsic-media";
      const layerId =
        command.asset.layerId ?? getSingleLayerImportId(state) ?? getNextLayerId(state);
      const mediaId =
        command.asset.id ?? getSingleMediaImportId(state) ?? getNextMediaId(state);
      const layer = {
        displayName: command.asset.layerName ?? getImportedLayerName(command.asset.fileName),
        id: layerId,
        kind: "layer" as const,
        name: command.asset.layerName ?? getImportedLayerName(command.asset.fileName),
        visible: true,
      };
      const mediaAsset = {
        dataUrl: command.asset.dataUrl,
        fileName: command.asset.fileName,
        id: mediaId,
        layerId,
        mimeType: command.asset.mimeType,
        position: shouldResizeCanvas ? { x: 0, y: 0 } : command.asset.position,
        size: command.asset.size,
      };
      const layers = shouldReplaceSingleLayerMedia ? [layer] : [...state.layers, layer];
      const mediaAssets = shouldReplaceSingleLayerMedia
        ? [mediaAsset]
        : [...state.mediaAssets, mediaAsset];
      const after = {
        ...(shouldResizeCanvas ? { "canvas.size": command.asset.size } : {}),
        layers,
        mediaAssets,
        selectedLayerId: layerId,
      };
      const before = {
        ...(shouldResizeCanvas ? { "canvas.size": state.canvas.size } : {}),
        layers: state.layers,
        mediaAssets: state.mediaAssets,
        selectedLayerId: state.selectedLayerId,
      };

      return commitStatePatch(state, {
        after,
        before,
        label: "Import media",
      });
    }

    case "media.delete": {
      if (!state.mediaAssets.some((asset) => asset.id === command.mediaId)) {
        return state;
      }

      const mediaAssets = state.mediaAssets.filter((asset) => asset.id !== command.mediaId);
      const timeline = getMediaReadyTimelineState(state.schema, state.timeline, mediaAssets);
      const shouldCommitTimeline = timeline !== state.timeline;

      return commitStatePatch(state, {
        after: {
          mediaAssets,
          ...(shouldCommitTimeline ? { timeline } : {}),
        },
        before: {
          mediaAssets: state.mediaAssets,
          ...(shouldCommitTimeline ? { timeline: state.timeline } : {}),
        },
        label: "Delete media",
      });
    }

    case "timeline.setCurrentTime": {
      return {
        ...state,
        timeline: {
          ...state.timeline,
          currentTimeSeconds: clampTimelineTime(
            command.currentTimeSeconds,
            state.timeline.durationSeconds,
          ),
        },
      };
    }

    case "timeline.setDuration": {
      const durationSeconds = clampTimelineDuration(command.durationSeconds);
      const timeline = {
        ...state.timeline,
        currentTimeSeconds: clampTimelineTime(state.timeline.currentTimeSeconds, durationSeconds),
        durationSeconds,
      };

      return commitStatePatch(state, {
        after: { timeline },
        before: { timeline: state.timeline },
        label: "Set timeline duration",
      });
    }

    case "timeline.setExpanded": {
      if (state.timeline.expanded === command.expanded) {
        return state;
      }

      return {
        ...state,
        timeline: {
          ...state.timeline,
          expanded: command.expanded,
        },
      };
    }

    case "timeline.toggleExpanded": {
      return {
        ...state,
        timeline: {
          ...state.timeline,
          expanded: !state.timeline.expanded,
        },
      };
    }

    case "timeline.setPlaying": {
      return {
        ...state,
        timeline: {
          ...state.timeline,
          isPlaying: command.isPlaying,
        },
      };
    }

    case "timeline.togglePlayback": {
      const shouldRestartPlayback =
        !state.timeline.isPlaying &&
        state.timeline.currentTimeSeconds >= state.timeline.durationSeconds;

      return {
        ...state,
        timeline: {
          ...state.timeline,
          currentTimeSeconds: shouldRestartPlayback ? 0 : state.timeline.currentTimeSeconds,
          isPlaying: !state.timeline.isPlaying,
        },
      };
    }

    case "timeline.toggleLoop": {
      return {
        ...state,
        timeline: {
          ...state.timeline,
          isLooping: !state.timeline.isLooping,
        },
      };
    }

    case "timeline.selectKeyframe": {
      return {
        ...state,
        timeline: {
          ...state.timeline,
          selectedKeyframeId: command.keyframeId,
        },
      };
    }

    case "timeline.deleteKeyframe": {
      if (
        !state.timeline.keyframeGroups.some((group) =>
          group.keyframes.some((keyframe) => keyframe.id === command.keyframeId),
        )
      ) {
        return state;
      }

      const timeline = {
        ...state.timeline,
        keyframeGroups: state.timeline.keyframeGroups
          .map((group) => ({
            ...group,
            keyframes: group.keyframes.filter((keyframe) => keyframe.id !== command.keyframeId),
          }))
          .filter((group) => group.keyframes.length > 0),
        selectedKeyframeId: null,
      };

      return commitStatePatch(state, {
        after: { timeline },
        before: { timeline: state.timeline },
        label: "Delete keyframe",
      });
    }

    case "timeline.deleteControlKeyframes": {
      if (!state.timeline.keyframeGroups.some((group) => group.controlId === command.controlId)) {
        return state;
      }

      const timeline = {
        ...state.timeline,
        keyframeGroups: state.timeline.keyframeGroups.filter(
          (group) => group.controlId !== command.controlId,
        ),
        selectedKeyframeId: null,
      };

      return commitStatePatch(state, {
        after: { timeline },
        before: { timeline: state.timeline },
        label: "Delete control keyframes",
      });
    }

    case "timeline.toggleControlKeyframes": {
      const existingGroup = state.timeline.keyframeGroups.find(
        (group) => group.controlId === command.controlId,
      );

      if (existingGroup) {
        const timeline = {
          ...state.timeline,
          expanded: true,
          keyframeGroups: state.timeline.keyframeGroups.filter(
            (group) => group.controlId !== command.controlId,
          ),
          selectedKeyframeId: null,
        };

        return commitStatePatch(state, {
          after: { timeline },
          before: { timeline: state.timeline },
          label: "Delete control keyframes",
        });
      }

      const keyframe = createTimelineControlKeyframe({
        controlId: command.controlId,
        controlLabel: command.controlLabel,
        state,
        timeSeconds: command.timeSeconds,
        value: command.value,
        valueLabel: command.valueLabel,
      });
      const timeline = {
        ...state.timeline,
        expanded: true,
        keyframeGroups: upsertTimelineControlKeyframeGroup({
          controlId: command.controlId,
          controlLabel: command.controlLabel,
          keyframe,
          keyframeGroups: state.timeline.keyframeGroups,
        }),
        selectedKeyframeId: keyframe.id,
      };

      return commitStatePatch(state, {
        after: { timeline },
        before: { timeline: state.timeline },
        label: "Add control keyframe",
      });
    }

    case "timeline.upsertControlKeyframe": {
      const keyframe = createTimelineControlKeyframe({
        controlId: command.controlId,
        controlLabel: command.controlLabel,
        state,
        timeSeconds: command.timeSeconds,
        value: command.value,
        valueLabel: command.valueLabel,
      });
      const timeline = {
        ...state.timeline,
        expanded: true,
        keyframeGroups: upsertTimelineControlKeyframeGroup({
          controlId: command.controlId,
          controlLabel: command.controlLabel,
          keyframe,
          keyframeGroups: state.timeline.keyframeGroups,
        }),
        selectedKeyframeId: keyframe.id,
      };

      return commitStatePatch(state, {
        after: { timeline },
        before: { timeline: state.timeline },
        label: "Set control keyframe",
      });
    }

    case "timeline.moveKeyframe": {
      const targetKeyframe = state.timeline.keyframeGroups
        .flatMap((group) => group.keyframes)
        .find((keyframe) => keyframe.id === command.keyframeId);

      if (!targetKeyframe) {
        return state;
      }

      const timeSeconds = getRoundedTimelineKeyframeTime(
        clampTimelineTime(command.timeSeconds, state.timeline.durationSeconds),
      );
      const nextKeyframeId = getTimelineKeyframeId(targetKeyframe.controlId, timeSeconds);
      const timeline = {
        ...state.timeline,
        keyframeGroups: mapTimelineKeyframeGroups(
          state.timeline.keyframeGroups,
          command.keyframeId,
          (keyframe) => ({
            ...keyframe,
            id: nextKeyframeId,
            timeSeconds,
          }),
        ),
        selectedKeyframeId: nextKeyframeId,
      };

      return commitStatePatch(state, {
        after: { timeline },
        before: { timeline: state.timeline },
        label: "Move keyframe",
      });
    }

    case "timeline.changeKeyframeEasing": {
      if (
        !state.timeline.keyframeGroups.some((group) =>
          group.keyframes.some((keyframe) => keyframe.id === command.keyframeId),
        )
      ) {
        return state;
      }

      const timeline = {
        ...state.timeline,
        keyframeGroups: mapTimelineKeyframeGroups(
          state.timeline.keyframeGroups,
          command.keyframeId,
          (keyframe) => ({
            ...keyframe,
            easing: command.easing,
          }),
        ),
      };

      return commitStatePatch(state, {
        after: { timeline },
        before: { timeline: state.timeline },
        label: "Change keyframe easing",
      });
    }

    case "history.undo": {
      const patch = state.history.undo.at(-1);

      if (!patch) {
        return state;
      }

      const next = applyHistoryPatch(state, patch.before);

      return {
        ...state,
        canvas: next.canvas,
        history: {
          redo: [...state.history.redo, patch],
          undo: state.history.undo.slice(0, -1),
        },
        layers: next.layers,
        mediaAssets: next.mediaAssets,
        selectedLayerId: next.selectedLayerId,
        timeline: next.timeline,
        values: next.values,
      };
    }

    case "history.redo": {
      const patch = state.history.redo.at(-1);

      if (!patch) {
        return state;
      }

      const next = applyHistoryPatch(state, patch.after);

      return {
        ...state,
        canvas: next.canvas,
        history: {
          redo: state.history.redo.slice(0, -1),
          undo: [...state.history.undo, patch],
        },
        layers: next.layers,
        mediaAssets: next.mediaAssets,
        selectedLayerId: next.selectedLayerId,
        timeline: next.timeline,
        values: next.values,
      };
    }
  }
}
