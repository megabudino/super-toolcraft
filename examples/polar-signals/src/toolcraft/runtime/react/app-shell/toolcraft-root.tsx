"use client";

import * as React from "react";

import type { AnyToolcraftRendererPipelineRegistration } from "../../rendering";
import type { ResolvedToolcraftAppSchema } from "../../schema/resolved-app-schema";
import { createToolcraftState } from "../../state/create-template-state";
import { mergeToolcraftInitialState } from "../../composition/public-persistence";
import { createToolcraftExternalStore } from "../../composition/public-state";
import { ToolcraftSharedValuesContext } from "../external-document/shared-values-context";
import { createToolcraftSharedDocumentStore } from "../../composition/shared-document-store";
import type { ToolcraftSharedValuesPort } from "../../composition/shared-values-port";
import type { ToolcraftCommand, ToolcraftInitialState, ToolcraftState } from "../../state/types";
import {
  ToolcraftThemeContext,
  ToolcraftThemeProvider,
  ToolcraftThemeScope,
} from "./theme-runtime";
import { ToolcraftBrowserZoomBoundary } from "./toolcraft-browser-zoom-boundary";
import { ToolcraftPipelineProvider } from "./toolcraft-pipeline-context";
import { ToolcraftSourceAssetProvider } from "./toolcraft-source-asset-context";
import { ToolcraftExportProvider } from "./toolcraft-export-context";
import { ToolcraftStoreContext } from "./toolcraft-store-context";
import type { ToolcraftModelPresentationMode } from "../model-rendering/model-render-binding";
import {
  resolveToolcraftModelPresentationMode,
  ToolcraftModelPresentationModeContext,
} from "../model-rendering/model-presentation-mode";
import {
  ToolcraftPersistenceStatusProvider,
  useToolcraftPersistence,
} from "./use-toolcraft-persistence";
import { readToolcraftPersistenceBootstrap } from "./toolcraft-persistence-bootstrap";

export type ToolcraftContextValue = {
  dispatch: React.Dispatch<ToolcraftCommand>;
  state: ToolcraftState;
};

export const ToolcraftContext = React.createContext<ToolcraftContextValue | null>(null);

export type ToolcraftRootProps = {
  children: React.ReactNode;
  initialState?: ToolcraftInitialState;
  modelPresentation?: ToolcraftModelPresentationMode;
  rendererPipelineRegistration?: AnyToolcraftRendererPipelineRegistration;
  schema: ResolvedToolcraftAppSchema;
  sharedValues?: ToolcraftSharedValuesPort;
};

const nativeTextEditingInputTypes = new Set([
  "date",
  "datetime-local",
  "email",
  "month",
  "number",
  "password",
  "search",
  "tel",
  "text",
  "time",
  "url",
  "week",
]);
function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== "object") {
    return false;
  }

  const candidate = target as {
    closest?: (selector: string) => Element | null;
    isContentEditable?: boolean;
    tagName?: string;
    type?: string;
  };

  if (candidate.isContentEditable) {
    return true;
  }

  if (typeof candidate.closest === "function" && candidate.closest("[contenteditable='true']")) {
    return true;
  }

  const tagName = candidate.tagName?.toLowerCase();

  if (tagName === "textarea" || tagName === "select") {
    return true;
  }

  return (
    tagName === "input" && nativeTextEditingInputTypes.has(candidate.type?.toLowerCase() ?? "text")
  );
}

function isUndoShortcut(event: KeyboardEvent): boolean {
  return (
    (event.metaKey || event.ctrlKey) &&
    !event.shiftKey &&
    !event.altKey &&
    event.key.toLowerCase() === "z"
  );
}

function isRedoShortcut(event: KeyboardEvent): boolean {
  const key = event.key.toLowerCase();

  return (
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    ((event.shiftKey && key === "z") || (!event.metaKey && event.ctrlKey && key === "y"))
  );
}

