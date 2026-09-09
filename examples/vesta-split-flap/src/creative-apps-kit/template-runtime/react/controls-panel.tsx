"use client";

import * as React from "react";
import { DiamondIcon } from "@phosphor-icons/react";
import {
  Actions,
  AnchorGrid,
  Button,
  ChannelMixer,
  Checkbox,
  CodeTextarea,
  Color,
  ColorOpacity,
  ControlInlineGroup,
  ControlFieldLabelActionProvider,
  Curves,
  FileDrop,
  FontPicker,
  Gradient,
  ImagePicker,
  Palette,
  Panel,
  PanelActions,
  PanelSection,
  type PanelActionObjectOption,
  RangeInput,
  RangeSlider,
  Segmented,
  Select,
  Slider,
  Switch,
  TextInput,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Vector,
  type ChannelMixerValues,
  type ControlChangeMeta,
  type ColorControlInput,
  type ColorControlInputPair,
  type ColorOpacityValue,
  type FontPickerValue,
  type GradientStop,
  type GradientType,
  type ImagePickerItem,
  type VectorPadVariant,
} from "@/creative-apps-kit/ui";

import type {
  CreativeAppsKitActionCommand,
  CreativeAppsKitActionSchema,
  CreativeAppsKitControlLayoutGroupSchema,
  CreativeAppsKitControlSectionSchema,
  CreativeAppsKitControlSchema,
} from "../schema/types";
import { getCreativeAppsKitControlKeyframeCapability } from "../schema/keyframe-capability";
import { getCreativeAppsKitCanvasSizeTargetDimension } from "../schema/runtime-targets";
import type {
  CreativeAppsKitCommand,
  CreativeAppsKitPanelState,
  CreativeAppsKitState,
} from "../state/types";
import { readImportedImageFile } from "./media-file";
import { PanelContainer } from "./panel-host";
import type { PanelPlacement, PanelStateChange } from "./panel-host-types";
import type { CreativeAppsKitControlRendererMap } from "./control-renderers";
import {
  downloadCreativeAppsKitSettings,
  importCreativeAppsKitSettings,
} from "./settings-transfer";
import { useCreativeAppsKit } from "./use-creative-apps-kit";

export type ControlsPanelProps = {
  className?: string;
  controlRenderers?: CreativeAppsKitControlRendererMap;
  framed?: boolean;
  onPanelAction?: CreativeAppsKitPanelActionHandler;
  onPanelStateChange?: PanelStateChange;
  panelPlacement?: PanelPlacement;
  panelState?: CreativeAppsKitPanelState;
};

export type CreativeAppsKitPanelActionContext = {
  action: CreativeAppsKitActionSchema;
  dispatch: React.Dispatch<CreativeAppsKitCommand>;
  state: CreativeAppsKitState;
};

export type CreativeAppsKitPanelActionHandler = (
  context: CreativeAppsKitPanelActionContext,
) => void;

type AnyRecord = Record<string, unknown>;
type ControlEntry = [string, CreativeAppsKitControlSchema];
type ControlRenderGroup =
  | { entries: readonly ControlEntry[]; kind: "colorGroup" }
  | { entry: ControlEntry; kind: "control" };
type RenderedControlRenderGroup = {
  ids: readonly string[];
  node: React.ReactNode;
};

const inlineSliderMarkerLimit = 20;
const hiddenDiscreteMarkerCount = 2;

const defaultGradientStops = [
  { color: "#FFFFFF", position: "0%" },
  { color: "#7CFF3A", position: "46%" },
  { color: "#111111", position: "100%" },
] as const satisfies readonly GradientStop[];

const defaultChannelMixerValues = {
  B: { B: 100, G: 0, R: 0 },
  G: { B: 0, G: 100, R: 0 },
  R: { B: 0, G: 0, R: 100 },
} satisfies ChannelMixerValues;

