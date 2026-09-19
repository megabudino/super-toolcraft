import { normalizeDocumentWorkspaceColor as color } from "./viewport-preferences";
import { resolveDocumentWorkspaceAppearance } from "./workspace-appearance";
import {
  getToolcraftValueControls,
  normalizeToolcraftLiveControlValue,
} from "../../../state/control-value-normalization";
import type { ToolcraftCommand, ToolcraftState } from "../../../state/types";
import {
  documentViewportDefaults as defaults,
  documentViewportTargets as targets,
  documentViewportLimit,
} from "./viewport-schema";

export type DocumentViewportMeasurement = {
  siteBackground?: string | null;
  backgroundTheme?: "light" | "dark";
  generation: number;
  status: "measuring" | "ready" | "unsupported";
  /** Last accepted extent; retained while a new measurement is pending. */
  contentHeight?: number;
  error?: string;
};
export type DocumentViewportCommand =
  | { type: "document.setBackground"; color?: string | null; theme?: "light" | "dark" }
  | { type: "document.invalidateViewport"; resetBackground?: boolean }
  | {
      type: "document.measureViewport";
      generation: number;
      width: number;
      result: { height: number } | { error: string };
    };

function dimension(value: unknown, fallback: number): number {
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : NaN;
  return Number.isFinite(number)
    ? Math.max(1, Math.min(documentViewportLimit, Math.round(number)))
    : fallback;
}
const owned = (target: string) => Object.values(targets).some((value) => value === target);
const withoutView = (values: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(values).filter(([key]) => !owned(key)));

/** Restore the visible frame provisionally; content bounds and generations require a fresh measurement. */
export function initializeDocumentViewport(state: ToolcraftState): ToolcraftState {
  if (state.schema.canvas.sizing.mode !== "external-document") return state;
  const restored = state.canvas.documentView;
  const width = restored ? dimension(state.canvas.size.width, defaults.width) : defaults.width;
  const view = {
    ...(restored?.page ? { page: restored.page } : {}),
    ...(restored?.toolbar ? { toolbar: restored.toolbar } : {}),
    background: restored?.background ?? null,
    workspace: restored?.workspace ?? (state.values[targets.workspace] === "blanc" ? "blanc" as const : "dots" as const),
    manualHeight:
      restored?.manualHeight == null ? null : dimension(restored.manualHeight, defaults.height),
  };
  return publish(
    { ...state, documentViewport: { generation: 0, status: "measuring" } },
    width,
    restored ? dimension(state.canvas.size.height, defaults.height) : defaults.height,
    view,
  );
}

function publish(
  state: ToolcraftState,
  width: number,
  height: number,
  view: NonNullable<ToolcraftState["canvas"]["documentView"]>,
): ToolcraftState {
  return {
    ...state,
    canvas: {
      ...state.canvas,
      mode: "finite",
      documentView: view,
      size: { width, height, unit: "px" },
      // The document's top stays put while its measured lower edge settles.
      offset: {
        ...state.canvas.offset,
        y: state.canvas.offset.y + (height - state.canvas.size.height) * state.canvas.zoom / 200,
      },
    },
    values: {
      ...state.values,
      [targets.width]: width,
      [targets.height]: height,
      [targets.workspace]: view.workspace,
      [targets.background]: view.background ?? resolveDocumentWorkspaceAppearance(
        state.documentViewport?.siteBackground, state.documentViewport?.backgroundTheme ?? "light",
      ).background,
    },
  };
}

function applyView(
  state: ToolcraftState,
  values: Record<string, unknown>,
  { resetHeight = false, resetBackground = false }: { resetHeight?: boolean; resetBackground?: boolean } = {},
): ToolcraftState {
  const previous = state.canvas.documentView!;
  const width = dimension(values[targets.width], state.canvas.size.width);
  const changedWidth = width !== state.canvas.size.width;
  const measurement = state.documentViewport!;
  const maximum = changedWidth || measurement.status !== "ready" ? undefined : measurement.contentHeight;
  const manual =
    resetHeight || changedWidth
      ? null
      : Object.hasOwn(values, targets.height)
        // Retain edits made while content bounds are pending. Publication below
        // keeps the current size until the fresh measurement clamps this intent.
        ? Math.min(maximum ?? documentViewportLimit, dimension(values[targets.height], state.canvas.size.height))
        : previous.manualHeight;
  const height = maximum === undefined
      ? state.canvas.size.height
      : Math.min(manual ?? maximum, maximum);
  const workspace = values[targets.workspace];
  const view = {
    ...previous,
    background: resetBackground ? null : color(values[targets.background], previous.background),
    workspace: workspace === "blanc" || workspace === "dots"
      ? workspace : previous.workspace,
    manualHeight: manual,
  };
  return publish(
    changedWidth || resetHeight || manual !== previous.manualHeight
      ? {
          ...state,
          documentViewport: {
            ...measurement,
            generation: measurement.generation + 1,
            status: "measuring",
            error: undefined,
          },
        }
      : state,
    width,
    height,
    view,
  );
}

