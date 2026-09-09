import { ToolcraftApp } from "@/toolcraft/runtime/react";

import { appSchema } from "../app/app-schema";
import { DitherRenderer, exportDitherImage } from "../app/dither-renderer";

export function AppHome(): React.JSX.Element {
  return (
    <ToolcraftApp
      canvasContent={<DitherRenderer />}
      className="h-dvh min-h-dvh"
      onPanelAction={({ action, reportProgress, state }) => {
        if (action.value === "export-png") {
          return exportDitherImage(state, reportProgress);
        }

        return undefined;
      }}
      renderDefaultCanvasMedia={false}
      schema={appSchema}
    />
  );
}