export function ToolcraftRoot({
  children,
  initialState,
  modelPresentation,
  rendererPipelineRegistration,
  schema,
  sharedValues,
}: ToolcraftRootProps) {
  const inheritedTheme = React.useContext(ToolcraftThemeContext);
  const [persistenceSchema] = React.useState<ResolvedToolcraftAppSchema>(() =>
    sharedValues && schema.persistence.storage === "localStorage"
      ? {
          ...schema,
          persistence: {
            ...schema.persistence,
            key: `toolcraft:${schema.identity.id}:document-view:state:v${schema.persistence.version}`,
            include: ["canvas", "panels"],
            additionalValueTargets: [],
          },
        }
      : schema,
  );
  const storageKind = sharedValues ? "sessionStorage" : "localStorage";
  const [persistenceBootstrap] = React.useState(() =>
    readToolcraftPersistenceBootstrap(persistenceSchema, storageKind),
  );
  const [owner] = React.useState(() => {
    const state = createToolcraftState(
      schema,
      mergeToolcraftInitialState(persistenceBootstrap.initialState, initialState),
    );
    return sharedValues
      ? createToolcraftSharedDocumentStore(state, sharedValues)
      : { store: createToolcraftExternalStore(state), connect: () => undefined };
  });
  const store = owner.store;
  React.useEffect(() => owner.connect(), [owner]);
  const state = React.useSyncExternalStore(store.subscribe, store.getState, store.getState);
  const dispatch: React.Dispatch<ToolcraftCommand> = store.dispatch;
  const persistenceStatus = useToolcraftPersistence(persistenceSchema, store, {
    storageKind,
    blockedReason: persistenceBootstrap.blockedReason,
    checkpoint: persistenceBootstrap.checkpoint,
  });
  const value = React.useMemo(() => ({ dispatch, state }), [dispatch, state]);
  const resolvedModelPresentation = React.useMemo(
    () => resolveToolcraftModelPresentationMode(schema, modelPresentation),
    [modelPresentation, schema],
  );

  React.useEffect(() => {
    if (!schema.toolbar.history || typeof document === "undefined") {
      return undefined;
    }

    const handleDocumentKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || isEditableKeyboardTarget(event.target)) {
        return;
      }

      if (isUndoShortcut(event)) {
        event.preventDefault();
        dispatch({ type: "history.undo" });
        return;
      }

      if (isRedoShortcut(event)) {
        event.preventDefault();
        dispatch({ type: "history.redo" });
      }
    };

    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [dispatch, schema.toolbar.history]);

  const workspace = (
    <ToolcraftSharedValuesContext.Provider value={sharedValues}>
      <ToolcraftStoreContext.Provider value={store}>
        <ToolcraftSourceAssetProvider store={store}>
          <ToolcraftExportProvider store={store}>
            <ToolcraftContext.Provider value={value}>{children}</ToolcraftContext.Provider>
          </ToolcraftExportProvider>
        </ToolcraftSourceAssetProvider>
      </ToolcraftStoreContext.Provider>
    </ToolcraftSharedValuesContext.Provider>
  );
  const content = (
    <ToolcraftPersistenceStatusProvider status={persistenceStatus}>
      <ToolcraftModelPresentationModeContext.Provider value={resolvedModelPresentation}>
        <ToolcraftBrowserZoomBoundary>
          {inheritedTheme ? (
            <ToolcraftThemeScope value={inheritedTheme}>{workspace}</ToolcraftThemeScope>
          ) : (
            <ToolcraftThemeProvider defaultPreference={schema.sourceDefaults?.theme}>
              {workspace}
            </ToolcraftThemeProvider>
          )}
        </ToolcraftBrowserZoomBoundary>
      </ToolcraftModelPresentationModeContext.Provider>
    </ToolcraftPersistenceStatusProvider>
  );

  return rendererPipelineRegistration ? (
    <ToolcraftPipelineProvider registration={rendererPipelineRegistration}>
      {content}
    </ToolcraftPipelineProvider>
  ) : (
    content
  );
}