function cn(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

function canCreateControlKeyframe(control: CreativeAppsKitControlSchema): boolean {
  return getCreativeAppsKitControlKeyframeCapability(control).capable;
}

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function valuesEqual(first: unknown, second: unknown): boolean {
  if (Object.is(first, second)) {
    return true;
  }

  if (
    (typeof first !== "object" || first === null) &&
    (typeof second !== "object" || second === null)
  ) {
    return false;
  }

  try {
    return JSON.stringify(first) === JSON.stringify(second);
  } catch {
    return false;
  }
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value;
  }

  return typeof value === "number" && Number.isFinite(value) ? String(value) : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function getPanelActionButtonVariant(
  variant: CreativeAppsKitActionSchema["variant"],
): PanelActionObjectOption["variant"] {
  switch (variant) {
    case "destructive":
    case "ghost":
    case "link":
    case "outline":
    case "secondary":
      return variant;
    default:
      return "default";
  }
}

function asNumberArray(value: unknown, fallback: readonly number[]): readonly number[] {
  return Array.isArray(value) && value.every((item) => typeof item === "number")
    ? value
    : fallback;
}

function asRangeInputValue(value: unknown): { end: string; start: string } {
  if (isRecord(value)) {
    return {
      end: asString(value.end, "100%"),
      start: asString(value.start, "0%"),
    };
  }

  return { end: "100%", start: "0%" };
}

function asVectorValue(value: unknown): { x: string; y: string } {
  if (isRecord(value)) {
    return {
      x: asString(value.x, "0.00"),
      y: asString(value.y, "0.00"),
    };
  }

  return { x: "0.00", y: "0.00" };
}

function asVectorPadVariant(value: string | undefined): VectorPadVariant {
  if (
    value === "whiteBalance" ||
    value === "colorBalance" ||
    value === "chromaOffset" ||
    value === "toneBias"
  ) {
    return value;
  }

  return "default";
}

function formatControlValueLabel(
  control: CreativeAppsKitControlSchema,
  value: unknown,
): string {
  if (typeof control.valueLabel === "string") {
    return control.valueLabel;
  }

  switch (control.type) {
    case "checkbox":
    case "switch":
      return asBoolean(value) ? "On" : "Off";
    case "color":
      return asColorValue(value).hex;
    case "colorOpacity": {
      const colorOpacityValue = asColorOpacityValue(value);

      return `${colorOpacityValue.hex} ${colorOpacityValue.opacity}%`;
    }
    case "fontPicker":
      return asFontPickerValue(value).fontId;
    case "gradient":
      return `${asGradientValue(value).stops.length} stops`;
    case "imagePicker":
      return (
        control.items?.find((item) => item.value === value)?.alt ??
        asString(value)
      );
    case "palette": {
      if (isRecord(value)) {
        const family = asString(value.family);
        const shade = asString(value.shade);

        return [family, shade].filter(Boolean).join(" ") || "Palette";
      }

      return "Palette";
    }
    case "rangeInput": {
      const rangeValue = asRangeInputValue(value);

      return `${rangeValue.start} – ${rangeValue.end}`;
    }
    case "rangeSlider": {
      const rangeValue = asNumberArray(value, []);

      return rangeValue.length > 0
        ? rangeValue.map((item) => `${item}${control.unit ?? ""}`).join(" – ")
        : "Range";
    }
    case "select":
    case "segmented":
      return (
        control.options?.find((option) => option.value === value)?.label ??
        asString(value)
      );
    case "slider":
      return `${asNumber(value, asNumber(control.defaultValue, control.min ?? 0))}${
        control.unit ?? ""
      }`;
    case "vector": {
      const vectorValue = asVectorValue(value);

      return `${vectorValue.x}, ${vectorValue.y}`;
    }
    default:
      return typeof value === "string" || typeof value === "number"
        ? String(value)
        : control.type;
  }
}

function asColorValue(value: unknown): { hex: string } {
  if (isRecord(value)) {
    return { hex: asString(value.hex, "#C1FF00") };
  }

  return { hex: "#C1FF00" };
}

function asColorOpacityValue(value: unknown): ColorOpacityValue {
  if (isRecord(value)) {
    return {
      hex: asString(value.hex, "#C1FF00"),
      opacity: Math.min(100, Math.max(0, Math.round(asNumber(value.opacity, 100)))),
    };
  }

  return { hex: "#C1FF00", opacity: 100 };
}

function asGradientType(value: unknown): GradientType {
  return value === "linear" ||
    value === "radial" ||
    value === "angular" ||
    value === "diamond"
    ? value
    : "linear";
}

function asGradientValue(value: unknown): {
  angle: number;
  gradientType: GradientType;
  stops: readonly GradientStop[];
} {
  if (isRecord(value)) {
    return {
      angle: asNumber(value.angle, 90),
      gradientType: asGradientType(value.gradientType),
      stops: Array.isArray(value.stops)
        ? (value.stops as readonly GradientStop[])
        : defaultGradientStops,
    };
  }

  return {
    angle: 90,
    gradientType: "linear",
    stops: defaultGradientStops,
  };
}

function asFontPickerValue(value: unknown): FontPickerValue {
  if (typeof value === "string") {
    return {
      fontId: value,
      fontSize: 16,
      fontWeight: "400",
      letterSpacing: "normal",
      lineHeight: "normal",
    };
  }

  if (isRecord(value)) {
    return {
      fontId: asString(value.fontId, "inter"),
      fontSize: asNumber(value.fontSize, 16),
      fontWeight: asString(value.fontWeight, "400"),
      letterSpacing:
        value.letterSpacing === "tighter" ||
        value.letterSpacing === "tight" ||
        value.letterSpacing === "normal" ||
        value.letterSpacing === "wide" ||
        value.letterSpacing === "wider" ||
        value.letterSpacing === "widest"
          ? value.letterSpacing
          : "normal",
      lineHeight:
        value.lineHeight === "none" ||
        value.lineHeight === "tight" ||
        value.lineHeight === "snug" ||
        value.lineHeight === "normal" ||
        value.lineHeight === "relaxed" ||
        value.lineHeight === "loose"
          ? value.lineHeight
          : "normal",
    };
  }

  return {
    fontId: "inter",
    fontSize: 16,
    fontWeight: "400",
    letterSpacing: "normal",
    lineHeight: "normal",
  };
}

function asActionSchemas(
  actions: readonly (CreativeAppsKitActionSchema | string)[] | undefined,
): readonly CreativeAppsKitActionSchema[] {
  return (actions ?? []).map((action) =>
    typeof action === "string"
      ? {
          label: action,
          value: action,
        }
      : action,
  );
}

function getActionCommand(action: CreativeAppsKitActionSchema): CreativeAppsKitActionCommand | null {
  if (action.command) {
    return action.command;
  }

  switch (action.value.toLowerCase()) {
    case "apply":
      return "controls.apply";
    case "reset":
      return "controls.reset";
    default:
      return null;
  }
}

function getActionLabel(action: CreativeAppsKitActionSchema): string {
  return action.label ?? action.value;
}

function getControlName(id: string, label: boolean | string | undefined): string {
  if (typeof label === "string") {
    return label;
  }

  return id;
}

function ControlKeyframeButton({
  active,
  name,
  onClick,
}: {
  active: boolean;
  name: string;
  onClick: () => void;
}): React.JSX.Element {
  const label = active ? `Disable ${name} keyframes` : `Add ${name} keyframe`;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label={label}
            aria-pressed={active}
            className={cn(
              "size-4 opacity-100 transition-opacity duration-150 ease-out hover:!bg-transparent active:!bg-transparent aria-pressed:!bg-transparent data-popup-open:!bg-transparent [&_svg:not([class*='size-'])]:!size-2.5 [&_svg:not([class*='size-'])]:!opacity-70 data-[icon-active=true]:[&_svg:not([class*='size-'])]:!opacity-100",
              active &&
                "!text-[color:var(--link)] aria-pressed:!text-[color:var(--link)] data-popup-open:!text-[color:var(--link)] [&_svg]:!text-[color:var(--link)] [&_svg]:!fill-[color:var(--link)]",
            )}
            data-icon-active={active}
            onClick={(event) => {
              event.stopPropagation();
              onClick();

              if (typeof event.currentTarget.blur === "function") {
                event.currentTarget.blur();
              }
            }}
            size="icon-sm"
            style={active ? { color: "var(--link)" } : undefined}
            type="button"
            variant="ghost-static"
          />
        }
      >
        <DiamondIcon weight={active ? "fill" : "regular"} />
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

function getControlRenderGroups(entries: readonly ControlEntry[]): ControlRenderGroup[] {
  const groups: ControlRenderGroup[] = [];
  let index = 0;

  while (index < entries.length) {
    const entry = entries[index];

    if (!entry) {
      index += 1;
      continue;
    }

    if (entry[1].type !== "color") {
      groups.push({ entry, kind: "control" });
      index += 1;
      continue;
    }

    const colorEntries: ControlEntry[] = [];

    while (entries[index]?.[1].type === "color") {
      const colorEntry = entries[index];

      if (colorEntry) {
        colorEntries.push(colorEntry);
      }

      index += 1;
    }

    for (let colorIndex = 0; colorIndex < colorEntries.length; colorIndex += 2) {
      const firstEntry = colorEntries[colorIndex];
      const secondEntry = colorEntries[colorIndex + 1];

      if (firstEntry && secondEntry) {
        groups.push({ entries: [firstEntry, secondEntry], kind: "colorGroup" });
      } else if (firstEntry) {
        groups.push({ entry: firstEntry, kind: "control" });
      }
    }
  }

  return groups;
}

function getControlRenderGroupIds(group: ControlRenderGroup): readonly string[] {
  return group.kind === "colorGroup"
    ? group.entries.map(([id]) => id)
    : [group.entry[0]];
}

function countControlsByType(
  sections: readonly CreativeAppsKitControlSectionSchema[],
  type: string,
): number {
  return sections.reduce(
    (count, section) =>
      count +
      Object.values(section.controls).filter((control) => control.type === type)
        .length,
    0,
  );
}

function isSliderLikeControl(control: CreativeAppsKitControlSchema | undefined): boolean {
  return control?.type === "slider" || control?.type === "rangeSlider";
}

function isColorValueControl(control: CreativeAppsKitControlSchema | undefined): boolean {
  return control?.type === "color" || control?.type === "colorOpacity";
}

function hasVisibleControlLabel(
  control: CreativeAppsKitControlSchema | undefined,
): boolean {
  return typeof control?.label === "string" && control.label.trim().length > 0;
}

function isInlineSliderLayoutGroup(
  controlsById: Record<string, CreativeAppsKitControlSchema>,
  layoutGroup: CreativeAppsKitControlLayoutGroupSchema,
): boolean {
  return (
    layoutGroup.columns === 2 &&
    layoutGroup.controls.length === 2 &&
    layoutGroup.controls.every((controlId) =>
      isSliderLikeControl(controlsById[controlId]),
    )
  );
}

function isInlineMixedFieldLayoutGroup(
  controlsById: Record<string, CreativeAppsKitControlSchema>,
  layoutGroup: CreativeAppsKitControlLayoutGroupSchema,
): boolean {
  if (layoutGroup.columns !== 2 || layoutGroup.controls.length !== 2) {
    return false;
  }

  const [firstId, secondId] = layoutGroup.controls;
  const firstControl = firstId ? controlsById[firstId] : undefined;
  const secondControl = secondId ? controlsById[secondId] : undefined;
  const isTextColorPair =
    (firstControl?.type === "text" && isColorValueControl(secondControl)) ||
    (isColorValueControl(firstControl) && secondControl?.type === "text");

  return (
    isTextColorPair &&
    hasVisibleControlLabel(firstControl) &&
    hasVisibleControlLabel(secondControl)
  );
}

function getInlineSliderLayoutControlIds(
  controlsById: Record<string, CreativeAppsKitControlSchema>,
  layoutGroups: readonly CreativeAppsKitControlLayoutGroupSchema[] | undefined,
): ReadonlySet<string> {
  const controlIds = new Set<string>();

  for (const layoutGroup of layoutGroups ?? []) {
    if (layoutGroup.layout !== "inline") {
      continue;
    }

    if (!isInlineSliderLayoutGroup(controlsById, layoutGroup)) {
      continue;
    }

    for (const controlId of layoutGroup.controls) {
      controlIds.add(controlId);
    }
  }

  return controlIds;
}

function getInlineMixedFieldLayoutControlIds(
  controlsById: Record<string, CreativeAppsKitControlSchema>,
  layoutGroups: readonly CreativeAppsKitControlLayoutGroupSchema[] | undefined,
): ReadonlySet<string> {
  const controlIds = new Set<string>();

  for (const layoutGroup of layoutGroups ?? []) {
    if (layoutGroup.layout !== "inline") {
      continue;
    }

    if (!isInlineMixedFieldLayoutGroup(controlsById, layoutGroup)) {
      continue;
    }

    for (const controlId of layoutGroup.controls) {
      controlIds.add(controlId);
    }
  }

  return controlIds;
}

function getControlMarkerCount(
  control: CreativeAppsKitControlSchema,
  markerLimit?: number,
): number | undefined {
  const markerCount = control.markerCount;

  if (
    markerLimit &&
    control.variant === "discrete" &&
    typeof markerCount === "number" &&
    markerCount > markerLimit
  ) {
    return hiddenDiscreteMarkerCount;
  }

  return markerCount;
}

function renderControlLayoutGroups({
  controlsById,
  layoutGroups,
  renderedGroups,
}: {
  controlsById: Record<string, CreativeAppsKitControlSchema>;
  layoutGroups?: readonly CreativeAppsKitControlLayoutGroupSchema[];
  renderedGroups: readonly RenderedControlRenderGroup[];
}): React.ReactNode[] {
  if (!layoutGroups?.length) {
    return renderedGroups.map((group) => group.node);
  }

  const layoutGroupByControlId = new Map<string, CreativeAppsKitControlLayoutGroupSchema>();

  for (const layoutGroup of layoutGroups) {
    if (layoutGroup.layout !== "inline") {
      continue;
    }

    for (const controlId of layoutGroup.controls) {
      layoutGroupByControlId.set(controlId, layoutGroup);
    }
  }

  const nodes: React.ReactNode[] = [];

  for (const renderedGroup of renderedGroups) {
    const layoutGroup = renderedGroup.ids
      .map((id) => layoutGroupByControlId.get(id))
      .find((group): group is CreativeAppsKitControlLayoutGroupSchema => Boolean(group));

    if (!layoutGroup) {
      nodes.push(renderedGroup.node);
      continue;
    }

    const groupedRenderedControls = renderedGroups.filter((candidate) =>
      candidate.ids.some((id) => layoutGroup.controls.includes(id)),
    );
    const firstGroupedControl = groupedRenderedControls[0];

    if (firstGroupedControl !== renderedGroup) {
      continue;
    }

    if (groupedRenderedControls.length < 2) {
      nodes.push(renderedGroup.node);
      continue;
    }

    nodes.push(
      <ControlInlineGroup
        columns={layoutGroup.columns ?? 2}
        kind={
          isInlineSliderLayoutGroup(controlsById, layoutGroup)
            ? "slider"
            : "default"
        }
        key={`layout-group-${layoutGroup.controls.join("-")}`}
      >
        {groupedRenderedControls.map((group) => group.node)}
      </ControlInlineGroup>,
    );
  }

  return nodes;
}

export function ControlsPanel({
  className,
  controlRenderers,
  framed = true,
  onPanelAction,
  onPanelStateChange,
  panelPlacement,
  panelState,
}: ControlsPanelProps): React.JSX.Element | null {
  const { dispatch, state } = useCreativeAppsKit();
  const controlsPanel = state.schema.panels.controls;
  const keyframedControlIds = React.useMemo(
    () => new Set(state.timeline.keyframeGroups.map((group) => group.controlId)),
    [state.timeline.keyframeGroups],
  );
  const keyframeControlsEnabled = Boolean(
    state.schema.assembly.capabilities.includes("timeline.keyframes") &&
      state.timeline.expanded,
  );

  if (!controlsPanel) {
    return null;
  }

  const resolvedControlsPanel = controlsPanel;
  const placement = panelPlacement ?? (framed ? "frame" : "surface");
  const lastHistoryPatch = state.history.undo.at(-1);
  const controlsResetKey =
    lastHistoryPatch?.label === "Reset controls" ? state.history.undo.length : 0;

  function dispatchCommand(command: CreativeAppsKitCommand): void {
    dispatch(command);
  }

  function setControlValue(
    target: string,
    value: unknown,
    label?: string,
    meta?: ControlChangeMeta,
  ): void {
    dispatchCommand({
      history: meta?.history,
      historyGroup: meta?.historyGroup,
      label,
      target,
      type: "controls.setValue",
      value,
    });
  }

  function runAction(action: CreativeAppsKitActionSchema): void {
    const command = action.command ?? (onPanelAction ? null : getActionCommand(action));

    if (command) {
      dispatchCommand({ type: command });
      return;
    }

    onPanelAction?.({ action, dispatch, state });
  }

  function getControlValue(control: CreativeAppsKitControlSchema): unknown {
    const canvasSizeDimension = getCreativeAppsKitCanvasSizeTargetDimension(control.target);

    return canvasSizeDimension
      ? state.canvas.size[canvasSizeDimension]
      : (state.values[control.target] ?? control.defaultValue);
  }

  function getControlDefaultValueByTarget(target: string): unknown {
    for (const section of resolvedControlsPanel.sections) {
      for (const control of Object.values(section.controls)) {
        if (control.target === target) {
          return control.defaultValue;
        }
      }
    }

    return undefined;
  }

  function getTargetValue(target: string): unknown {
    const canvasSizeDimension = getCreativeAppsKitCanvasSizeTargetDimension(target);

    return canvasSizeDimension
      ? state.canvas.size[canvasSizeDimension]
      : (state.values[target] ?? getControlDefaultValueByTarget(target));
  }

  function conditionMatches(condition: {
    equals?: unknown;
    notEquals?: unknown;
    target: string;
  }): boolean {
    const value = getTargetValue(condition.target);

    if (
      "equals" in condition &&
      valuesEqual(value, condition.equals)
    ) {
      return true;
    }

    if (
      "notEquals" in condition &&
      !valuesEqual(value, condition.notEquals)
    ) {
      return true;
    }

    return false;
  }

  function isControlDisabled(control: CreativeAppsKitControlSchema): boolean {
    if (control.disabled) {
      return true;
    }

    return control.disabledWhen ? conditionMatches(control.disabledWhen) : false;
  }

  function isControlVisible(control: CreativeAppsKitControlSchema): boolean {
    return control.visibleWhen ? conditionMatches(control.visibleWhen) : true;
  }

  function isSectionVisible(section: CreativeAppsKitControlSectionSchema): boolean {
    return section.visibleWhen ? conditionMatches(section.visibleWhen) : true;
  }

  function getVisibleSectionEntries(
    section: CreativeAppsKitControlSectionSchema,
  ): ControlEntry[] {
    return Object.entries(section.controls).filter(([, control]) =>
      isControlVisible(control),
    );
  }

  function getControlsRecord(
    entries: readonly ControlEntry[],
  ): Record<string, CreativeAppsKitControlSchema> {
    return Object.fromEntries(entries);
  }

  function getSelectedControlKeyframeTime(controlId: string): number | undefined {
    const selectedKeyframeId = state.timeline.selectedKeyframeId;

    if (!selectedKeyframeId) {
      return undefined;
    }

    const selectedKeyframe = state.timeline.keyframeGroups
      .find((group) => group.controlId === controlId)
      ?.keyframes.find((keyframe) => keyframe.id === selectedKeyframeId);

    return selectedKeyframe?.timeSeconds;
  }

  function maybeUpsertControlKeyframe(
    control: CreativeAppsKitControlSchema,
    name: string,
    value: unknown,
  ): void {
    if (
      !keyframeControlsEnabled ||
      !keyframedControlIds.has(control.target) ||
      !canCreateControlKeyframe(control)
    ) {
      return;
    }

    dispatchCommand({
      controlId: control.target,
      controlLabel: name,
      timeSeconds: getSelectedControlKeyframeTime(control.target),
      type: "timeline.upsertControlKeyframe",
      value,
      valueLabel: formatControlValueLabel(control, value),
    });
  }

  function getKeyframeLabelAction(
    control: CreativeAppsKitControlSchema,
    name: string,
    value: unknown,
  ): React.ReactNode {
    if (!keyframeControlsEnabled || !canCreateControlKeyframe(control)) {
      return null;
    }

    return (
      <ControlKeyframeButton
        active={keyframedControlIds.has(control.target)}
        name={name}
        onClick={() => {
          dispatchCommand({
            controlId: control.target,
            controlLabel: name,
            type: "timeline.toggleControlKeyframes",
            value,
            valueLabel: formatControlValueLabel(control, value),
          });
        }}
      />
    );
  }

  function withKeyframeLabelAction({
    children,
    control,
    disableAction = false,
    labelActionName,
    name,
    providerKey,
    value,
  }: {
    children: React.ReactNode;
    control: CreativeAppsKitControlSchema;
    disableAction?: boolean;
    labelActionName?: string;
    name: string;
    providerKey: string;
    value: unknown;
  }): React.ReactNode {
    if (disableAction) {
      return children;
    }

    const actionName = labelActionName ?? name;
    const action = getKeyframeLabelAction(control, actionName, value);

    if (!action) {
      return children;
    }

    return (
      <ControlFieldLabelActionProvider
        action={action}
        key={providerKey}
        label={actionName}
      >
        {children}
      </ControlFieldLabelActionProvider>
    );
  }

  function getSectionHeaderKeyframeEntry(
    entries: readonly ControlEntry[],
    title: React.ReactNode,
  ): ControlEntry | null {
    if (typeof title !== "string") {
      return null;
    }

    const matchingTitleEntry = entries.find(([id, control]) => {
      if (control.type === "channelMixer" || control.type === "curves") {
        return false;
      }

      const name = getControlName(id, control.label);

      return name === title && canCreateControlKeyframe(control);
    });

    if (matchingTitleEntry) {
      return matchingTitleEntry;
    }

    return null;
  }

  function getSectionHeaderKeyframeAction(entry: ControlEntry): React.ReactNode {
    const [id, control] = entry;
    const name = getControlName(id, control.label);

    return getKeyframeLabelAction(control, name, getControlValue(control));
  }

  function renderColorGroup(
    entries: readonly ControlEntry[],
    headerKeyframeTarget: string | null,
  ): React.JSX.Element | null {
    const colorInputs = entries.map(([id, control]) => {
      const name = getControlName(id, control.label);
      const value = getControlValue(control);
      const colorValue = asColorValue(value);

      return {
        hex: colorValue.hex,
        name,
        onValueChange: (nextValue, meta) => {
          setControlValue(control.target, nextValue, name, meta);
          maybeUpsertControlKeyframe(control, name, nextValue);
        },
      } satisfies ColorControlInput;
    });
    const [firstInput, secondInput] = colorInputs;

    if (!firstInput) {
      return null;
    }

    if (!secondInput) {
      const firstEntry = entries[0];
      const firstControl = firstEntry?.[1];
      const firstValue = firstControl ? getControlValue(firstControl) : undefined;

      return firstControl ? (
        withKeyframeLabelAction({
          children: (
            <Color
              hex={firstInput.hex}
              key={firstInput.name}
              name={firstInput.name}
              onValueChange={firstInput.onValueChange}
            />
          ),
          control: firstControl,
          disableAction: firstControl.target === headerKeyframeTarget,
          name: firstInput.name,
          providerKey: firstInput.name,
          value: firstValue,
        }) as React.JSX.Element
      ) : (
        <Color
          hex={firstInput.hex}
          key={firstInput.name}
          name={firstInput.name}
          onValueChange={firstInput.onValueChange}
        />
      );
    }

    return (
      <Color
        inputs={[firstInput, secondInput] as ColorControlInputPair}
        key={`${firstInput.name}-${secondInput.name}`}
      />
    );
  }

  const visibleSections = resolvedControlsPanel.sections
    .map((section) => ({
      entries: getVisibleSectionEntries(section),
      section,
    }))
    .filter(({ entries, section }) => isSectionVisible(section) && entries.length > 0);
  const visibleControlsPanelSections = visibleSections.map(({ entries, section }) => ({
    ...section,
    controls: getControlsRecord(entries),
  }));
  const vectorControlCount = countControlsByType(visibleControlsPanelSections, "vector");
  const vectorPadShape = vectorControlCount === 1 ? "square" : "compact";

  const panel = (
    <Panel
      className={cn(
        "shrink-0",
        placement === "frame" && "max-h-none",
        className,
      )}
      collapsed={panelState?.collapsed}
      contentTransitionSuppressionKey={
        keyframeControlsEnabled ? "keyframes" : "plain"
      }
      key={controlsResetKey}
      onCollapsedChange={(collapsed) => onPanelStateChange?.({ collapsed })}
      onResetControls={() => dispatchCommand({ type: "controls.reset" })}
      title={resolvedControlsPanel.title}
    >
      {visibleSections.map(({ entries, section }, sectionIndex) => {
        const visibleControls = getControlsRecord(entries);
        const inlineSliderControlIds = getInlineSliderLayoutControlIds(
          visibleControls,
          section.layoutGroups,
        );
        const inlineMixedFieldControlIds = getInlineMixedFieldLayoutControlIds(
          visibleControls,
          section.layoutGroups,
        );
        const headerKeyframeEntry = getSectionHeaderKeyframeEntry(entries, section.title);
        const headerKeyframeTarget = headerKeyframeEntry?.[1].target ?? null;

        return (
          <PanelSection
            action={
              headerKeyframeEntry
                ? getSectionHeaderKeyframeAction(headerKeyframeEntry)
                : undefined
            }
            actionGroup={section.actionGroup}
            key={`${section.title ?? "section"}-${sectionIndex}`}
            title={section.title}
          >
            {renderControlLayoutGroups({
              controlsById: visibleControls,
              layoutGroups: section.layoutGroups,
              renderedGroups: getControlRenderGroups(entries).map((group) => {
                const ids = getControlRenderGroupIds(group);
                const node = (() => {
                  if (group.kind === "colorGroup") {
                    return renderColorGroup(group.entries, headerKeyframeTarget);
                  }

                  const [id, rawControl] = group.entry;
                  const disabled = isControlDisabled(rawControl);
                  const control =
                    disabled === Boolean(rawControl.disabled)
                      ? rawControl
                      : { ...rawControl, disabled };
                  const name = getControlName(id, control.label);
                  const value = getControlValue(control);
                  const usesHeaderKeyframeAction = control.target === headerKeyframeTarget;
                  const commitWithLabel =
                    (label: string) =>
                    (nextValue: unknown, meta?: ControlChangeMeta): void => {
                      setControlValue(control.target, nextValue, label, meta);
                      maybeUpsertControlKeyframe(control, label, nextValue);
                    };
                  const commit = commitWithLabel(name);

                  switch (control.type) {
              case "actions": {
                const actions = asActionSchemas(control.actions);

                return (
                  <Actions
                    actions={actions.map((action) => ({
                      icon: action.icon,
                      label: action.label,
                      value: action.value,
                    }))}
                    key={id}
                    name={name}
                    onAction={(actionValue) => {
                      const action = actions.find((item) => item.value === actionValue);

                      if (action) {
                        runAction(action);
                      }
                    }}
                    showLabel={control.label !== false}
                  />
                );
              }

              case "anchorGrid":
                return withKeyframeLabelAction({
                  children: (
                    <AnchorGrid
                      key={id}
                      name={name}
                      onValueChange={commit}
                      value={
                        asString(value, "center") as React.ComponentProps<
                          typeof AnchorGrid
                        >["value"]
                      }
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value,
                });

              case "channelMixer": {
                const channelMixerName = "Channels";

                return withKeyframeLabelAction({
                  children: (
                    <ChannelMixer
                      key={id}
                      name={channelMixerName}
                      onValueChange={(nextValue) =>
                        commitWithLabel(channelMixerName)(nextValue.values)
                      }
                      values={
                        isRecord(value) ? (value as ChannelMixerValues) : defaultChannelMixerValues
                      }
                    />
                  ),
                  control,
                  disableAction: false,
                  labelActionName: channelMixerName,
                  name,
                  providerKey: id,
                  value,
                });
              }

              case "checkbox":
                return (
                  <Checkbox
                    checked={asBoolean(value)}
                    key={id}
                    name={name}
                    onCheckedChange={commit}
                  />
                );

              case "code":
                return withKeyframeLabelAction({
                  children: (
                    <CodeTextarea
                      defaultValue={asString(control.defaultValue, asString(value))}
                      key={id}
                      name={name}
                      onValueChange={commit}
                      value={asString(value)}
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value,
                });

              case "color": {
                const colorValue = asColorValue(value);

                return withKeyframeLabelAction({
                  children: (
                    <Color
                      hex={colorValue.hex}
                      key={id}
                      name={name}
                      onValueChange={commit}
                      showLabel={inlineMixedFieldControlIds.has(id)}
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value,
                });
              }

              case "colorOpacity": {
                const colorOpacityValue = asColorOpacityValue(value);

                return withKeyframeLabelAction({
                  children: (
                    <ColorOpacity
                      hex={colorOpacityValue.hex}
                      key={id}
                      name={name}
                      onValueChange={commit}
                      opacity={colorOpacityValue.opacity}
                      showLabel={inlineMixedFieldControlIds.has(id)}
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value: colorOpacityValue,
                });
              }

              case "curves": {
                const curvesName = control.label === false ? "Curves" : name;

                return withKeyframeLabelAction({
                  children: (
                    <Curves
                      key={id}
                      name={curvesName}
                      onValueChange={commitWithLabel(curvesName)}
                      {...(isRecord(value) ? value : {})}
                    />
                  ),
                  control,
                  disableAction: false,
                  labelActionName: curvesName,
                  name: curvesName,
                  providerKey: id,
                  value,
                });
              }

              case "fileDrop": {
                const previewMediaAsset = state.schema.panels.layers
                  ? undefined
                  : state.mediaAssets[0];

                return (
                  <FileDrop
                    accept={control.accept ?? "PNG, JPEG, GIF, SVG, WebP"}
                    key={id}
                    onClear={
                      previewMediaAsset
                        ? () => {
                            dispatchCommand({
                              mediaId: previewMediaAsset.id,
                              type: "media.delete",
                            });
                          }
                        : undefined
                    }
                    onFileSelect={(file) => {
                      void readImportedImageFile(file, state.canvas.size).then((importedImage) => {
                        if (!importedImage) {
                          return;
                        }

                        dispatchCommand({
                          asset: {
                            dataUrl: importedImage.dataUrl,
                            fileName: file.name,
                            mimeType: file.type || "image/*",
                            position: { x: 0, y: 0 },
                            size: importedImage.size,
                          },
                          type: "media.import",
                        });
                      });
                    }}
                    preview={
                      previewMediaAsset
                        ? {
                            alt: previewMediaAsset.fileName,
                            size: previewMediaAsset.size,
                            src: previewMediaAsset.dataUrl,
                          }
                        : undefined
                    }
                  />
                );
              }

              case "gradient": {
                const gradientValue = asGradientValue(value);

                return withKeyframeLabelAction({
                  children: (
                    <Gradient
                      angle={gradientValue.angle}
                      gradientType={gradientValue.gradientType}
                      key={id}
                      onValueChange={commit}
                      stops={gradientValue.stops}
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value,
                });
              }

              case "fontPicker": {
                const fontPickerValue = asFontPickerValue(value);

                return withKeyframeLabelAction({
                  children: (
                    <FontPicker
                      defaultValue={asFontPickerValue(control.defaultValue)}
                      disabled={control.disabled}
                      key={id}
                      name={name}
                      onValueChange={commit}
                      value={fontPickerValue}
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value: fontPickerValue,
                });
              }

              case "imagePicker":
                return (
                  <ImagePicker
                    items={control.items as readonly ImagePickerItem[] | undefined}
                    key={id}
                    name={name}
                    onValueChange={commit}
                    value={asString(value, control.items?.[0]?.value ?? "")}
                  />
                );

              case "palette":
                return withKeyframeLabelAction({
                  children: (
                    <Palette
                      defaultValue={
                        isRecord(control.defaultValue)
                          ? (control.defaultValue as React.ComponentProps<
                              typeof Palette
                            >["defaultValue"])
                          : undefined
                      }
                      key={id}
                      onCommit={(nextValue) => commit(nextValue)}
                      value={
                        isRecord(value)
                          ? (value as React.ComponentProps<typeof Palette>["value"])
                          : undefined
                      }
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value,
                });

              case "panelActions": {
                const actions = asActionSchemas(control.actions);

                return (
                  <PanelActions
                    actions={actions.map((action) => ({
                      icon: action.icon,
                      name: getActionLabel(action),
                      value: action.value,
                      variant: getPanelActionButtonVariant(action.variant),
                    }))}
                    key={id}
                    onAction={(actionValue) => {
                      const action = actions.find((item) => item.value === actionValue);

                      if (action) {
                        runAction(action);
                      }
                    }}
                  />
                );
              }

              case "rangeInput": {
                const rangeValue = asRangeInputValue(value);

                return withKeyframeLabelAction({
                  children: (
                    <RangeInput
                      defaultValue={asRangeInputValue(control.defaultValue)}
                      end={rangeValue.end}
                      key={id}
                      name={name}
                      onValueChange={commit}
                      start={rangeValue.start}
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value,
                });
              }

              case "rangeSlider":
                return withKeyframeLabelAction({
                  children: (
                    <RangeSlider
                      baseValue={asNumberArray(control.defaultValue, [])}
                      disabled={control.disabled}
                      markerCount={getControlMarkerCount(
                        control,
                        inlineSliderControlIds.has(id)
                          ? inlineSliderMarkerLimit
                          : undefined,
                      )}
                      max={control.max ?? 100}
                      min={control.min ?? 0}
                      key={id}
                      name={name}
                      onValueChange={commit}
                      step={control.step ?? 0.1}
                      unit={control.unit}
                      value={asNumberArray(value, [control.min ?? 0, control.max ?? 100])}
                      valueLabel={control.valueLabel}
                      variant={
                        control.variant === "discrete" ? "discrete" : "continuous"
                      }
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value,
                });

              case "segmented":
                return withKeyframeLabelAction({
                  children: (
                    <Segmented
                      key={id}
                      name={name}
                      onValueChange={commit}
                      options={control.options ?? []}
                      value={asString(value, control.options?.[0]?.value ?? "")}
                      variant={control.variant === "dots" ? "dots" : "default"}
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value,
                });

              case "select":
                return (
                  <Select
                    key={id}
                    name={name}
                    onValueChange={commit}
                    options={control.options ?? []}
                    value={asString(value, control.options?.[0]?.value ?? "")}
                  />
                );

              case "settingsTransfer":
                return (
                  <PanelActions
                    actions={[
                      {
                        icon: "rotate-ccw",
                        name: "Import Settings",
                        onClick: () => {
                          void importCreativeAppsKitSettings({ dispatch, state });
                        },
                        variant: "outline",
                      },
                      {
                        icon: "download",
                        name: "Export Settings",
                        onClick: () => downloadCreativeAppsKitSettings(state),
                        variant: "outline",
                      },
                    ]}
                    key={id}
                    columns={2}
                  />
                );

              case "slider":
                return withKeyframeLabelAction({
                  children: (
                    <Slider
                      baseValue={asNumber(control.defaultValue, control.min ?? 0)}
                      disabled={control.disabled}
                      key={id}
                      markerCount={getControlMarkerCount(
                        control,
                        inlineSliderControlIds.has(id)
                          ? inlineSliderMarkerLimit
                          : undefined,
                      )}
                      max={control.max ?? 100}
                      min={control.min ?? 0}
                      name={name}
                      onValueChange={commit}
                      step={control.step ?? 1}
                      unit={control.unit}
                      value={asNumber(
                        value,
                        asNumber(control.defaultValue, control.min ?? 0),
                      )}
                      valueLabel={control.valueLabel}
                      variant={
                        control.variant === "discrete" ? "discrete" : "continuous"
                      }
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value,
                });

              case "switch":
                return (
                  <Switch
                    checked={asBoolean(value)}
                    key={id}
                    name={name}
                    onCheckedChange={commit}
                  />
                );

              case "text":
                return withKeyframeLabelAction({
                  children: (
                    <TextInput
                      commitOnBlur
                      defaultValue={asString(control.defaultValue, asString(value))}
                      key={id}
                      name={name}
                      onValueChange={commit}
                      value={asString(value)}
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value,
                });

              case "vector": {
                const vectorValue = asVectorValue(value);

                return withKeyframeLabelAction({
                  children: (
                    <Vector
                      defaultValue={asVectorValue(control.defaultValue)}
                      key={id}
                      name={name}
                      onValueChange={commit}
                      padShape={vectorPadShape}
                      padVariant={asVectorPadVariant(control.variant)}
                      x={vectorValue.x}
                      xLabel={control.xLabel}
                      y={vectorValue.y}
                      yLabel={control.yLabel}
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value,
                });
              }

                  default: {
                    const CustomControl = controlRenderers?.[control.type];

                    if (!CustomControl) {
                      return null;
                    }

                    return withKeyframeLabelAction({
                      children: (
                        <React.Fragment key={id}>
                          {CustomControl({
                            control,
                            controlId: id,
                            dispatch,
                            keyframeAction: getKeyframeLabelAction(control, name, value),
                            name,
                            setValue: commit,
                            state,
                            value,
                          })}
                        </React.Fragment>
                      ),
                      control,
                      disableAction: usesHeaderKeyframeAction,
                      name,
                      providerKey: id,
                      value,
                    });
                  }
                  }
                })();

                return { ids, node };
              }),
            })}
          </PanelSection>
        );
      })}
    </Panel>
  );

  if (placement === "surface") {
    return panel;
  }

  return (
    <PanelContainer
      onPanelStateChange={onPanelStateChange}
      panelState={panelState}
      panelType="controls"
      placement={placement}
    >
      {panel}
    </PanelContainer>
  );
}
