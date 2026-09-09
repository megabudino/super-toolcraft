"use client";

import * as React from "react";

import { decodeToolcraftModelDocument } from "../../model-import/canonical/model-document-codec";
import type { ToolcraftModelDocument } from "../../model-import/canonical/model-document";
import type {
  ToolcraftModelExportContext,
  ToolcraftModelHitTestPoint,
  ToolcraftModelPresentationRequest,
  ToolcraftModelPreviewPreparationContext,
  ToolcraftModelPreviewContext,
  ToolcraftModelRenderBinding,
  ToolcraftModelRenderBindingMap,
  ToolcraftModelRenderHost,
  ToolcraftModelRenderPreparationStatus,
  ToolcraftModelResourceResolver,
} from "./model-render-binding";
import { createToolcraftModelPresentation } from "./model-render-binding";
import {
  createToolcraftModelRenderRegistry,
  type ToolcraftModelRenderRegistry,
} from "./model-render-registry";
import { createToolcraftLazyThreeModelRenderBinding } from "./lazy-three-model-render-binding";

type ModelRenderSlot = {
  binding: ToolcraftModelRenderBinding<unknown>;
  canonicalDocumentRef: string;
  controller: AbortController;
  document?: ToolcraftModelDocument;
  generation: number;
  mutationQueue: Promise<void>;
  resource?: unknown;
  target: string;
};

type ExportResource = {
  binding: ToolcraftModelRenderBinding<unknown>;
  controller: AbortController;
  resource?: unknown;
};

type PreviewPreparationEntry = Readonly<{
  context: ToolcraftModelPreviewPreparationContext;
  promise: Promise<void>;
}>;

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new DOMException("Model rendering was aborted.", "AbortError");
  }
}

async function resolveCanonicalDocument(
  resolver: ToolcraftModelResourceResolver,
  ref: string,
  signal: AbortSignal,
): Promise<ToolcraftModelDocument> {
  const resolved = await resolver(ref, { signal });
  throwIfAborted(signal);
  if (resolved === null) {
    throw new Error(`Canonical model resource \"${ref}\" is unavailable.`);
  }
  const bytes = resolved instanceof Uint8Array
    ? new Uint8Array(resolved)
    : new Uint8Array(resolved.slice(0));

  return decodeToolcraftModelDocument(bytes);
}

function presentationFor(
  request: ToolcraftModelPresentationRequest,
  document: ToolcraftModelDocument,
  purpose: "export" | "preview",
) {
  return createToolcraftModelPresentation(request.asset, {
    bounds: document.bounds,
    ...(request.canonicalDocumentRef
      ? { canonicalDocumentRef: request.canonicalDocumentRef }
      : {}),
    ...(request.orientation ? { orientation: request.orientation } : {}),
    phase: request.phase,
    purpose,
    target: request.target,
    ...(request.viewport ? { viewport: request.viewport } : {}),
  });
}

