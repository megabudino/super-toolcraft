import * as React from "react";
import type { ToolcraftCommand } from "@/toolcraft/runtime";

import {
  readMeshPointLayout,
  type MeshPointLayout,
} from "./mesh-model";
import {
  getMeshPreset,
  getMeshTopologySignature,
  MESH_CUSTOM_PRESET_ID,
} from "./mesh-presets";

type MeshPresetDispatch = (command: ToolcraftCommand) => void;

function dispatchPresetValue(
  dispatch: MeshPresetDispatch,
  target: string,
  value: unknown,
): void {
  dispatch({
    history: "skip",
    label: "Apply mesh preset",
    target,
    type: "controls.setValue",
    value,
  });
}

function withoutPresetTransition(layout: MeshPointLayout): MeshPointLayout {
  const { presetTransition: _transition, ...nextLayout } = layout;
  return nextLayout;
}

export function useMeshPresetSelection({
  colors,
  columns,
  dispatch,
  layout,
  presetValue,
}: {
  colors: readonly string[];
  columns: number;
  dispatch: MeshPresetDispatch;
  layout: MeshPointLayout;
  presetValue: unknown;
}): void {
  const presetId =
    typeof presetValue === "string" ? presetValue : MESH_CUSTOM_PRESET_ID;
  const currentSignature = getMeshTopologySignature({ colors, columns, layout });
  const currentRef = React.useRef({ colors, columns, layout });
  const pendingSignatureRef = React.useRef<string | null>(null);
  const previousPresetRef = React.useRef(presetId);
  currentRef.current = { colors, columns, layout };

  React.useEffect(() => {
    const current = currentRef.current;
    const previousPreset = previousPresetRef.current;
    const transition = current.layout.presetTransition;

    if (
      presetId !== previousPreset &&
      transition?.fromPreset === presetId &&
      transition.toPreset === previousPreset
    ) {
      const previousColors = [...transition.previous.colors];
      const previousColumns = transition.previous.columns;
      const previousLayout = readMeshPointLayout(
        transition.previous.layoutValue,
        previousColors.length,
        previousColumns,
      );
      pendingSignatureRef.current = getMeshTopologySignature({
        colors: previousColors,
        columns: previousColumns,
        layout: previousLayout,
      });
      previousPresetRef.current = presetId;
      dispatchPresetValue(dispatch, "mesh.colors", previousColors);
      dispatchPresetValue(dispatch, "mesh.columns", previousColumns);
      dispatchPresetValue(dispatch, "mesh.points", previousLayout);
      return;
    }

    const preset = getMeshPreset(presetId);
    if (!preset) {
      pendingSignatureRef.current = null;
      previousPresetRef.current = presetId;
      if (transition) {
        dispatchPresetValue(
          dispatch,
          "mesh.points",
          withoutPresetTransition(current.layout),
        );
      }
      return;
    }

    const presetSignature = getMeshTopologySignature(preset);
    if (currentSignature === presetSignature) {
      pendingSignatureRef.current = null;
      previousPresetRef.current = presetId;
      return;
    }

    if (
      previousPreset === presetId &&
      pendingSignatureRef.current === presetSignature
    ) {
      return;
    }

    if (previousPreset !== presetId) {
      const previousLayout = withoutPresetTransition(current.layout);
      const nextLayout: MeshPointLayout = {
        ...preset.layout,
        presetTransition: {
          fromPreset: previousPreset,
          previous: {
            colors: [...current.colors],
            columns: current.columns,
            layoutValue: previousLayout,
          },
          toPreset: presetId,
        },
      };
      pendingSignatureRef.current = presetSignature;
      previousPresetRef.current = presetId;
      dispatchPresetValue(dispatch, "mesh.colors", preset.colors);
      dispatchPresetValue(dispatch, "mesh.columns", preset.columns);
      dispatchPresetValue(dispatch, "mesh.points", nextLayout);
      return;
    }

    pendingSignatureRef.current = null;
    previousPresetRef.current = MESH_CUSTOM_PRESET_ID;
    dispatchPresetValue(dispatch, "mesh.preset", MESH_CUSTOM_PRESET_ID);
    if (transition) {
      dispatchPresetValue(
        dispatch,
        "mesh.points",
        withoutPresetTransition(current.layout),
      );
    }
  }, [currentSignature, dispatch, presetId]);
}
