import { splitControlsPanelActionSections } from "./controls-panel-actions";
import { createNormalizedControlsRecord } from "./control-schema-normalization";
import { normalizeMixedSectionLayout } from "./controls-panel-section-layout";
import type {
  ResolvedToolcraftControlSectionSchema,
  ResolvedToolcraftControlsPanelSchema,
  ToolcraftControlSectionSchema,
  ToolcraftControlsPanelSchema,
} from "./types";

function normalizeControlSection(
  section: ToolcraftControlSectionSchema,
): ResolvedToolcraftControlSectionSchema {
  return {
    ...section,
    controls: createNormalizedControlsRecord(Object.entries(section.controls)),
  };
}

export function normalizeControlsPanelLayout(
  controls: ToolcraftControlsPanelSchema,
): ResolvedToolcraftControlsPanelSchema {
  const normalizedSections = controls.sections.map(normalizeControlSection);
  const { bodySections, stickyFooterSections } = splitControlsPanelActionSections(
    normalizedSections,
  );

  return {
    ...controls,
    sections: [
      ...bodySections.flatMap(normalizeMixedSectionLayout),
      ...stickyFooterSections.flatMap(normalizeMixedSectionLayout),
    ],
  };
}