function createToolcraftModelRenderHost(
  registry: ToolcraftModelRenderRegistry,
  resolveResource: ToolcraftModelResourceResolver,
): ToolcraftModelRenderHost {
  const slots = new Map<string, ModelRenderSlot>();
  const exportResources = new Set<ExportResource>();
  let disposed = false;
  let generation = 0;
  let completedPreparationCount = 0;
  let failedPreparationCount = 0;
  let pendingPreparationCount = 0;
  let preparationStatus: ToolcraftModelRenderPreparationStatus = "idle";
  const preparationListeners = new Set<() => void>();
  const preparations = new Map<string, PreviewPreparationEntry>();

  const publishPreparationStatus = (
    status: ToolcraftModelRenderPreparationStatus,
  ): void => {
    if (preparationStatus === status) return;
    preparationStatus = status;
    for (const listener of preparationListeners) listener();
  };

  const refreshPreparationStatus = (): void => {
    publishPreparationStatus(
      pendingPreparationCount > 0
        ? "preparing"
        : failedPreparationCount > 0
          ? "error"
          : completedPreparationCount > 0
            ? "ready"
            : "idle",
    );
  };

  const preparationContextsEqual = (
    left: ToolcraftModelPreviewPreparationContext,
    right: ToolcraftModelPreviewPreparationContext,
  ): boolean =>
    left.height === right.height &&
    left.host === right.host &&
    left.pixelRatio === right.pixelRatio &&
    left.target === right.target &&
    left.width === right.width;

  const prepare = (
    context: ToolcraftModelPreviewPreparationContext,
  ): Promise<void> => {
    if (disposed) return Promise.resolve();
    if (slots.has(context.target)) return Promise.resolve();
    const current = preparations.get(context.target);
    if (current && preparationContextsEqual(current.context, context)) {
      return current.promise;
    }

    pendingPreparationCount += 1;
    refreshPreparationStatus();
    let entry: PreviewPreparationEntry;
    const promise = (current?.promise.catch(() => undefined) ?? Promise.resolve())
      .then(() => registry.resolve(context.target).preparePreview?.(context))
      .then(() => {
        pendingPreparationCount -= 1;
        if (!disposed && preparations.get(context.target) === entry) {
          completedPreparationCount += 1;
        }
        refreshPreparationStatus();
      })
      .catch((error: unknown) => {
        pendingPreparationCount -= 1;
        if (!disposed && preparations.get(context.target) === entry) {
          failedPreparationCount += 1;
        }
        refreshPreparationStatus();
        throw error;
      });
    entry = Object.freeze({ context: { ...context }, promise });
    preparations.set(context.target, entry);
    return promise;
  };

  const retireSlot = (slot: ModelRenderSlot): void => {
    slot.controller.abort();
    if (slot.resource !== undefined) {
      slot.binding.dispose(slot.resource);
      slot.resource = undefined;
    }
  };

  const release = (key: string): void => {
    const slot = slots.get(key);
    if (!slot) return;
    slots.delete(key);
    retireSlot(slot);
  };

  const isCurrentSlotRequest = (
    key: string,
    slot: ModelRenderSlot,
    requestGeneration: number,
  ): boolean =>
    !disposed &&
    !slot.controller.signal.aborted &&
    slots.get(key) === slot &&
    slot.generation === requestGeneration;

  const updatePreviewSlot = async (
    key: string,
    slot: ModelRenderSlot,
    request: ToolcraftModelPresentationRequest,
    context: ToolcraftModelPreviewContext,
    canonicalDocumentRef: string,
  ): Promise<void> => {
    const requestGeneration = ++generation;
    slot.generation = requestGeneration;

    try {
      const document = slot.canonicalDocumentRef === canonicalDocumentRef
        ? slot.document!
        : await resolveCanonicalDocument(
          resolveResource,
          canonicalDocumentRef,
          slot.controller.signal,
        );
      if (!isCurrentSlotRequest(key, slot, requestGeneration)) return;

      const mutate = slot.mutationQueue.then(async () => {
        if (!isCurrentSlotRequest(key, slot, requestGeneration)) return;
        const presentation = presentationFor(request, document, "preview");
        await slot.binding.update(slot.resource, presentation, {
          document,
          signal: slot.controller.signal,
        });
        if (!isCurrentSlotRequest(key, slot, requestGeneration)) return;
        slot.canonicalDocumentRef = canonicalDocumentRef;
        slot.document = document;
        slot.binding.renderPreview(slot.resource, context);
      });
      slot.mutationQueue = mutate.catch(() => undefined);
      await mutate;
    } catch (error) {
      if (!isCurrentSlotRequest(key, slot, requestGeneration)) return;
      release(key);
      throw error;
    }
  };

  const renderPreview = async (
    key: string,
    request: ToolcraftModelPresentationRequest,
    context: ToolcraftModelPreviewContext,
  ): Promise<void> => {
    if (disposed) return;
    await prepare({ ...context, target: request.target });
    if (disposed) return;
    preparations.delete(request.target);
    const binding = registry.resolve(request.target);
    const canonicalDocumentRef =
      request.canonicalDocumentRef ?? request.asset.activeDocumentRef;
    const current = slots.get(key);

    if (
      current &&
      current.binding === binding &&
      current.document &&
      current.resource !== undefined
    ) {
      await updatePreviewSlot(
        key,
        current,
        request,
        context,
        canonicalDocumentRef,
      );
      return;
    }

    if (current) release(key);
    const controller = new AbortController();
    const slot: ModelRenderSlot = {
      binding,
      canonicalDocumentRef,
      controller,
      generation: ++generation,
      mutationQueue: Promise.resolve(),
      target: request.target,
    };
    slots.set(key, slot);

    try {
      const document = await resolveCanonicalDocument(
        resolveResource,
        canonicalDocumentRef,
        controller.signal,
      );
      const presentation = presentationFor(request, document, "preview");
      const resource = await binding.create(presentation, {
        document,
        signal: controller.signal,
      });

      if (disposed || slots.get(key) !== slot || controller.signal.aborted) {
        binding.dispose(resource);
        return;
      }
      slot.document = document;
      slot.resource = resource;
      binding.renderPreview(resource, context);
    } catch (error) {
      const wasAborted = controller.signal.aborted;
      if (slots.get(key) === slot) {
        slots.delete(key);
        retireSlot(slot);
      }
      if (wasAborted) return;
      throw error;
    }
  };

  const renderExport = async (
    request: ToolcraftModelPresentationRequest,
    context: ToolcraftModelExportContext,
  ): Promise<void> => {
    if (disposed) return;
    const binding = registry.resolve(request.target);
    const canonicalDocumentRef =
      request.canonicalDocumentRef ?? request.asset.activeDocumentRef;
    const controller = new AbortController();
    const exportResource: ExportResource = { binding, controller };
    exportResources.add(exportResource);

    try {
      const document = await resolveCanonicalDocument(
        resolveResource,
        canonicalDocumentRef,
        controller.signal,
      );
      const presentation = presentationFor(request, document, "export");
      const resource = await binding.create(presentation, {
        document,
        signal: controller.signal,
      });
      exportResource.resource = resource;
      if (disposed || controller.signal.aborted) return;
      await binding.renderExport(resource, context);
    } finally {
      exportResources.delete(exportResource);
      controller.abort();
      if (exportResource.resource !== undefined) {
        binding.dispose(exportResource.resource);
        exportResource.resource = undefined;
      }
    }
  };

  return {
    dispose: () => {
      if (disposed) return;
      disposed = true;
      for (const slot of slots.values()) retireSlot(slot);
      slots.clear();
      for (const activeExport of exportResources) {
        activeExport.controller.abort();
        if (activeExport.resource !== undefined) {
          activeExport.binding.dispose(activeExport.resource);
          activeExport.resource = undefined;
        }
      }
      exportResources.clear();
      preparationListeners.clear();
      preparations.clear();
      for (const binding of new Set([
        registry.standardBinding,
        ...Object.values(registry.bindings),
      ])) {
        binding.disposePreparedPreview?.();
      }
    },
    getPreparationStatus: () => preparationStatus,
    hitTest: (key: string, point: ToolcraftModelHitTestPoint) => {
      const slot = slots.get(key);
      return slot?.resource === undefined
        ? false
        : slot.binding.hitTest(slot.resource, point);
    },
    prepare,
    release,
    renderExport,
    renderPreview,
    subscribePreparation: (listener: () => void) => {
      preparationListeners.add(listener);
      return () => preparationListeners.delete(listener);
    },
  };
}

