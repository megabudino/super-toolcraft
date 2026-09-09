import { TOOLCRAFT_COMPONENT_CONTRACTS } from "../contracts/component-contracts";
import {
  addAutoLayoutGroupsToSection,
  filterLayoutGroupsForControlIds,
} from "./controls-panel-layout-groups";
import { withImplicitStandaloneSectionTitle } from "./controls-panel-section-titles";
import type {
  ResolvedToolcraftControlSchema,
  ResolvedToolcraftControlSectionSchema,
  ToolcraftControlSchema,
} from "./types";

function getControlDefaultSectionLayout(
  control: ToolcraftControlSchema,
): "grouped" | "standalone" {
  const contract = (
    TOOLCRAFT_COMPONENT_CONTRACTS as Record<
      string,
      { defaultSectionLayout?: "grouped" | "standalone"; kind?: string } | undefined
    >
  )[control.type];

  return contract?.kind === "control" && contract.defaultSectionLayout
    ? contract.defaultSectionLayout
    : "grouped";
}

function isControlGatedBySameSectionControl(
  control: ToolcraftControlSchema,
  entries: readonly [string, ToolcraftControlSchema][],
): boolean {
  const gateTargets = [control.visibleWhen?.target, control.disabledWhen?.target].filter(
    (target): target is string => Boolean(target),
  );

  if (gateTargets.length === 0) {
    return false;
  }

  return entries.some(([, entryControl]) =>
    gateTargets.includes(entryControl.target) &&
    getControlDefaultSectionLayout(entryControl) === "grouped",
  );
}

function getControlSectionLayout(
  control: ToolcraftControlSchema,
  entries: readonly [string, ToolcraftControlSchema][],
): "grouped" | "standalone" {
  if (isControlGatedBySameSectionControl(control, entries)) {
    return "grouped";
  }

  if (
    (control.type === "color" || control.type === "colorOpacity") &&
    entries.some(
      ([, entryControl]) =>
        entryControl.type !== "color" &&
        entryControl.type !== "colorOpacity" &&
        getControlDefaultSectionLayout(entryControl) === "grouped",
    )
  ) {
    return "grouped";
  }

  return getControlDefaultSectionLayout(control);
}

export function normalizeMixedSectionLayout(
  section: ResolvedToolcraftControlSectionSchema,
): ResolvedToolcraftControlSectionSchema[] {
  const entries: [string, ResolvedToolcraftControlSchema][] = Object.entries(
    section.controls,
  );

  if (section.layout === "standalone") {
    return [
      addAutoLayoutGroupsToSection(
        withImplicitStandaloneSectionTitle(section, entries),
      ),
    ];
  }

  if (entries.length <= 1) {
    return [addAutoLayoutGroupsToSection(withImplicitStandaloneSectionTitle(section, entries))];
  }

  const layouts = entries.map(([, control]) => getControlSectionLayout(control, entries));
  const uniqueLayouts = new Set(layouts);

  if (uniqueLayouts.size <= 1) {
    return [addAutoLayoutGroupsToSection(withImplicitStandaloneSectionTitle(section, entries))];
  }

  const normalizedSections: ResolvedToolcraftControlSectionSchema[] = [];
  let currentLayout = layouts[0];
  let currentEntries: [string, ResolvedToolcraftControlSchema][] = [];

  const pushCurrentSection = (): void => {
    if (!currentLayout || currentEntries.length === 0) {
      return;
    }

    const controlIds = new Set(currentEntries.map(([id]) => id));

    if (currentLayout === "standalone") {
      normalizedSections.push(
        withImplicitStandaloneSectionTitle(
          {
            controls: Object.fromEntries(currentEntries),
            layout: "standalone",
          },
          currentEntries,
        ),
      );
    } else {
      normalizedSections.push(
        addAutoLayoutGroupsToSection({
          ...section,
          controls: Object.fromEntries(currentEntries),
          layoutGroups: filterLayoutGroupsForControlIds(section.layoutGroups, controlIds),
        }),
      );
    }
  };

  for (const [index, entry] of entries.entries()) {
    const layout = layouts[index] ?? "grouped";

    if (layout !== currentLayout) {
      pushCurrentSection();
      currentLayout = layout;
      currentEntries = [];
    }

    currentEntries.push(entry);
  }

  pushCurrentSection();

  return normalizedSections;
}
