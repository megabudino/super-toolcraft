import type { ResolvedCreativeAppsKitAppSchema } from "../schema/types";
import type {
  CreativeAppsKitCommand,
  CreativeAppsKitState,
  CreativeAppsKitTimelineState,
} from "../state/types";

const settingsTransferPayloadSource = "creative-apps-kit-settings";
const settingsTransferPayloadVersion = 1;
const settingsTransferImportHistoryGroup = "settings.import";

type CreativeAppsKitDispatch = (command: CreativeAppsKitCommand) => void;

export type CreativeAppsKitSettingsTransferPayload = {
  appId: string;
  canvas: {
    size: CreativeAppsKitState["canvas"]["size"];
  };
  exportedAt: string;
  source: typeof settingsTransferPayloadSource;
  timeline: Pick<
    CreativeAppsKitTimelineState,
    "currentTimeSeconds" | "durationSeconds" | "expanded" | "isLooping"
  > & {
    isPlaying: false;
  };
  values: Record<string, unknown>;
  version: typeof settingsTransferPayloadVersion;
};

type ImportContext = {
  dispatch: CreativeAppsKitDispatch;
  state: CreativeAppsKitState;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFinitePositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getKnownValueTargets(schema: ResolvedCreativeAppsKitAppSchema): Set<string> {
  const targets = new Set<string>();

  for (const section of schema.panels.controls?.sections ?? []) {
    for (const control of Object.values(section.controls)) {
      if (control.type !== "panelActions" && control.type !== "settingsTransfer") {
        targets.add(control.target);
      }
    }
  }

  return targets;
}

function pickTransferValues(state: CreativeAppsKitState): Record<string, unknown> {
  const values: Record<string, unknown> = {};

  for (const target of getKnownValueTargets(state.schema)) {
    if (Object.hasOwn(state.values, target)) {
      values[target] = state.values[target];
    }
  }

  return values;
}

export function createCreativeAppsKitSettingsPayload(
  state: CreativeAppsKitState,
): CreativeAppsKitSettingsTransferPayload {
  return {
    appId: state.schema.settingsTransfer.appId,
    canvas: {
      size: state.canvas.size,
    },
    exportedAt: new Date().toISOString(),
    source: settingsTransferPayloadSource,
    timeline: {
      currentTimeSeconds: state.timeline.currentTimeSeconds,
      durationSeconds: state.timeline.durationSeconds,
      expanded: state.timeline.expanded,
      isLooping: state.timeline.isLooping,
      isPlaying: false,
    },
    values: pickTransferValues(state),
    version: settingsTransferPayloadVersion,
  };
}

export function parseCreativeAppsKitSettingsPayload(
  schema: ResolvedCreativeAppsKitAppSchema,
  value: unknown,
): CreativeAppsKitSettingsTransferPayload | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    value.source !== settingsTransferPayloadSource ||
    value.version !== settingsTransferPayloadVersion ||
    value.appId !== schema.settingsTransfer.appId
  ) {
    return null;
  }

  if (!isRecord(value.values) || !isRecord(value.canvas) || !isRecord(value.timeline)) {
    return null;
  }

  const canvasSize = value.canvas.size;

  if (!isRecord(canvasSize)) {
    return null;
  }

  return value as CreativeAppsKitSettingsTransferPayload;
}

function applyCanvasSize(
  dispatch: CreativeAppsKitDispatch,
  size: CreativeAppsKitSettingsTransferPayload["canvas"]["size"],
): void {
  if (isFinitePositiveNumber(size.width)) {
    dispatch({
      history: "merge",
      historyGroup: settingsTransferImportHistoryGroup,
      label: "Import settings",
      target: "canvas.size.width",
      type: "controls.setValue",
      value: size.width,
    });
  }

  if (isFinitePositiveNumber(size.height)) {
    dispatch({
      history: "merge",
      historyGroup: settingsTransferImportHistoryGroup,
      label: "Import settings",
      target: "canvas.size.height",
      type: "controls.setValue",
      value: size.height,
    });
  }
}

function applyTimeline(
  { dispatch, state }: ImportContext,
  timeline: CreativeAppsKitSettingsTransferPayload["timeline"],
): void {
  if (state.schema.panels.timeline?.enabled && isFinitePositiveNumber(timeline.durationSeconds)) {
    dispatch({
      durationSeconds: timeline.durationSeconds,
      type: "timeline.setDuration",
    });
  }

  if (state.schema.panels.timeline?.enabled && isFiniteNumber(timeline.currentTimeSeconds)) {
    dispatch({
      currentTimeSeconds: timeline.currentTimeSeconds,
      type: "timeline.setCurrentTime",
    });
  }

  if (state.schema.panels.timeline?.enabled && typeof timeline.expanded === "boolean") {
    dispatch({
      expanded: timeline.expanded,
      type: "timeline.setExpanded",
    });
  }

  if (
    state.schema.panels.timeline?.enabled &&
    typeof timeline.isLooping === "boolean" &&
    timeline.isLooping !== state.timeline.isLooping
  ) {
    dispatch({ type: "timeline.toggleLoop" });
  }

  if (state.schema.panels.timeline?.enabled) {
    dispatch({
      isPlaying: false,
      type: "timeline.setPlaying",
    });
  }
}

export function applyCreativeAppsKitSettingsPayload(
  context: ImportContext,
  payload: CreativeAppsKitSettingsTransferPayload,
): void {
  const importableTargets = getKnownValueTargets(context.state.schema);

  for (const [target, value] of Object.entries(payload.values)) {
    if (!importableTargets.has(target)) {
      continue;
    }

    context.dispatch({
      history: "merge",
      historyGroup: settingsTransferImportHistoryGroup,
      label: "Import settings",
      target,
      type: "controls.setValue",
      value,
    });
  }

  applyCanvasSize(context.dispatch, payload.canvas.size);
  applyTimeline(context, payload.timeline);
}

export function downloadCreativeAppsKitSettings(state: CreativeAppsKitState): void {
  const payload = createCreativeAppsKitSettingsPayload(state);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = state.schema.settingsTransfer.fileName;
  link.click();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}

function reportImportError(error: unknown): void {
  console.error("Could not import Creative Apps Kit settings.", error);
  window.alert("Could not import settings JSON.");
}

export async function importCreativeAppsKitSettings(context: ImportContext): Promise<void> {
  const input = document.createElement("input");
  input.accept = "application/json,.json";
  input.style.display = "none";
  input.type = "file";
  document.body.append(input);

  await new Promise<void>((resolve) => {
    input.addEventListener(
      "change",
      () => {
        resolve();
      },
      { once: true },
    );
    input.click();
  });

  const file = input.files?.item(0);
  input.remove();

  if (!file) {
    return;
  }

  try {
    const payload = parseCreativeAppsKitSettingsPayload(
      context.state.schema,
      JSON.parse(await file.text()),
    );

    if (!payload) {
      throw new Error("Invalid Creative Apps Kit settings payload.");
    }

    applyCreativeAppsKitSettingsPayload(context, payload);
  } catch (error) {
    reportImportError(error);
  }
}
