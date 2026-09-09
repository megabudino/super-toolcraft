import { EFFECTS_EDITOR_COMPONENT_CONTRACTS } from "../contracts/component-contracts";
import type {
  CreativeAppsKitAssemblyCapability,
  CreativeAppsKitAssemblyCommand,
  CreativeAppsKitAssemblyComponentId,
  CreativeAppsKitAssemblyContract,
  CreativeAppsKitAssemblyPanelContract,
  CreativeAppsKitAppSchema,
  CreativeAppsKitControlLayoutGroupSchema,
  CreativeAppsKitControlSectionSchema,
  CreativeAppsKitCanvasSize,
  CreativeAppsKitCanvasSizingSchema,
  CreativeAppsKitControlSchema,
  CreativeAppsKitControlsPanelSchema,
  CreativeAppsKitSettingsTransferSchema,
  CreativeAppsKitTimelinePanelSchema,
  CreativeAppsKitToolbarSchema,
  ResolvedCreativeAppsKitPanelsSchema,
  ResolvedCreativeAppsKitSettingsTransferSchema,
  ResolvedCreativeAppsKitTimelinePanelSchema,
  ResolvedCreativeAppsKitAppSchema,
} from "./types";

const defaultCanvasSize = {
  height: 1024,
  unit: "px",
  width: 1024,
} satisfies CreativeAppsKitCanvasSize;

type ResolvedCanvas = ResolvedCreativeAppsKitAppSchema["canvas"];
type ResolvedExport = ResolvedCreativeAppsKitAppSchema["export"];
type ResolvedToolbar = Required<CreativeAppsKitToolbarSchema>;
type PanelContract = {
  capabilities?: readonly string[];
  defaultPlacement: CreativeAppsKitAssemblyPanelContract["defaultPlacement"];
  snapEdges: CreativeAppsKitAssemblyPanelContract["snapEdges"];
  visualComponent: string;
};

const canvasSizeControlTargets = {
  height: "canvas.size.height",
  width: "canvas.size.width",
} as const;
const maxAutoInlineControlLabelLength = 18;
const settingsTransferTarget = "runtime.settingsTransfer";
const settingsTransferHeavyControlTypes = new Set([
  "channelMixer",
  "code",
  "colorOpacity",
  "curves",
  "fileDrop",
  "fontPicker",
  "gradient",
  "imagePicker",
  "palette",
  "rangeSlider",
  "vector",
]);

type CreativeAppsKitControlActionSchema = NonNullable<
  CreativeAppsKitControlSchema["actions"]
>[number];

function unique<const Value extends string>(values: readonly Value[]): Value[] {
  return Array.from(new Set(values));
}

function assertNever(value: never): never {
  throw new Error(`Unsupported Creative Apps Kit template persistence storage: ${String(value)}`);
}

function resolvePersistence(
  persistence: CreativeAppsKitAppSchema["persistence"],
): ResolvedCreativeAppsKitAppSchema["persistence"] {
  switch (persistence?.storage) {
    case undefined:
    case "none":
      return { storage: "none" };
    case "localStorage":
      return persistence;
    default:
      return assertNever(persistence);
  }
}

function slugifySettingsTransferAppId(value: string | undefined): string {
  const slug = value
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "creative-app";
}

function getSettingsTransferMode(
  settingsTransfer: CreativeAppsKitSettingsTransferSchema | undefined,
): "auto" | boolean {
  if (typeof settingsTransfer === "object" && settingsTransfer !== null) {
    return settingsTransfer.enabled ?? "auto";
  }

  return settingsTransfer ?? "auto";
}

function getSettingsTransferObject(
  settingsTransfer: CreativeAppsKitSettingsTransferSchema | undefined,
): Extract<CreativeAppsKitSettingsTransferSchema, object> | undefined {
  return typeof settingsTransfer === "object" && settingsTransfer !== null
    ? settingsTransfer
    : undefined;
}

function getSettingsTransferAppId({
  controls,
  persistence,
  settingsTransfer,
}: {
  controls: CreativeAppsKitControlsPanelSchema | undefined;
  persistence: ResolvedCreativeAppsKitAppSchema["persistence"];
  settingsTransfer: CreativeAppsKitSettingsTransferSchema | undefined;
}): string {
  const objectSchema = getSettingsTransferObject(settingsTransfer);

  if (objectSchema?.appId) {
    return slugifySettingsTransferAppId(objectSchema.appId);
  }

  if (persistence.storage === "localStorage") {
    const match = /^creative-apps-kit:(.+):state:v\d+$/u.exec(persistence.key);

    if (match?.[1]) {
      return slugifySettingsTransferAppId(match[1]);
    }
  }

  return slugifySettingsTransferAppId(controls?.title);
}

