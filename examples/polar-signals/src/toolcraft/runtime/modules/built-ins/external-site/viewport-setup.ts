import { createWorkspaceBackgroundControl } from "../../../schema/workspace-background-control";
import { registerToolcraftInternalControlSection } from "../../../schema/controls-panel-section-id";
import { toolcraftRuntimeSetupSectionTitle } from "../../../schema/runtime-section-titles";
import type { ToolcraftCanvasSize, ToolcraftControlSectionSchema } from "../../../schema/types";
import { documentViewportDefaults, documentViewportTargets } from "./viewport-schema";

export function createDocumentSetupSection(
  size: ToolcraftCanvasSize,
): ToolcraftControlSectionSchema {
  const applicability = { mode: "always" as const };
  return registerToolcraftInternalControlSection({
    id: "runtime.setup",
    title: toolcraftRuntimeSetupSectionTitle,
    layout: "standalone",
    controls: {
      workspaceColor: {
        type: "color",
        label: "Background color",
        applicability,
        description: "Matches the website automatically until you choose a color. Reset Settings restores automatic matching. Does not change the website.",
        target: documentViewportTargets.background,
        defaultValue: documentViewportDefaults.background,
      },
      workspace: createWorkspaceBackgroundControl(),
      websiteWidth: {
        type: "text",
        label: "Website width",
        applicability,
        description:
          "Responsive viewport width in pixels. Changing it fits the full website height again.",
        target: documentViewportTargets.width,
        defaultValue: size.width,
      },
      websiteHeight: {
        type: "text",
        label: "Website height",
        applicability,
        description: "Viewport height in pixels, limited to the current website content height.",
        target: documentViewportTargets.height,
        defaultValue: size.height,
      },
      websitePage: {
        type: "select",
        optionsSource: "document-pages",
        label: "Page",
        target: documentViewportTargets.page,
        applicability,
      },
    },
    layoutGroups: [
      { columns: 2, controls: ["workspaceColor", "workspace"], layout: "inline" },
      { columns: 2, controls: ["websiteWidth", "websiteHeight"], layout: "inline" },
    ],
  });
}
