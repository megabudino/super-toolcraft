import type { ToolcraftPanelActionHandler } from "@/toolcraft/runtime/react";
import { ToolcraftApp } from "@/toolcraft/runtime/react";

import { appSchema } from "../app/app-schema";
import {
  createMosaicRandomValues,
  exportMosaicImage,
  exportMosaicVideo,
  KineticMosaicRenderer,
} from "../app/kinetic-mosaic-renderer";

const handlePanelAction: ToolcraftPanelActionHandler = ({
  action,
  dispatch,
  reportProgress,
  state,
}) => {
  if (action.value === "export-png") {
    reportProgress(0.1);
    return exportMosaicImage(state).then((blob) => {
      reportProgress(blob.size > 0 ? 1 : 0);
      return blob;
    });
  }

  if (action.value === "export-video") {
    return exportMosaicVideo(state, reportProgress);
  }

  if (action.value === "randomize-look" || action.value === "randomize-colors") {
    const kind = action.value === "randomize-look" ? "look" : "colors";
    const label = kind === "look" ? "Randomize look" : "Randomize colors";
    const values = createMosaicRandomValues(kind);
    const targets = Object.keys(values).sort(
      (first, second) =>
        Number(first === "palette.preset") - Number(second === "palette.preset") ||
        first.localeCompare(second),
    );

    for (const target of targets) {
      dispatch({
        label,
        target,
        type: "controls.setValue",
        value: values[target],
      });
    }
  }
};

export function AppHome(): React.JSX.Element {
  return (
    <ToolcraftApp
      canvasContent={<KineticMosaicRenderer />}
      className="h-dvh min-h-dvh"
      onPanelAction={handlePanelAction}
      renderDefaultCanvasMedia={false}
      schema={appSchema}
    />
  );
}