function getSettingsTransferFileName({
  appId,
  settingsTransfer,
}: {
  appId: string;
  settingsTransfer: CreativeAppsKitSettingsTransferSchema | undefined;
}): string {
  const explicitFileName = getSettingsTransferObject(settingsTransfer)?.fileName?.trim();

  if (explicitFileName) {
    return explicitFileName.endsWith(".json") ? explicitFileName : `${explicitFileName}.json`;
  }

  return `${appId}-settings.json`;
}

function resolveCanvasSizing(
  canvas: CreativeAppsKitAppSchema["canvas"],
): CreativeAppsKitCanvasSizingSchema {
  if (canvas.sizing) {
    return canvas.sizing;
  }

  if (canvas.size) {
    return { mode: "editable-output" };
  }

  if (canvas.upload) {
    return { mode: "intrinsic-media" };
  }

  return { mode: "intrinsic-media" };
}

function resolveExport(
  exportSchema: CreativeAppsKitAppSchema["export"],
): ResolvedExport {
  return {
    png: {
      background: exportSchema?.png?.background ?? "include",
    },
  };
}

function getPanelDragMode(
  contract: { capabilities?: readonly string[] },
): CreativeAppsKitAssemblyPanelContract["dragMode"] {
  return contract.capabilities?.includes("dragMode:handle") ? "handle" : "panel";
}

function createPanelAssemblyContract({
  capabilities = [],
  commands = [],
  contract,
  enabled,
}: {
  capabilities?: readonly CreativeAppsKitAssemblyCapability[];
  commands?: readonly CreativeAppsKitAssemblyCommand[];
  contract: PanelContract;
  enabled: boolean;
}): CreativeAppsKitAssemblyPanelContract {
  const panelCapabilities = enabled
    ? unique<CreativeAppsKitAssemblyCapability>([
        "panels.draggable",
        "panels.snap",
        "panels.doubleClickReset",
        ...capabilities,
      ])
    : [];
  const panelCommands = enabled
    ? unique<CreativeAppsKitAssemblyCommand>(["panels.setOffset", "panels.resetOffset", ...commands])
    : [];

  return {
    capabilities: panelCapabilities,
    commands: panelCommands,
    defaultPlacement: contract.defaultPlacement,
    dragMode: getPanelDragMode(contract),
    enabled,
    requiredWrapper: "PanelHost",
    snapEdges: contract.snapEdges,
    visualComponent: contract.visualComponent,
  };
}

