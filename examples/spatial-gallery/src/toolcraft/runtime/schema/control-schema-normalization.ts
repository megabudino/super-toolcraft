import { normalizeToolcraftModelFileDrop } from "../model-import/model-import-limits";
import type {
  ResolvedToolcraftControlSchema,
  ToolcraftControlSchema,
} from "./types";

const modelOnlyControlFieldNames = [
  "modelFormats",
  "modelLimits",
  "topologyProfile",
] as const;

function assertRequiredControlStringField(
  control: ToolcraftControlSchema,
  fieldName: "target" | "type",
): void {
  const fieldValue: unknown = control[fieldName];

  if (
    !Object.prototype.propertyIsEnumerable.call(control, fieldName) ||
    typeof fieldValue !== "string" ||
    fieldValue.trim().length === 0
  ) {
    throw new Error(
      `Toolcraft control validation [control-${fieldName}]: ${fieldName} must be an own enumerable string with non-empty trimmed content.`,
    );
  }
}

function assertControlRuntimeBoundary(control: ToolcraftControlSchema): void {
  const assetKind: unknown = control.assetKind;
  const controlType: unknown = control.type;

  if (assetKind === "model" && controlType !== "fileDrop") {
    throw new Error(
      'Toolcraft control validation [model-filedrop-type]: assetKind "model" requires type "fileDrop".',
    );
  }

  if (
    controlType === "fileDrop" &&
    assetKind !== undefined &&
    assetKind !== "image" &&
    assetKind !== "file" &&
    assetKind !== "model"
  ) {
    throw new Error(
      'Toolcraft fileDrop validation [filedrop-asset-kind]: assetKind must be omitted, "image", "file", or "model".',
    );
  }

  if (assetKind === "model") {
    return;
  }

  for (const fieldName of modelOnlyControlFieldNames) {
    if (Object.prototype.hasOwnProperty.call(control, fieldName)) {
      throw new Error(
        `Toolcraft control validation [model-only-field]: non-model controls cannot supply ${fieldName}.`,
      );
    }
  }
}

function isSliderLikeControl(control: ToolcraftControlSchema): boolean {
  return control.type === "slider" || control.type === "rangeSlider";
}

function getStepMarkerCount(control: ToolcraftControlSchema): number | undefined {
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

function normalizeSliderControlSchema(
  control: ToolcraftControlSchema,
): ToolcraftControlSchema {
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

function normalizeFileDropControlSchema(
  control: ToolcraftControlSchema,
): ResolvedToolcraftControlSchema {
  if (control.assetKind === "model") {
    return normalizeToolcraftModelFileDrop(control);
  }

  if (control.type !== "fileDrop") {
    return control;
  }

  return {
    ...control,
    assetKind: control.assetKind ?? "image",
  };
}

function normalizeControlSchema(
  control: ToolcraftControlSchema,
): ResolvedToolcraftControlSchema {
  const controlSnapshot: ToolcraftControlSchema = { ...control };

  assertRequiredControlStringField(controlSnapshot, "type");
  assertRequiredControlStringField(controlSnapshot, "target");
  assertControlRuntimeBoundary(controlSnapshot);
  return normalizeFileDropControlSchema(
    normalizeSliderControlSchema(controlSnapshot),
  );
}

export function createNormalizedControlsRecord(
  entries: readonly [string, ToolcraftControlSchema][],
): Record<string, ResolvedToolcraftControlSchema> {
  return Object.fromEntries(
    entries.map(([id, control]) => [id, normalizeControlSchema(control)]),
  );
}
