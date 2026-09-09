import { ToolcraftApp } from "@/toolcraft/runtime/react";

import { appSchema } from "../app/app-schema";
import {
  EditorialPatternRenderer,
  handleEditorialPatternPanelAction,
} from "../app/editorial-pattern-renderer";

export function AppHome(): React.JSX.Element {
  return (
    <ToolcraftApp
      canvasContent={<EditorialPatternRenderer />}
      className="h-dvh min-h-dvh"
      onPanelAction={handleEditorialPatternPanelAction}
      renderDefaultCanvasMedia={false}
      schema={appSchema}
    />
  );
}
