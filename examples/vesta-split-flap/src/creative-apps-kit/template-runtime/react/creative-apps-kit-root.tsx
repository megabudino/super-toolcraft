"use client";

import * as React from "react";

import type { ResolvedCreativeAppsKitAppSchema } from "../schema/types";
import { createCreativeAppsKitState } from "../state/create-template-state";
import {
  createCreativeAppsKitPersistenceSnapshot,
  getCreativeAppsKitPersistenceKey,
  mergeCreativeAppsKitInitialState,
  parseCreativeAppsKitPersistenceSnapshot,
} from "../state/persistence";
import { creativeAppsKitReducer } from "../state/reducer";
import type {
  CreativeAppsKitCommand,
  CreativeAppsKitInitialState,
  CreativeAppsKitState,
} from "../state/types";
import { CreativeAppsKitThemeProvider } from "./theme-runtime";

export type CreativeAppsKitContextValue = {
  dispatch: React.Dispatch<CreativeAppsKitCommand>;
  state: CreativeAppsKitState;
};

export const CreativeAppsKitContext = React.createContext<CreativeAppsKitContextValue | null>(null);

export type CreativeAppsKitRootProps = {
  children: React.ReactNode;
  initialState?: CreativeAppsKitInitialState;
  schema: ResolvedCreativeAppsKitAppSchema;
};

function readPersistedInitialState(
  schema: ResolvedCreativeAppsKitAppSchema,
): CreativeAppsKitInitialState | undefined {
  const storageKey = getCreativeAppsKitPersistenceKey(schema.persistence);

  if (!storageKey || typeof window === "undefined") {
    return undefined;
  }

  try {
    return parseCreativeAppsKitPersistenceSnapshot(
      schema,
      window.localStorage.getItem(storageKey),
    );
  } catch {
    return undefined;
  }
}

function writePersistedState(
  schema: ResolvedCreativeAppsKitAppSchema,
  state: CreativeAppsKitState,
): void {
  const storageKey = getCreativeAppsKitPersistenceKey(schema.persistence);

  if (!storageKey || typeof window === "undefined") {
    return;
  }

  const snapshot = createCreativeAppsKitPersistenceSnapshot(state, schema.persistence);

  if (!snapshot) {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
  } catch {
    // Persistence is best-effort; runtime state stays authoritative when storage is unavailable.
  }
}

export function CreativeAppsKitRoot({
  children,
  initialState,
  schema,
}: CreativeAppsKitRootProps) {
  const [state, dispatch] = React.useReducer(
    creativeAppsKitReducer,
    { initialState, schema },
    ({ initialState, schema }) =>
      createCreativeAppsKitState(
        schema,
        mergeCreativeAppsKitInitialState(readPersistedInitialState(schema), initialState),
      ),
  );
  const latestStateRef = React.useRef(state);
  const value = React.useMemo(() => ({ dispatch, state }), [dispatch, state]);

  React.useEffect(() => {
    latestStateRef.current = state;
  }, [state]);

  React.useEffect(() => {
    if (schema.persistence.storage !== "localStorage") {
      return undefined;
    }

    const persistTimer = window.setTimeout(() => {
      writePersistedState(schema, state);
    }, 120);

    return () => window.clearTimeout(persistTimer);
  }, [schema, state]);

  React.useEffect(() => {
    if (schema.persistence.storage !== "localStorage") {
      return undefined;
    }

    const handlePageHide = () => {
      writePersistedState(schema, latestStateRef.current);
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [schema]);

  return (
    <CreativeAppsKitThemeProvider>
      <CreativeAppsKitContext.Provider value={value}>{children}</CreativeAppsKitContext.Provider>
    </CreativeAppsKitThemeProvider>
  );
}
