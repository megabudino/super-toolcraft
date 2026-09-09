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
import { useToolcraftModelPresentationMode } from "../model-rendering/model-presentation-mode";
import {
  getToolcraftOrientationControlEntries,
  resolveToolcraftOrientationControl,
} from "../orientation-gizmo/orientation-gizmo-selection";

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
  const modelPresentation = useToolcraftModelPresentationMode();
  const customSourceTargets = React.useMemo(
    () => modelPresentation.mode === "custom"
      ? new Set(
          modelPresentation.consumers.map(({ sourceTarget }) => sourceTarget),
        )
      : new Set<string>(),
    [modelPresentation],
  );
  const getActiveCustomTargetsFingerprint = React.useCallback(
    () => [...new Set(
      store.getCommittedState().mediaAssets.flatMap((asset) =>
        asset.assetKind === "model" &&
          asset.lifecycle !== "restoring" &&
          asset.lifecycle !== "unavailable" &&
          asset.sourceTarget !== undefined &&
          customSourceTargets.has(asset.sourceTarget)
          ? [asset.sourceTarget]
          : []
      ),
    )].sort().join("\u0000"),
    [customSourceTargets, store],
  );
  const activeCustomTargetsFingerprint = React.useSyncExternalStore(
    store.subscribe,
    getActiveCustomTargetsFingerprint,
    getActiveCustomTargetsFingerprint,
  );
  const activeCustomTargets = React.useMemo(
    () => activeCustomTargetsFingerprint.length === 0
      ? []
      : activeCustomTargetsFingerprint.split("\u0000"),
    [activeCustomTargetsFingerprint],
  );
  const orientationEntries = React.useMemo(
    () => getToolcraftOrientationControlEntries(
      store.getCommittedState().schema.panels.controls?.sections ?? [],
    ),
    [store],
  );
  const getVisibleOrientationTarget = React.useCallback(
    () => resolveToolcraftOrientationControl(
      store.getCommittedState(),
      orientationEntries,
    )?.control.target ?? "",
    [orientationEntries, store],
  );
  const visibleOrientationTarget = React.useSyncExternalStore(
    store.subscribe,
    getVisibleOrientationTarget,
    getVisibleOrientationTarget,
  );
  const hydratedModelTargetsRef = React.useRef(new Set<string>());

  React.useEffect(() => {
    const generation = ++owner.lifecycleGeneration;

    const hydrateModels = (): void => {
      const currentTargets = new Set<string>();
      for (const asset of store.getCommittedState().mediaAssets) {
        if (asset.assetKind === "model" && asset.sourceTarget) {
          currentTargets.add(asset.sourceTarget);
        }
      }
      for (const target of new Set([
        ...hydratedModelTargetsRef.current,
        ...currentTargets,
      ])) {
        owner.coordinator.clearPresentationFeedback(target);
      }
      hydratedModelTargetsRef.current = currentTargets;
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
      activeCustomTargets={activeCustomTargets}
      clearPresentationFeedback={owner.coordinator.clearPresentationFeedback}
      customConsumers={
        modelPresentation.mode === "custom"
          ? modelPresentation.consumers
          : []
      }
      reportPresentationFeedback={owner.coordinator.reportPresentationFeedback}
      resolveResource={owner.coordinator.resolveResource}
      retainResourceRef={owner.coordinator.retainResourceRef}
      visibleOrientationTarget={visibleOrientationTarget || undefined}
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
