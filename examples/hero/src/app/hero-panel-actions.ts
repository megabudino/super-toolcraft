import type { ToolcraftPanelActionHandler } from "@/toolcraft/runtime/react";

export const handleHeroPanelAction: ToolcraftPanelActionHandler = ({ action, dispatch }) => {
  if (action.value === "website.reset") {
    dispatch({ type: "controls.reset" });
  }
};
