import type {
  ToolcraftAppComposition,
  ToolcraftPanelActionHandler,
} from "@/toolcraft/runtime/react";

import { appSchema } from "./app-schema";
import { DonutCanvas } from "./donut/donut-canvas";
import { exportDonutImage } from "./donut/donut-export";
import {
  donutPipelinePasses,
  rendererPipelineRegistration,
} from "./donut/donut-pipeline";
import {
  DONUT_PRESET_CUSTOM,
  DONUT_PRESET_TARGET,
  type DonutPreset,
} from "./donut/donut-presets";
import {
  DONUT_FACTORY_PRESET_LIBRARY,
  DONUT_PRESET_LIBRARY_TARGET,
  DONUT_PRESET_RESET_ACTION,
  findDonutLibraryPreset,
  parseDonutPresetLibrary,
  resetDonutLibraryPreset,
  serializeDonutPresetLibrary,
} from "./donut/donut-preset-library";

function applyDonutPreset(
  dispatch: Parameters<ToolcraftPanelActionHandler>[0]["dispatch"],
  preset: DonutPreset,
): void {
  for (const [target, value] of Object.entries(preset.values)) {
    dispatch({
      history: "merge",
      label: `Apply ${preset.label} preset`,
      target,
      type: "controls.setValue",
      value,
    });
  }
}

const onPanelAction: ToolcraftPanelActionHandler = ({
  action,
  dispatch,
  rendererPipeline,
  reportFeedback,
  reportProgress,
  resolveSceneExportFrame,
  state,
}) => {
  if (action.value === "icing.clear.base") {
    dispatch({
      label: "Clear icing base",
      target: "icing.clearMode",
      type: "controls.setValue",
      value: "base",
    });
    return;
  }
  if (action.value === "icing.clear.detail") {
    dispatch({
      label: "Clear icing detail",
      target: "icing.clearMode",
      type: "controls.setValue",
      value: "detail",
    });
    return;
  }
  if (action.value === "sprinkles.clear") {
    dispatch({
      label: "Clear sprinkles",
      target: "sprinkles.clear",
      type: "controls.setValue",
      value: true,
    });
    return;
  }

  if (action.value === DONUT_PRESET_RESET_ACTION) {
    const selectedPresetId = state.values[DONUT_PRESET_TARGET];
    if (
      typeof selectedPresetId !== "string" ||
      selectedPresetId === DONUT_PRESET_CUSTOM
    ) {
      reportFeedback({
        code: "preset-selection-required",
        message: "Choose a named flavor before resetting it.",
      });
      return;
    }

    const parsed = parseDonutPresetLibrary(
      state.values[DONUT_PRESET_LIBRARY_TARGET],
      DONUT_FACTORY_PRESET_LIBRARY,
    );
    if (!parsed.ok) {
      reportFeedback(parsed);
      return;
    }
    const nextLibrary = resetDonutLibraryPreset(
      parsed.library,
      selectedPresetId,
    );
    const selectedPreset = findDonutLibraryPreset(
      nextLibrary,
      selectedPresetId,
    );
    if (!selectedPreset) {
      reportFeedback({
        code: "preset-selection-invalid",
        message: "The selected flavor is not present in the preset library.",
      });
      return;
    }
    dispatch({
      history: "merge",
      label: `Reset ${selectedPreset.label} preset`,
      target: DONUT_PRESET_LIBRARY_TARGET,
      type: "controls.setValue",
      value: serializeDonutPresetLibrary(nextLibrary),
    });
    applyDonutPreset(dispatch, selectedPreset);
    return;
  }

  if (action.value !== "export.png") return;

  const frame = resolveSceneExportFrame();
  if (!frame.ok) {
    reportFeedback(frame);
    return;
  }
  const work = () =>
    exportDonutImage({ frame: frame.frame, reportProgress, state });
  return rendererPipeline
    ? rendererPipeline.runPass(
        donutPipelinePasses.imageExport,
        undefined,
        work,
      )
    : work();
};

export const appComposition: ToolcraftAppComposition = {
  canvasContent: <DonutCanvas />,
  onPanelAction,
  renderDefaultCanvasMedia: false,
  rendererPipelineRegistration,
  sceneBoundsProvider: () => [
    { height: 900, width: 1280, x: -640, y: -450 },
  ],
  schema: appSchema,
};