export function reduceDocumentViewportMeasurement(
  state: ToolcraftState,
  command: DocumentViewportCommand,
): ToolcraftState {
  const before = state.documentViewport;
  if (!before) return state;
  if (command.type === "document.setBackground") {
    if (command.color !== undefined && command.color !== null && !/^#[0-9a-f]{6}$/i.test(command.color)) return state;
    const siteBackground = command.color === undefined ? before.siteBackground : command.color;
    const backgroundTheme = command.theme ?? before.backgroundTheme ?? "light";
    if (before.siteBackground === siteBackground && before.backgroundTheme === backgroundTheme) return state;
    const background = state.canvas.documentView?.background ??
      resolveDocumentWorkspaceAppearance(siteBackground, backgroundTheme).background;
    return {
      ...state,
      values: state.values[targets.background] === background ? state.values : { ...state.values, [targets.background]: background },
      documentViewport: { ...before, siteBackground, backgroundTheme },
    };
  }
  if (command.type === "document.invalidateViewport")
    return {
      ...state,
      documentViewport: {
        ...before,
        generation: before.generation + 1,
        status: "measuring",
        error: undefined,
        siteBackground: command.resetBackground ? undefined : before.siteBackground,
      },
    };
  if (command.generation !== before.generation || command.width !== state.canvas.size.width)
    return state;
  if ("error" in command.result)
    return publish({
      ...state,
      documentViewport: {
        ...before,
        status: "unsupported",
        error: command.result.error,
      },
    }, state.canvas.size.width,
    state.canvas.documentView!.manualHeight ?? state.canvas.size.height,
    state.canvas.documentView!);
  const height = command.result.height;
  if (!Number.isSafeInteger(height) || height < 1 || height > documentViewportLimit) return state;
  const previous = state.canvas.documentView!;
  const view = {
    ...previous,
    manualHeight: previous.manualHeight === null ? null : Math.min(height, previous.manualHeight),
  };
  return publish(
    {
      ...state,
      documentViewport: { siteBackground: before.siteBackground, backgroundTheme: before.backgroundTheme, generation: before.generation, status: "ready", contentHeight: height },
    },
    command.width,
    view.manualHeight ?? height,
    view,
  );
}

/** View edits bypass document history. All compound/reset/import paths use this same owner. */
export function routeDocumentViewportCommand(
  state: ToolcraftState,
  command: ToolcraftCommand,
  next: (state: ToolcraftState, command: ToolcraftCommand) => ToolcraftState,
): ToolcraftState {
  if (!state.documentViewport) return next(state, command);
  switch (command.type) {
    case "controls.setValue": {
      if (!owned(command.target)) return next(state, command);
      const control = getToolcraftValueControls(state.schema).get(command.target);
      if (!control) return state;
      const normalized = normalizeToolcraftLiveControlValue(control, command.value);
      return normalized.accepted ? applyView(state, { [command.target]: normalized.value }) : state;
    }
    case "canvas.setSize":
    case "canvas.applySettings":
      return applyView(state, {
        [targets.width]: command.size.width,
        [targets.height]: command.size.height,
      });
    case "controls.apply":
      return applyView(
        next(state, { ...command, values: withoutView(command.values ?? {}) }),
        command.values ?? {},
      );
    case "controls.resetTargets": {
      const selected = command.targets.filter(owned);
      const values = Object.fromEntries(selected.map((target) => [target, state.defaults[target]]));
      return applyView(
        next(state, { ...command, targets: command.targets.filter((target) => !owned(target)) }),
        values,
        { resetHeight: selected.includes(targets.height), resetBackground: selected.includes(targets.background) },
      );
    }
    case "controls.reset": {
      const cleared = next(state, {
        type: "controls.resetTargets",
        targets: Object.keys(state.defaults).filter((target) => !owned(target)),
      });
      return applyView(cleared, state.defaults, { resetHeight: true, resetBackground: true });
    }
    case "settings.apply": {
      // External documents import scalar parameters, never graphics/media/timeline settings.
      const cleared = next(state, {
        type: "controls.apply",
        values: withoutView(command.settings.values),
      });
      return cleared;
    }
    default:
      return next(state, command);
  }
}
