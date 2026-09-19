import type {
  ToolcraftSharedValuesOperation,
  ToolcraftSharedValuesPort,
} from "./shared-values-port";
import type { ToolcraftCommand, ToolcraftState } from "../state/types";
import { createToolcraftExternalStore as createStore } from "../state/toolcraft-external-store";
import { toolcraftReducer } from "./public-state";
import { getToolcraftValueControls } from "../state/control-value-normalization";
import { getToolcraftControlRange, getToolcraftVisibleSliderRange } from "../state/control-ranges";

/** The only command boundary for a host-owned document. Remote publication never dispatches. */
export function createToolcraftSharedDocumentStore(
  initial: ToolcraftState,
  port: ToolcraftSharedValuesPort,
) {
  const targets = new Set(port.targets);
  if (!targets.size || targets.size !== port.targets.length || targets.size > 128)
    throw new Error("Invalid shared document targets.");
  function authoritative(state: ToolcraftState): ToolcraftState {
    const snapshot = port.getSnapshot();
    for (const values of [snapshot.values, snapshot.defaults]) {
      if (
        Object.keys(values).length !== targets.size ||
        [...targets].some(
          (target) =>
            !Object.hasOwn(values, target) ||
            !["string", "number"].includes(typeof values[target]) ||
            (typeof values[target] === "number" && !Number.isFinite(values[target])),
        )
      )
        throw new Error("Shared document snapshot does not match its targets.");
    }
    const controlRanges = { ...state.controlRanges };
    const controls = getToolcraftValueControls(state.schema);
    for (const target of targets) {
      const control = controls.get(target);
      if (!control?.editableRange) continue;
      const before = getToolcraftControlRange(state, control);
      const expanded = getToolcraftVisibleSliderRange(before, snapshot.values[target]);
      if (expanded.min !== before.min || expanded.max !== before.max)
        controlRanges[target] = expanded;
    }
    return {
      ...state,
      controlRanges,
      values: { ...state.values, ...snapshot.values },
      defaults: { ...state.defaults, ...snapshot.defaults },
      history: {
        undo: [],
        redo: [],
        authority: snapshot.editable ? snapshot.history : { canUndo: false, canRedo: false },
      },
    };
  }
  function sharedPatch(values: Readonly<Record<string, unknown>>) {
    const patch: Record<string, string | number> = {};
    for (const [target, value] of Object.entries(values)) {
      if (!targets.has(target)) continue;
      if (typeof value !== "string" && typeof value !== "number")
        throw new Error("Shared values must be scalar.");
      patch[target] = value;
    }
    return patch;
  }
  function intent(
    state: ToolcraftState,
    command: ToolcraftCommand,
  ): ToolcraftSharedValuesOperation | undefined {
    switch (command.type) {
      case "history.undo":
        return { type: "undo" };
      case "history.redo":
        return { type: "redo" };
      case "controls.reset":
        return { type: "reset" };
      case "controls.resetTargets": {
        const owned = command.targets.filter((target) => targets.has(target));
        return owned.length ? { type: "reset", targets: owned } : undefined;
      }
      case "controls.setValue":
      case "controls.editSlider": {
        if (!targets.has(command.target)) return undefined;
        if (command.type === "controls.editSlider" && command.reason === "reset")
          return { type: "reset", targets: [command.target] };
        const value = command.value;
        if (typeof value !== "number" && typeof value !== "string")
          throw new Error("Shared values must be scalar.");
        return {
          type: "set",
          target: command.target,
          value,
          ...(command.type === "controls.setValue" && command.historyGroup
            ? { gestureId: command.historyGroup }
            : {}),
        };
      }
      case "controls.apply":
      case "settings.apply": {
        const values = sharedPatch(
          command.type === "settings.apply" ? command.settings.values : (command.values ?? {}),
        );
        if (Object.keys(values).length) return { type: "setMany", values };
        return undefined;
      }
      default: {
        // New commands cannot silently become another writer for owned values.
        const candidate = toolcraftReducer(state, command);
        if (
          [...targets].some((target) => !Object.is(candidate.values[target], state.values[target]))
        )
          throw new Error(`Unsupported shared document mutation: ${command.type}`);
        return undefined;
      }
    }
  }
  function projectPending(state: ToolcraftState): ToolcraftState {
    const pending = port.getSnapshot().pending;
    return Object.keys(pending).length
      ? { ...state, values: { ...state.values, ...pending } }
      : state;
  }
  const store = createStore(
    authoritative(initial),
    (state, command) => authoritative(toolcraftReducer(state, command)),
    {
      projectView: projectPending,
      beforeDispatch(state, command) {
        const operation = intent(state, command);
        if (operation && port.getSnapshot().editable) port.submit(operation);
      },
    },
  );
  return {
    store,
    connect() {
      const synchronize = () => {
        // A contract replacement remounts its root. The retiring owner cannot consume its targets.
        if (
          port.targets.length === targets.size &&
          port.targets.every((target) => targets.has(target))
        )
          store.synchronize(authoritative);
      };
      const unsubscribe = port.subscribe(synchronize);
      synchronize();
      return unsubscribe;
    },
  };
}
