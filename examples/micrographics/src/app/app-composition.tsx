import * as React from "react";

import type {
  ToolcraftAppComposition,
  ToolcraftPanelActionContext,
} from "@/toolcraft/runtime/react";
import {
  useToolcraftDispatch,
  useToolcraftValue,
} from "@/toolcraft/runtime/react";

import styles from "./app-composition.module.css";
import { appSchema } from "./app-schema";
import { defaultMicrographicsValues } from "./default-settings";
import { MicrographicsCanvas } from "./micrographics-canvas";
import { handleMicrographicsPanelAction as handleMicrographicsBasePanelAction } from "./poster-export";
import { rendererPipelineRegistration } from "./renderer-pipeline";
import { normalizeCoverPresetId } from "./template-covers";
import { micrographicsControlRenderers } from "./template-library-control";

function preventNativeProductDrag(
  event: React.DragEvent<HTMLDivElement>,
): void {
  event.preventDefault();
  event.stopPropagation();
}

async function handleMicrographicsPanelAction(
  context: ToolcraftPanelActionContext,
): Promise<void> {
  if (context.action.value === "reset-layout") {
    context.dispatch({
      history: "record",
      label: "Reset authored layout",
      target: "composition.layout",
      type: "controls.setValue",
      value: defaultMicrographicsValues["composition.layout"],
    });
    return;
  }

  await handleMicrographicsBasePanelAction(context);
}

function MicrographicsProductCanvas(): React.JSX.Element {
  const dispatch = useToolcraftDispatch();
  const coverPresetValue = useToolcraftValue("source.preset");

  React.useEffect(() => {
    const normalizedValue = normalizeCoverPresetId(coverPresetValue);
    if (normalizedValue === coverPresetValue) {
      return;
    }
    dispatch({
      history: "skip",
      label: "Normalize cover preset",
      target: "source.preset",
      type: "controls.setValue",
      value: normalizedValue,
    });
  }, [coverPresetValue, dispatch]);

  return (
    <div
      className={styles.canvasInteractionBoundary}
      data-micrographics-interaction-boundary=""
      draggable={false}
      onDragStart={preventNativeProductDrag}
    >
      <MicrographicsCanvas />
    </div>
  );
}

export const appComposition: ToolcraftAppComposition = {
  canvasContent: <MicrographicsProductCanvas />,
  controlRenderers: micrographicsControlRenderers,
  modelPresentation: { mode: "runtime" },
  onPanelAction: handleMicrographicsPanelAction,
  renderDefaultCanvasMedia: false,
  rendererPipelineRegistration,
  schema: appSchema,
};
