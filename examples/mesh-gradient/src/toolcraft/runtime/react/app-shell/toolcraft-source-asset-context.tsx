"use client";

import * as React from "react";

import {
  createToolcraftSourceAssetCoordinator,
  type ToolcraftSourceAssetCoordinator,
} from "../../source-assets/source-asset-coordinator";
import { createIndexedDbToolcraftBinaryAssetRepository } from "../../source-assets/repository/indexeddb-binary-asset-repository";
import { createMemoryToolcraftBinaryAssetRepository } from "../../source-assets/repository/memory-binary-asset-repository";
import type { ToolcraftBinaryAssetRepository } from "../../source-assets/repository/binary-asset-repository";
import type { ToolcraftExternalStore } from "../../state/toolcraft-external-store";
import { ToolcraftModelRenderProvider } from "../model-rendering/model-render-provider";

export const ToolcraftSourceAssetCoordinatorContext =
  React.createContext<ToolcraftSourceAssetCoordinator | null>(null);

type ToolcraftSourceAssetCoordinatorFactory = (
  store: ToolcraftExternalStore,
) => ToolcraftSourceAssetCoordinator;

type ToolcraftSourceAssetOwner = {
  coordinator: ToolcraftSourceAssetCoordinator;
  lifecycleGeneration: number;
  onDisposeError: (error: unknown) => void;
};

function selectModelHydrationFingerprint(
  state: ReturnType<ToolcraftExternalStore["getCommittedState"]>,
): string {
  return state.mediaAssets
    .filter((asset) => asset.assetKind === "model")
    .map((asset) =>
      `${asset.id}\u0000${asset.lifecycle}\u0000${asset.sourceBundleRef}`
    )
    .sort()
    .join("\u0001");
}

const sourceAssetOwners = new WeakMap<
  ToolcraftExternalStore,
  ToolcraftSourceAssetOwner
>();

function createRepository(): ToolcraftBinaryAssetRepository {
  if (typeof globalThis.indexedDB === "undefined") {
    return createMemoryToolcraftBinaryAssetRepository();
  }

  try {
    return createIndexedDbToolcraftBinaryAssetRepository();
  } catch {
    return createMemoryToolcraftBinaryAssetRepository();
  }
}

function reportSourceAssetDisposeError(error: unknown): void {
  const globalReportError = globalThis.reportError;
  if (typeof globalReportError === "function") {
    try {
      globalReportError(error);
      return;
    } catch (reportingFailure) {
      console.error(
        "Toolcraft source asset disposal reporting failed.",
        new AggregateError(
          [error, reportingFailure],
          "Toolcraft source asset disposal and reporting both failed.",
        ),
      );
      return;
    }
  }
  console.error("Toolcraft source asset disposal failed.", error);
}

const createDefaultCoordinator: ToolcraftSourceAssetCoordinatorFactory = (
  store,
) =>
  createToolcraftSourceAssetCoordinator({
    dispatch: store.dispatch,
    getState: store.getCommittedState,
    repository: createRepository(),
  });

function getOrCreateSourceAssetOwner(
  store: ToolcraftExternalStore,
  createCoordinator: ToolcraftSourceAssetCoordinatorFactory,
  onDisposeError: (error: unknown) => void,
): ToolcraftSourceAssetOwner {
  const current = sourceAssetOwners.get(store);
  if (current) return current;

  const owner = {
    coordinator: createCoordinator(store),
    lifecycleGeneration: 0,
    onDisposeError,
  };
  sourceAssetOwners.set(store, owner);
  return owner;
}

function reportOwnerDisposeError(
  owner: ToolcraftSourceAssetOwner,
  error: unknown,
): void {
  try {
    owner.onDisposeError(error);
  } catch (reportingFailure) {
    reportSourceAssetDisposeError(
      new AggregateError(
        [error, reportingFailure],
        "Toolcraft source asset disposal and its injected reporter both failed.",
      ),
    );
  }
}

export function ToolcraftSourceAssetProvider({
  children,
  createCoordinator = createDefaultCoordinator,
  onDisposeError = reportSourceAssetDisposeError,
  store,
}: {
  children: React.ReactNode;
  createCoordinator?: ToolcraftSourceAssetCoordinatorFactory;
  onDisposeError?: (error: unknown) => void;
  store: ToolcraftExternalStore;
}): React.JSX.Element {
  const owner = getOrCreateSourceAssetOwner(
    store,
    createCoordinator,
    onDisposeError,
  );

  React.useEffect(() => {
    const generation = ++owner.lifecycleGeneration;

    const hydrateModels = (): void => {
      void owner.coordinator.hydrateModels().catch((error: unknown) => {
        reportOwnerDisposeError(owner, error);
      });
    };
    const unsubscribeHydration = store.subscribeSelector(
      selectModelHydrationFingerprint,
      hydrateModels,
    );
    hydrateModels();

    return () => {
      unsubscribeHydration();
      queueMicrotask(() => {
        if (
          owner.lifecycleGeneration !== generation ||
          sourceAssetOwners.get(store) !== owner
        ) {
          return;
        }

        sourceAssetOwners.delete(store);
        try {
          void owner.coordinator.dispose().catch((error: unknown) => {
            reportOwnerDisposeError(owner, error);
          });
        } catch (error) {
          reportOwnerDisposeError(owner, error);
        }
      });
    };
  }, [owner, store]);

  const context = (
    <ToolcraftSourceAssetCoordinatorContext.Provider value={owner.coordinator}>
      {children}
    </ToolcraftSourceAssetCoordinatorContext.Provider>
  );

  return owner.coordinator.resolveResource ? (
    <ToolcraftModelRenderProvider
      resolveResource={owner.coordinator.resolveResource}
    >
      {context}
    </ToolcraftModelRenderProvider>
  ) : context;
}

export function useToolcraftSourceAssetCoordinator(): ToolcraftSourceAssetCoordinator {
  const coordinator = React.useContext(ToolcraftSourceAssetCoordinatorContext);

  if (!coordinator) {
    throw new Error(
      "useToolcraftSourceAssetCoordinator must be used inside ToolcraftRoot",
    );
  }

  return coordinator;
}