function createCreativeAppsKitAssembly({
  canvas,
  panels,
  toolbar,
}: {
  canvas: ResolvedCanvas;
  panels: ResolvedCreativeAppsKitPanelsSchema;
  toolbar: ResolvedToolbar;
}): CreativeAppsKitAssemblyContract {
  const components: CreativeAppsKitAssemblyComponentId[] = [];
  const capabilities: CreativeAppsKitAssemblyCapability[] = [];
  const commands: CreativeAppsKitAssemblyCommand[] = [];
  const toolbarEnabled = toolbar.history || toolbar.radar || toolbar.theme || toolbar.zoom;
  const canvasEditableSize = canvas.sizing.mode === "editable-output";

  if (canvas.enabled) {
    components.push("canvas");

    if (canvasEditableSize) {
      capabilities.push("canvas.editableSize");
      commands.push("canvas.setSize");
    }

    if (canvas.draggable) {
      capabilities.push("canvas.draggable");
      commands.push("canvas.panBy", "canvas.setOffset", "canvas.setViewport");
    }

    if (canvas.upload) {
      capabilities.push("canvas.upload");
      commands.push("media.delete", "media.import");
    }
  }

  const controlsPanel = panels.controls
    ? createPanelAssemblyContract({
        capabilities: ["controls.panel", "controls.defaults"],
        commands: ["controls.apply", "controls.reset", "controls.setValue"],
        contract: EFFECTS_EDITOR_COMPONENT_CONTRACTS.controlsPanel,
        enabled: true,
      })
    : undefined;

  if (controlsPanel) {
    components.push("controlsPanel");
    capabilities.push(...controlsPanel.capabilities);
    commands.push(...controlsPanel.commands);
  }

  const layersPanel = panels.layers
    ? createPanelAssemblyContract({
        capabilities: [
          "layers.groups",
          "layers.panel",
          "layers.selection",
          "layers.visibility",
        ],
        commands: [
          "layers.add",
          "layers.delete",
          "layers.moveToGroup",
          "layers.rename",
          "layers.reorder",
          "layers.select",
          "layers.toggleCollapsed",
          "layers.toggleVisibility",
        ],
        contract: EFFECTS_EDITOR_COMPONENT_CONTRACTS.layersPanel,
        enabled: true,
      })
    : undefined;

  if (layersPanel) {
    components.push("layersPanel");
    capabilities.push(...layersPanel.capabilities);
    commands.push(...layersPanel.commands);
  }

  const timelineKeyframesEnabled = panels.timeline?.mode === "keyframes";
  const timelinePanel = panels.timeline?.enabled
    ? createPanelAssemblyContract({
        capabilities: [
          "timeline.duration",
          "timeline.panel",
          "timeline.playback",
          ...(timelineKeyframesEnabled ? (["timeline.keyframes"] as const) : []),
        ],
        commands: [
          "timeline.setCurrentTime",
          "timeline.setDuration",
          "timeline.setPlaying",
          "timeline.toggleLoop",
          "timeline.togglePlayback",
          ...(timelineKeyframesEnabled
            ? ([
                "timeline.changeKeyframeEasing",
                "timeline.deleteControlKeyframes",
                "timeline.deleteKeyframe",
                "timeline.moveKeyframe",
                "timeline.selectKeyframe",
                "timeline.setExpanded",
                "timeline.toggleControlKeyframes",
                "timeline.toggleExpanded",
              ] as const)
            : []),
        ],
        contract: EFFECTS_EDITOR_COMPONENT_CONTRACTS.timelinePanel,
        enabled: true,
      })
    : undefined;

  if (timelinePanel) {
    components.push("timelinePanel");
    capabilities.push(...timelinePanel.capabilities);
    commands.push(...timelinePanel.commands);
  }

  const toolbarCommands: CreativeAppsKitAssemblyCommand[] = [];
  const toolbarCapabilities: CreativeAppsKitAssemblyCapability[] = [];

  if (toolbar.history) {
    toolbarCapabilities.push("history.undoRedo", "toolbar.history");
    toolbarCommands.push("history.redo", "history.undo");
  }

  if (toolbar.radar) {
    toolbarCapabilities.push("toolbar.radar");
    toolbarCommands.push("canvas.center");
  }

  if (toolbar.theme) {
    toolbarCapabilities.push("toolbar.theme");
  }

  if (toolbar.zoom) {
    toolbarCapabilities.push("toolbar.zoom");
    toolbarCommands.push("canvas.zoomIn", "canvas.zoomOut", "canvas.zoomReset");
  }

  const toolbarPanel = createPanelAssemblyContract({
    capabilities: toolbarCapabilities,
    commands: toolbarCommands,
    contract: EFFECTS_EDITOR_COMPONENT_CONTRACTS.toolbar,
    enabled: toolbarEnabled,
  });

  if (toolbarEnabled) {
    components.push("toolbar");
    capabilities.push(...toolbarPanel.capabilities);
    commands.push(...toolbarPanel.commands);
  }

  return {
    capabilities: unique(capabilities),
    commands: unique(commands),
    components: unique(components),
    surfaces: {
      canvas: {
        capabilities: canvas.enabled
          ? unique<CreativeAppsKitAssemblyCapability>([
              ...(canvasEditableSize ? (["canvas.editableSize"] as const) : []),
              ...(canvas.draggable ? (["canvas.draggable"] as const) : []),
              ...(canvas.upload ? (["canvas.upload"] as const) : []),
            ])
          : [],
        commands: canvas.enabled
          ? unique<CreativeAppsKitAssemblyCommand>([
              ...(canvasEditableSize ? (["canvas.setSize"] as const) : []),
              ...(canvas.draggable
                ? (["canvas.panBy", "canvas.setOffset", "canvas.setViewport"] as const)
                : []),
              ...(canvas.upload ? (["media.delete", "media.import"] as const) : []),
            ])
          : [],
        enabled: canvas.enabled,
        visualComponent: "CanvasShell",
      },
      panels: {
        controls: controlsPanel,
        layers: layersPanel,
        timeline: timelinePanel,
        toolbar: toolbarPanel,
      },
    },
  };
}

function hasControlTarget(
  panels: CreativeAppsKitAppSchema["panels"],
  target: string,
): boolean {
  return (panels.controls?.sections ?? []).some((section) =>
    Object.values(section.controls).some((control) => control.target === target),
  );
}

