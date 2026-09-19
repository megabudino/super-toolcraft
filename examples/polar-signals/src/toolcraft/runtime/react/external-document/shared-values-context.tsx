import * as React from "react";
import type { ToolcraftSharedValuesPort } from "../../composition/shared-values-port";
import type { ToolcraftControlSchema } from "../../schema/types";
import { isToolcraftBuiltInControlSchema } from "../../schema/control-schema";
export const ToolcraftSharedValuesContext = React.createContext<
  ToolcraftSharedValuesPort | undefined
>(undefined);
const subscribeNothing = () => () => {};
const editable = () => true;
/** Controls subscribe only to admission, so value traffic does not repaint unrelated groups. */
export function useToolcraftSharedControlsDisabled(targets: readonly string[]): boolean {
  const port = React.useContext(ToolcraftSharedValuesContext);
  const getEditable = React.useCallback(() => port?.getSnapshot().editable ?? true, [port]);
  const canEdit = React.useSyncExternalStore(
    port?.subscribe ?? subscribeNothing,
    getEditable,
    editable,
  );
  return !canEdit && targets.some((target) => port?.targets.includes(target));
}

export function useToolcraftSharedControlDefault(
  target: string | undefined,
): string | number | undefined {
  const port = React.useContext(ToolcraftSharedValuesContext);
  const getDefault = React.useCallback(
    () => (target ? port?.getSnapshot().defaults[target] : undefined),
    [port, target],
  );
  return React.useSyncExternalStore(port?.subscribe ?? subscribeNothing, getDefault, getDefault);
}

export function applyToolcraftSharedControlDefault(
  control: ToolcraftControlSchema,
  value: string | number | undefined,
): ToolcraftControlSchema {
  if (!isToolcraftBuiltInControlSchema(control)) return control;
  if (control.type === "slider" && typeof value === "number")
    return { ...control, defaultValue: value };
  if (control.type === "select" && control.optionsSource === undefined && typeof value === "string")
    return { ...control, defaultValue: value };
  return control;
}
