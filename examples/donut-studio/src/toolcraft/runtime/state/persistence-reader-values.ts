import type { ResolvedToolcraftAppSchema } from "../schema/types";
import {
  getToolcraftValueControls,
  normalizeToolcraftControlValue,
} from "./control-value-normalization";
import { isToolcraftPersistenceRecord } from "./persistence-shared";

export function readValues(
  schema: ResolvedToolcraftAppSchema,
  value: unknown,
): Record<string, unknown> | undefined {
  if (!isToolcraftPersistenceRecord(value)) {
    return undefined;
  }

  const controls = getToolcraftValueControls(schema);
  const values: Record<string, unknown> = {};

  for (const [target, control] of controls) {
    if (Object.hasOwn(value, target)) {
      const normalized = normalizeToolcraftControlValue(control, value[target]);

      values[target] = normalized.accepted
        ? normalized.value
        : normalized.fallback;
    }
  }

  return Object.keys(values).length > 0 ? values : undefined;
}