function getControlDefaultSectionLayout(
  control: CreativeAppsKitControlSchema,
): "grouped" | "standalone" {
  const contract = (
    EFFECTS_EDITOR_COMPONENT_CONTRACTS as Record<
      string,
      { defaultSectionLayout?: "grouped" | "standalone"; kind?: string } | undefined
    >
  )[control.type];

  return contract?.kind === "control" && contract.defaultSectionLayout
    ? contract.defaultSectionLayout
    : "grouped";
}

function getControlSectionLayout(
  control: CreativeAppsKitControlSchema,
  entries: readonly [string, CreativeAppsKitControlSchema][],
): "grouped" | "standalone" {
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

function createControlsRecord(
  entries: readonly [string, CreativeAppsKitControlSchema][],
): Record<string, CreativeAppsKitControlSchema> {
  return Object.fromEntries(
    entries.map(([id, control]) => [id, normalizeControlSchema(control)]),
  );
}

function isSliderLikeControl(control: CreativeAppsKitControlSchema): boolean {
  return control.type === "slider" || control.type === "rangeSlider";
}

function getStepMarkerCount(control: CreativeAppsKitControlSchema): number | undefined {
  if (
    typeof control.step !== "number" ||
    typeof control.min !== "number" ||
    typeof control.max !== "number" ||
    !Number.isFinite(control.step) ||
    !Number.isFinite(control.min) ||
    !Number.isFinite(control.max) ||
    control.step <= 0 ||
    control.max <= control.min
  ) {
    return undefined;
  }

  const rawStepCount = (control.max - control.min) / control.step;
  const roundedStepCount = Math.round(rawStepCount);
  const stepCount =
    Math.abs(rawStepCount - roundedStepCount) < Number.EPSILON * 100
      ? roundedStepCount
      : Math.floor(rawStepCount) + 1;

  return Math.max(2, stepCount + 1);
}

function normalizeControlSchema(
  control: CreativeAppsKitControlSchema,
): CreativeAppsKitControlSchema {
  if (
    !isSliderLikeControl(control) ||
    typeof control.step !== "number" ||
    control.variant !== "discrete"
  ) {
    return control;
  }

  return {
    ...control,
    markerCount: getStepMarkerCount(control) ?? control.markerCount,
    variant: "discrete",
  };
}

function filterLayoutGroupsForControlIds(
  layoutGroups: readonly CreativeAppsKitControlLayoutGroupSchema[] | undefined,
  controlIds: ReadonlySet<string>,
): CreativeAppsKitControlLayoutGroupSchema[] {
  return (layoutGroups ?? [])
    .map((layoutGroup) => ({
      ...layoutGroup,
      controls: layoutGroup.controls.filter((controlId) => controlIds.has(controlId)),
    }))
    .filter((layoutGroup) => layoutGroup.controls.length > 1);
}

function hasControlEntries(
  entries: readonly [string, CreativeAppsKitControlSchema][],
): boolean {
  return entries.length > 0;
}

function isPanelActionsControl(control: CreativeAppsKitControlSchema): boolean {
  return control.type === "panelActions";
}

function isSettingsTransferControl(control: CreativeAppsKitControlSchema): boolean {
  return control.type === "settingsTransfer";
}

function isRuntimeOnlyActionControl(control: CreativeAppsKitControlSchema): boolean {
  return isPanelActionsControl(control) || isSettingsTransferControl(control);
}

function getSettingsTransferComplexityScore({
  panels,
}: {
  panels: CreativeAppsKitAppSchema["panels"];
}): {
  controlCount: number;
  score: number;
  sectionCount: number;
} {
  const sections = panels.controls?.sections ?? [];
  let controlCount = 0;
  let score = 0;

  for (const section of sections) {
    for (const control of Object.values(section.controls)) {
      if (isRuntimeOnlyActionControl(control)) {
        continue;
      }

      controlCount += 1;
      score += settingsTransferHeavyControlTypes.has(control.type) ? 3 : 1;
    }
  }

  const sectionCount = sections.filter((section) =>
    Object.values(section.controls).some((control) => !isRuntimeOnlyActionControl(control)),
  ).length;

  score += Math.max(0, sectionCount - 4);

  if (
    panels.timeline === true ||
    (typeof panels.timeline === "object" && panels.timeline.enabled !== false)
  ) {
    score += 2;
  }

  if (panels.layers) {
    score += 2;
  }

  return { controlCount, score, sectionCount };
}

function shouldAutoEnableSettingsTransfer({
  panels,
}: {
  panels: CreativeAppsKitAppSchema["panels"];
}): boolean {
  const { controlCount, score, sectionCount } = getSettingsTransferComplexityScore({
    panels,
  });

  return controlCount >= 12 || sectionCount >= 5 || score >= 18;
}

function resolveSettingsTransfer({
  controls,
  panels,
  persistence,
  settingsTransfer,
}: {
  controls: CreativeAppsKitControlsPanelSchema | undefined;
  panels: CreativeAppsKitAppSchema["panels"];
  persistence: ResolvedCreativeAppsKitAppSchema["persistence"];
  settingsTransfer: CreativeAppsKitSettingsTransferSchema | undefined;
}): ResolvedCreativeAppsKitSettingsTransferSchema {
  const mode = getSettingsTransferMode(settingsTransfer);
  const appId = getSettingsTransferAppId({
    controls,
    persistence,
    settingsTransfer,
  });

  return {
    appId,
    enabled:
      Boolean(controls) &&
      (mode === "auto" ? shouldAutoEnableSettingsTransfer({ panels }) : mode),
    fileName: getSettingsTransferFileName({ appId, settingsTransfer }),
    mode,
  };
}

function createSettingsTransferSection(
  settingsTransfer: ResolvedCreativeAppsKitSettingsTransferSchema,
): CreativeAppsKitControlSectionSchema | null {
  if (!settingsTransfer.enabled) {
    return null;
  }

  return {
    controls: {
      settingsTransfer: {
        label: false,
        target: settingsTransferTarget,
        type: "settingsTransfer",
      },
    },
    layout: "standalone",
    title: "Settings",
  };
}

function isPrimaryPanelAction(action: CreativeAppsKitControlActionSchema): boolean {
  return typeof action !== "string" && action.variant !== "outline";
}

function orderPanelActions(
  actions: readonly CreativeAppsKitControlActionSchema[],
): CreativeAppsKitControlActionSchema[] {
  if (actions.length !== 2) {
    return [...actions];
  }

  return [...actions].sort(
    (left, right) => Number(isPrimaryPanelAction(left)) - Number(isPrimaryPanelAction(right)),
  );
}

function createMergedPanelActionsControl(
  entries: readonly [string, CreativeAppsKitControlSchema][],
): CreativeAppsKitControlSchema | null {
  const firstControl = entries[0]?.[1];

  if (!firstControl) {
    return null;
  }

  const actions = entries.flatMap(([, control]) => [...(control.actions ?? [])]);

  return {
    ...firstControl,
    actions: orderPanelActions(actions),
    target: firstControl.target || "panel.actions",
    type: "panelActions",
  };
}

function splitControlsPanelActionSections(
  sections: readonly CreativeAppsKitControlSectionSchema[],
): {
  bodySections: CreativeAppsKitControlSectionSchema[];
  stickyFooterSections: CreativeAppsKitControlSectionSchema[];
} {
  const bodySections: CreativeAppsKitControlSectionSchema[] = [];
  const stickyFooterSections: CreativeAppsKitControlSectionSchema[] = [];
  const stickyFooterActionEntries: [string, CreativeAppsKitControlSchema][] = [];

  for (const section of sections) {
    if (section.actionGroup) {
      const entries = Object.entries(section.controls);
      const actionEntries = entries.filter(([, control]) => isPanelActionsControl(control));
      const passthroughEntries = entries.filter(([, control]) => !isPanelActionsControl(control));

      stickyFooterActionEntries.push(...actionEntries);

      if (hasControlEntries(passthroughEntries)) {
        stickyFooterSections.push({
          ...section,
          controls: createControlsRecord(passthroughEntries),
        });
      }

      continue;
    }

    const bodyEntries: [string, CreativeAppsKitControlSchema][] = [];
    const actionEntries: [string, CreativeAppsKitControlSchema][] = [];

    for (const entry of Object.entries(section.controls)) {
      const [, control] = entry;

      if (isPanelActionsControl(control)) {
        actionEntries.push(entry);
      } else {
        bodyEntries.push(entry);
      }
    }

    if (hasControlEntries(bodyEntries)) {
      const controlIds = new Set(bodyEntries.map(([id]) => id));
      const layoutGroups = filterLayoutGroupsForControlIds(section.layoutGroups, controlIds);

      bodySections.push({
        ...section,
        controls: createControlsRecord(bodyEntries),
        layoutGroups: layoutGroups.length > 0 ? layoutGroups : undefined,
      });
    }

    if (hasControlEntries(actionEntries)) {
      stickyFooterActionEntries.push(...actionEntries);
    }
  }

  const mergedActionsControl = createMergedPanelActionsControl(stickyFooterActionEntries);

  if (mergedActionsControl) {
    stickyFooterSections.unshift({
      actionGroup: "secondary",
      controls: { footer: mergedActionsControl },
      layout: "standalone",
    });
  }

  return { bodySections, stickyFooterSections };
}

function isShortControlLabel(id: string, control: CreativeAppsKitControlSchema): boolean {
  const label = typeof control.label === "string" ? control.label : id;

  return label.length <= maxAutoInlineControlLabelLength;
}

function isNumericTextControl(control: CreativeAppsKitControlSchema): boolean {
  if (control.type !== "text") {
    return false;
  }

  if (typeof control.defaultValue === "number") {
    return Number.isFinite(control.defaultValue);
  }

  return (
    typeof control.defaultValue === "string" &&
    /^-?\d+(?:\.\d+)?(?:px|%|s)?$/u.test(control.defaultValue.trim())
  );
}

function isColorValueControl(control: CreativeAppsKitControlSchema): boolean {
  return control.type === "color" || control.type === "colorOpacity";
}

function hasVisibleControlLabel(control: CreativeAppsKitControlSchema): boolean {
  return typeof control.label === "string" && control.label.trim().length > 0;
}

function shouldAutoInlineMixedFieldControls(
  first: [string, CreativeAppsKitControlSchema],
  second: [string, CreativeAppsKitControlSchema],
): boolean {
  const [firstId, firstControl] = first;
  const [secondId, secondControl] = second;
  const isNumericColorPair =
    (isNumericTextControl(firstControl) && isColorValueControl(secondControl)) ||
    (isColorValueControl(firstControl) && isNumericTextControl(secondControl));

  return (
    isNumericColorPair &&
    hasVisibleControlLabel(firstControl) &&
    hasVisibleControlLabel(secondControl) &&
    isShortControlLabel(firstId, firstControl) &&
    isShortControlLabel(secondId, secondControl)
  );
}

function shouldAutoInlineControls(
  first: [string, CreativeAppsKitControlSchema],
  second: [string, CreativeAppsKitControlSchema],
): boolean {
  const [firstId, firstControl] = first;
  const [secondId, secondControl] = second;

  if (
    isNumericTextControl(firstControl) &&
    isNumericTextControl(secondControl) &&
    isShortControlLabel(firstId, firstControl) &&
    isShortControlLabel(secondId, secondControl)
  ) {
    return true;
  }

  return shouldAutoInlineMixedFieldControls(first, second);
}

function addAutoLayoutGroupsToSection(
  section: CreativeAppsKitControlSectionSchema,
): CreativeAppsKitControlSectionSchema {
  if (section.layout === "standalone" || section.actionGroup) {
    return section;
  }

  const entries = Object.entries(section.controls);
  const explicitLayoutGroups = section.layoutGroups ?? [];
  const groupedControlIds = new Set<string>();

  for (const layoutGroup of explicitLayoutGroups) {
    for (const controlId of layoutGroup.controls) {
      groupedControlIds.add(controlId);
    }
  }

  const autoLayoutGroups: CreativeAppsKitControlLayoutGroupSchema[] = [];

  for (let index = 0; index < entries.length - 1; index += 1) {
    const firstEntry = entries[index];
    const secondEntry = entries[index + 1];

    if (!firstEntry || !secondEntry) {
      continue;
    }

    const [firstId] = firstEntry;
    const [secondId] = secondEntry;

    if (groupedControlIds.has(firstId) || groupedControlIds.has(secondId)) {
      continue;
    }

    if (!shouldAutoInlineControls(firstEntry, secondEntry)) {
      continue;
    }

    autoLayoutGroups.push({
      columns: 2,
      controls: [firstId, secondId],
      layout: "inline",
    });
    groupedControlIds.add(firstId);
    groupedControlIds.add(secondId);
    index += 1;
  }

  const layoutGroups = [...explicitLayoutGroups, ...autoLayoutGroups];

  return layoutGroups.length > 0
    ? {
        ...section,
        layoutGroups,
      }
    : section;
}

function getImplicitStandaloneSectionTitle(
  entries: readonly [string, CreativeAppsKitControlSchema][],
): string | undefined {
  if (!isColorOnlySectionEntries(entries)) {
    return undefined;
  }

  const names = entries
    .map(([id, control]) => getColorSectionTitlePart(id, control))
    .filter((name): name is string => Boolean(name));

  if (names.length === 1) {
    return names[0];
  }

  if (names.length === 2) {
    return `${names[0]} & ${names[1]}`;
  }

  return undefined;
}

function getColorSectionTitlePart(
  id: string,
  control: CreativeAppsKitControlSchema,
): string | undefined {
  if (typeof control.label === "string" && control.label.trim()) {
    const label = control.label.trim();

    if (!isGenericColorSectionTitle(label)) {
      return label;
    }
  }

  const title = titleizeControlId(id);

  return title && !isGenericColorSectionTitle(title) ? title : undefined;
}

function isGenericColorSectionTitle(title: string): boolean {
  return title.trim().toLowerCase() === "color" || title.trim().toLowerCase() === "colors";
}

function isColorOnlySectionEntries(
  entries: readonly [string, CreativeAppsKitControlSchema][],
): boolean {
  return entries.length > 0 && entries.every(([, control]) => control.type === "color");
}

function titleizeControlId(id: string): string | undefined {
  const title = id
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  if (!title) {
    return undefined;
  }

  return title.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function withImplicitStandaloneSectionTitle(
  section: CreativeAppsKitControlSectionSchema,
  entries: readonly [string, CreativeAppsKitControlSchema][],
): CreativeAppsKitControlSectionSchema {
  if (section.title) {
    if (isColorOnlySectionEntries(entries) && isGenericColorSectionTitle(section.title)) {
      return { ...section, title: undefined };
    }

    return section;
  }

  const title = getImplicitStandaloneSectionTitle(entries);

  return title ? { ...section, title } : section;
}

function normalizeMixedSectionLayout(
  section: CreativeAppsKitControlSectionSchema,
): CreativeAppsKitControlSectionSchema[] {
  const entries = Object.entries(section.controls);

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

  const normalizedSections: CreativeAppsKitControlSectionSchema[] = [];
  let currentLayout = layouts[0];
  let currentEntries: [string, CreativeAppsKitControlSchema][] = [];

  const pushCurrentSection = (): void => {
    if (!currentLayout || currentEntries.length === 0) {
      return;
    }

    const controlIds = new Set(currentEntries.map(([id]) => id));

    if (currentLayout === "standalone") {
      normalizedSections.push(
        withImplicitStandaloneSectionTitle(
          {
            controls: createControlsRecord(currentEntries),
            layout: "standalone",
          },
          currentEntries,
        ),
      );
    } else {
      normalizedSections.push(
        addAutoLayoutGroupsToSection({
          ...section,
          controls: createControlsRecord(currentEntries),
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

function normalizeControlsPanelLayout(
  controls: CreativeAppsKitControlsPanelSchema,
): CreativeAppsKitControlsPanelSchema {
  const { bodySections, stickyFooterSections } = splitControlsPanelActionSections(
    controls.sections,
  );

  return {
    ...controls,
    sections: [
      ...bodySections.flatMap(normalizeMixedSectionLayout),
      ...stickyFooterSections.flatMap(normalizeMixedSectionLayout),
    ],
  };
}

function normalizePanels({
  canvas,
  panels,
  settingsTransfer,
}: {
  canvas: ResolvedCanvas;
  panels: CreativeAppsKitAppSchema["panels"];
  settingsTransfer: ResolvedCreativeAppsKitSettingsTransferSchema;
}): ResolvedCreativeAppsKitPanelsSchema {
  const normalizedTimeline = resolveTimelinePanel(panels.timeline);
  const normalizedPanels: ResolvedCreativeAppsKitPanelsSchema = {
    ...(panels.controls ? { controls: panels.controls } : {}),
    ...(panels.layers ? { layers: panels.layers } : {}),
    ...(normalizedTimeline ? { timeline: normalizedTimeline } : {}),
  };

  if (!panels.controls) {
    return normalizedPanels;
  }

  const controls = { ...panels.controls };
  const settingsTransferSection = createSettingsTransferSection(settingsTransfer);

  if (!canvas.enabled || canvas.sizing.mode !== "editable-output") {
    return {
      ...normalizedPanels,
      controls: normalizeControlsPanelLayout({
        ...controls,
        sections: [
          ...(settingsTransferSection ? [settingsTransferSection] : []),
          ...controls.sections,
        ],
      }),
    };
  }

  const sizeControls: CreativeAppsKitControlSectionSchema["controls"] = {};
  const sizeControlIds: string[] = [];

  if (!hasControlTarget(panels, canvasSizeControlTargets.width)) {
    sizeControls.canvasWidth = {
      defaultValue: canvas.size.width,
      label: "Canvas width",
      performanceReason: "Canvas width changes output dimensions and renderer workload.",
      performanceRole: "workload",
      target: canvasSizeControlTargets.width,
      type: "text",
    };
    sizeControlIds.push("canvasWidth");
  }

  if (!hasControlTarget(panels, canvasSizeControlTargets.height)) {
    sizeControls.canvasHeight = {
      defaultValue: canvas.size.height,
      label: "Canvas height",
      performanceReason: "Canvas height changes output dimensions and renderer workload.",
      performanceRole: "workload",
      target: canvasSizeControlTargets.height,
      type: "text",
    };
    sizeControlIds.push("canvasHeight");
  }

  if (Object.keys(sizeControls).length === 0) {
    return {
      ...normalizedPanels,
      controls: normalizeControlsPanelLayout({
        ...controls,
        sections: [
          ...(settingsTransferSection ? [settingsTransferSection] : []),
          ...controls.sections,
        ],
      }),
    };
  }

  return {
    ...normalizedPanels,
    controls: {
      ...normalizeControlsPanelLayout({
        ...controls,
        sections: [
          ...(settingsTransferSection ? [settingsTransferSection] : []),
          {
            controls: sizeControls,
            layoutGroups:
              sizeControlIds.length > 1
                ? [{ columns: 2, controls: sizeControlIds, layout: "inline" }]
                : undefined,
          },
          ...controls.sections,
        ],
      }),
    },
  };
}

function resolveTimelinePanel(
  timeline: CreativeAppsKitTimelinePanelSchema | undefined,
): ResolvedCreativeAppsKitTimelinePanelSchema | undefined {
  if (timeline === true) {
    return { enabled: true, mode: "keyframes" };
  }

  if (!timeline || timeline.enabled === false) {
    return undefined;
  }

  return {
    enabled: true,
    mode: timeline.mode ?? "keyframes",
  };
}

function hasVisibleRuntimePanel({
  panels,
  toolbar,
}: {
  panels: ResolvedCreativeAppsKitPanelsSchema;
  toolbar: ResolvedToolbar;
}): boolean {
  return Boolean(
    panels.controls ||
      panels.layers ||
      panels.timeline ||
      toolbar.history ||
      toolbar.radar ||
      toolbar.theme ||
      toolbar.zoom,
  );
}

function assertPanelPersistenceContract({
  panels,
  persistence,
  toolbar,
}: {
  panels: ResolvedCreativeAppsKitPanelsSchema;
  persistence: ResolvedCreativeAppsKitAppSchema["persistence"];
  toolbar: ResolvedToolbar;
}): void {
  if (persistence.storage !== "localStorage" || !hasVisibleRuntimePanel({ panels, toolbar })) {
    return;
  }

  if (persistence.include.includes("panels")) {
    return;
  }

  throw new Error(
    'Creative Apps Kit apps with visible runtime panels and localStorage persistence must include "panels" so dragged panel positions survive reload.',
  );
}

export function defineCreativeAppsKit(schema: CreativeAppsKitAppSchema): ResolvedCreativeAppsKitAppSchema {
  const canvasEnabled = schema.canvas.enabled;
  const canvasSize = schema.canvas.size;
  const canvasSizing = resolveCanvasSizing(schema.canvas);
  const persistence = resolvePersistence(schema.persistence);
  const settingsTransfer = resolveSettingsTransfer({
    controls: schema.panels.controls,
    panels: schema.panels,
    persistence,
    settingsTransfer: schema.settingsTransfer,
  });
  const canvas = {
    ...schema.canvas,
    draggable: canvasEnabled ? (schema.canvas.draggable ?? true) : false,
    size: canvasSize ?? defaultCanvasSize,
    sizeSource: canvasSize ? ("app" as const) : ("runtime-default" as const),
    sizing: canvasSizing,
    upload: schema.canvas.upload ?? false,
  };
  const panels = normalizePanels({
    canvas,
    panels: schema.panels,
    settingsTransfer,
  });
  const toolbar = {
    history: schema.toolbar?.history ?? canvasEnabled,
    radar: schema.toolbar?.radar ?? canvasEnabled,
    theme: schema.toolbar?.theme ?? true,
    zoom: schema.toolbar?.zoom ?? canvasEnabled,
  };
  const exportSchema = resolveExport(schema.export);

  assertPanelPersistenceContract({ panels, persistence, toolbar });

  return {
    assembly: createCreativeAppsKitAssembly({
      canvas,
      panels,
      toolbar,
    }),
    canvas,
    export: exportSchema,
    panels,
    persistence,
    settingsTransfer,
    toolbar,
  };
}
