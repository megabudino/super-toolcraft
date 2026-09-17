import { createToolcraftRuntimeSetupSection } from "./runtime-setup-section";
import { extractToolcraftRuntimeSetupBackground } from "./runtime-setup-background";
import { normalizeControlsPanelLayout } from "./controls-panel-normalization";
import { resolveToolcraftControlSectionId } from "./controls-panel-section-id";
import { resolveToolcraftTimelinePanel } from "./schema-resolvers";
import type {
  ResolvedToolcraftPanelsSchema,
  ResolvedToolcraftSettingsTransferSchema,
  ToolcraftPanelsSchema,
} from "./types";
import type { ResolvedToolcraftAppSchema } from "./resolved-app-schema";
export function normalizeToolcraftPanels({
  canvas,
  panels,
  settingsTransfer,
}: {
  canvas: ResolvedToolcraftAppSchema["canvas"];
  panels: ToolcraftPanelsSchema;
  settingsTransfer: ResolvedToolcraftSettingsTransferSchema;
}): ResolvedToolcraftPanelsSchema {
  const normalizedTimeline = resolveToolcraftTimelinePanel(panels.timeline);
  const normalizedPanels: ResolvedToolcraftPanelsSchema = {
    ...(panels.layers ? { layers: panels.layers } : {}),
    ...(normalizedTimeline ? { timeline: normalizedTimeline } : {}),
  };

  if (!panels.controls) {
    return normalizedPanels;
  }

  const controls = { ...panels.controls };
  const backgroundExtraction = extractToolcraftRuntimeSetupBackground({
    sections: controls.sections,
  });
  const runtimeSetupSection = createToolcraftRuntimeSetupSection({
    background: backgroundExtraction.background,
    canvas,
    hasOrientationGizmo: controls.sections.some((section) =>
      Object.values(section.controls).some(
        (control) => control.type === "orientationGizmo",
      ),
    ),
    settingsTransfer,
    timeline: normalizedTimeline,
  });
  const authoredSections = backgroundExtraction.sections.filter((section) => {
    if (section.id !== "runtime.setup") {
      return true;
    }

    // Internal normalization is idempotent for already-materialized runtime
    // Setup sections: validate the existing section before rebuilding it.
    resolveToolcraftControlSectionId(section);
    return false;
  });

  return {
    ...normalizedPanels,
    controls: normalizeControlsPanelLayout({
      ...controls,
      sections: [runtimeSetupSection, ...authoredSections],
    }),
  };
}
