import type { ResolvedToolcraftAppSchema } from "../../schema/resolved-app-schema";
import {
  getToolcraftPersistenceKey,
  parseToolcraftPersistenceSnapshotResult,
} from "../../composition/public-persistence";
import type { ToolcraftInitialState } from "../../state/types";

export type ToolcraftPersistenceBootstrap = {
  blockedReason?: "incompatible-version";
  initialState?: ToolcraftInitialState;
};

const emptyBootstrap: ToolcraftPersistenceBootstrap = {};

export function readToolcraftPersistenceBootstrap(
  schema: ResolvedToolcraftAppSchema,
): ToolcraftPersistenceBootstrap {
  const storageKey = getToolcraftPersistenceKey(schema.persistence);

  if (!storageKey || typeof window === "undefined") {
    return emptyBootstrap;
  }

  try {
    const parsed = parseToolcraftPersistenceSnapshotResult(
      schema,
      window.localStorage.getItem(storageKey),
    );

    if (parsed.kind === "incompatible-version") {
      return {
        blockedReason: "incompatible-version",
      };
    }
    return parsed.kind === "current" ? { initialState: parsed.state } : {};
  } catch {
    return emptyBootstrap;
  }
}