const ToolcraftModelRenderContext =
  React.createContext<ToolcraftModelRenderHost | null>(null);

export function ToolcraftModelRenderProvider({
  bindings,
  children,
  resolveResource,
  standardBinding,
}: {
  bindings?: ToolcraftModelRenderBindingMap;
  children: React.ReactNode;
  resolveResource: ToolcraftModelResourceResolver;
  standardBinding?: ToolcraftModelRenderBinding<unknown>;
}): React.JSX.Element {
  const lifecycleGenerationsRef = React.useRef(
    new WeakMap<ToolcraftModelRenderHost, number>(),
  );
  const resolvedStandardBinding = React.useMemo(
    () => standardBinding ?? createToolcraftLazyThreeModelRenderBinding(),
    [standardBinding],
  );
  const registry = React.useMemo(
    () => createToolcraftModelRenderRegistry({
      ...(bindings ? { bindings } : {}),
      standardBinding: resolvedStandardBinding,
    }),
    [bindings, resolvedStandardBinding],
  );
  const host = React.useMemo(
    () => createToolcraftModelRenderHost(registry, resolveResource),
    [registry, resolveResource],
  );

  React.useEffect(() => {
    const generations = lifecycleGenerationsRef.current;
    const generation = (generations.get(host) ?? 0) + 1;
    generations.set(host, generation);

    return () => {
      queueMicrotask(() => {
        if (generations.get(host) !== generation) return;
        generations.delete(host);
        host.dispose();
      });
    };
  }, [host]);

  return (
    <ToolcraftModelRenderContext.Provider value={host}>
      {children}
    </ToolcraftModelRenderContext.Provider>
  );
}

export function useOptionalToolcraftModelRenderHost(): ToolcraftModelRenderHost | null {
  return React.useContext(ToolcraftModelRenderContext);
}

export function useToolcraftModelRenderHost(): ToolcraftModelRenderHost {
  const host = useOptionalToolcraftModelRenderHost();
  if (!host) {
    throw new Error(
      "useToolcraftModelRenderHost must be used inside ToolcraftModelRenderProvider.",
    );
  }
  return host;
}

export function useToolcraftModelRenderPreparationStatus(): ToolcraftModelRenderPreparationStatus {
  const host = useToolcraftModelRenderHost();
  return React.useSyncExternalStore(
    host.subscribePreparation,
    host.getPreparationStatus,
    host.getPreparationStatus,
  );
}
