import {
  BufferGeometry,
  DoubleSide,
  Group,
  MeshStandardMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  WebGLRenderer,
  type Camera,
  type Object3D,
} from "three";

import type {
  ToolcraftModelDocument,
  ToolcraftModelPrimitive,
} from "../../model-import/canonical/model-document";
import type {
  ToolcraftModelRenderBinding,
  ToolcraftModelPreviewPreparationContext,
  ToolcraftModelRenderResourceContext,
  ToolcraftModelPresentation,
} from "./model-render-binding";
import {
  buildToolcraftCanonicalThreeModel,
  createToolcraftThreeModelScene,
  createToolcraftThreePrewarmDocument,
  disposeToolcraftCanonicalThreeModel,
} from "./three-canonical-model";

export type ToolcraftThreeRenderer = {
  dispose(): void;
  domElement: HTMLCanvasElement;
  render(scene: Object3D, camera: Camera): void;
  renderLists?: { dispose(): void };
  setPixelRatio(value: number): void;
  setSize(width: number, height: number, updateStyle?: boolean): void;
};

export type ToolcraftThreeModelRenderResource = {
  camera: PerspectiveCamera;
  configuredHeight: number;
  configuredPixelRatio: number;
  configuredWidth: number;
  disposed: boolean;
  fitRoot: Group;
  geometries: readonly BufferGeometry[];
  materials: readonly MeshStandardMaterial[];
  modelRoot: Group;
  nodeObjects: ReadonlyMap<string, Group>;
  presentation: ToolcraftModelPresentation;
  raycaster: Raycaster;
  renderer: ToolcraftThreeRenderer;
  retiredModels: Array<Pick<
    ToolcraftThreeModelRenderResource,
    "geometries" | "materials" | "modelRoot"
  >>;
  scene: Scene;
};

export type ToolcraftThreeModelRenderAdapterOptions = Readonly<{
  createMaterial?: (
    primitive: ToolcraftModelPrimitive,
  ) => MeshStandardMaterial;
  createRenderer?: () => ToolcraftThreeRenderer;
}>;

type ToolcraftPreparedThreeRenderer = Readonly<{
  camera: PerspectiveCamera;
  context: ToolcraftModelPreviewPreparationContext;
  renderer: ToolcraftThreeRenderer;
  retainedModel: Pick<
    ToolcraftThreeModelRenderResource,
    "geometries" | "materials" | "modelRoot"
  >;
  scene: Scene;
}>;

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new DOMException("Model rendering was aborted.", "AbortError");
  }
}

function createDefaultMaterial(): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: 0xb8c2cc,
    metalness: 0.08,
    roughness: 0.72,
    side: DoubleSide,
  });
}

function createDefaultRenderer(): ToolcraftThreeRenderer {
  return new WebGLRenderer({ alpha: true, antialias: true });
}

function disposePreparedRenderer(
  prepared: ToolcraftPreparedThreeRenderer,
): void {
  prepared.scene.clear();
  disposeToolcraftCanonicalThreeModel(prepared.retainedModel);
  prepared.renderer.domElement.remove();
  prepared.renderer.renderLists?.dispose();
  prepared.renderer.dispose();
}

function waitForPresentationFrames(): Promise<void> {
  if (typeof requestAnimationFrame !== "function") return Promise.resolve();
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function mountPreparedRenderer(
  prepared: ToolcraftPreparedThreeRenderer,
  context: ToolcraftModelPreviewPreparationContext,
): void {
  prepared.camera.aspect = context.width / context.height;
  prepared.camera.updateProjectionMatrix();
  prepared.renderer.setPixelRatio(Math.max(1, context.pixelRatio));
  prepared.renderer.setSize(context.width, context.height, false);
  prepared.renderer.domElement.style.display = "block";
  prepared.renderer.domElement.style.height = "100%";
  prepared.renderer.domElement.style.width = "100%";
  prepared.renderer.domElement.dataset.toolcraftGeneratedOutput = "";
  if (prepared.renderer.domElement.parentElement !== context.host) {
    context.host.replaceChildren(prepared.renderer.domElement);
  }
  prepared.retainedModel.modelRoot.visible = true;
  prepared.renderer.render(prepared.scene, prepared.camera);
  prepared.retainedModel.modelRoot.visible = false;
  prepared.renderer.render(prepared.scene, prepared.camera);
}

function applyPresentation(
  resource: ToolcraftThreeModelRenderResource,
  presentation: ToolcraftModelPresentation,
): void {
  if (resource.disposed) return;
  resource.presentation = presentation;
  resource.fitRoot.matrixAutoUpdate = false;
  resource.fitRoot.matrix.fromArray(presentation.displayFit.matrix);
  resource.camera.aspect =
    presentation.displayFit.viewport.width /
    presentation.displayFit.viewport.height;
  resource.camera.position.set(...presentation.orientation.position);
  resource.camera.up.set(...presentation.orientation.up);
  resource.camera.lookAt(0, 0, 0);
  resource.camera.updateProjectionMatrix();

  resource.renderer.domElement.style.opacity = String(
    presentation.presentationOpacity,
  );
  resource.scene.updateMatrixWorld(true);
}

function disposeRetiredCanonicalModels(
  resource: ToolcraftThreeModelRenderResource,
): void {
  const retiredModels = resource.retiredModels.splice(0);
  for (const retired of retiredModels) {
    disposeToolcraftCanonicalThreeModel(retired);
  }
}

function replaceCanonicalModel(
  resource: ToolcraftThreeModelRenderResource,
  document: ToolcraftModelDocument,
  presentation: ToolcraftModelPresentation,
  createMaterial: (
    primitive: ToolcraftModelPrimitive,
  ) => MeshStandardMaterial,
  mergeNodePrimitives: boolean,
  signal: AbortSignal,
): void {
  const replacement = buildToolcraftCanonicalThreeModel(
    document,
    createMaterial,
    mergeNodePrimitives,
  );
  try {
    throwIfAborted(signal);
  } catch (error) {
    disposeToolcraftCanonicalThreeModel(replacement);
    throw error;
  }

  const previous = {
    geometries: resource.geometries,
    materials: resource.materials,
    modelRoot: resource.modelRoot,
    nodeObjects: resource.nodeObjects,
    presentation: resource.presentation,
  };
  resource.fitRoot.remove(previous.modelRoot);
  resource.fitRoot.add(replacement.modelRoot);
  resource.geometries = replacement.geometries;
  resource.materials = replacement.materials;
  resource.modelRoot = replacement.modelRoot;
  resource.nodeObjects = replacement.nodeObjects;

  try {
    applyPresentation(resource, presentation);
  } catch (error) {
    resource.fitRoot.remove(replacement.modelRoot);
    resource.fitRoot.add(previous.modelRoot);
    resource.geometries = previous.geometries;
    resource.materials = previous.materials;
    resource.modelRoot = previous.modelRoot;
    resource.nodeObjects = previous.nodeObjects;
    applyPresentation(resource, previous.presentation);
    disposeToolcraftCanonicalThreeModel(replacement);
    throw error;
  }

  resource.retiredModels.push({
    geometries: previous.geometries,
    materials: previous.materials,
    modelRoot: previous.modelRoot,
  });
}

function configureRenderer(
  resource: ToolcraftThreeModelRenderResource,
  width: number,
  height: number,
  pixelRatio: number,
): void {
  const normalizedPixelRatio = Math.max(1, pixelRatio);
  if (
    resource.configuredHeight !== height ||
    resource.configuredPixelRatio !== normalizedPixelRatio ||
    resource.configuredWidth !== width
  ) {
    resource.renderer.setPixelRatio(normalizedPixelRatio);
    resource.renderer.setSize(width, height, false);
    resource.configuredHeight = height;
    resource.configuredPixelRatio = normalizedPixelRatio;
    resource.configuredWidth = width;
  }
  resource.renderer.domElement.style.display = "block";
  resource.renderer.domElement.style.height = "100%";
  resource.renderer.domElement.style.width = "100%";
  resource.renderer.domElement.dataset.toolcraftGeneratedOutput = "";
}

export function createToolcraftThreeModelRenderAdapter(
  options: ToolcraftThreeModelRenderAdapterOptions = {},
): ToolcraftModelRenderBinding<ToolcraftThreeModelRenderResource> {
  const createMaterial = options.createMaterial ?? createDefaultMaterial;
  const mergeNodePrimitives = options.createMaterial === undefined;
  const createRenderer = options.createRenderer ?? createDefaultRenderer;
  const preparedRenderers = new Map<string, ToolcraftPreparedThreeRenderer>();

  const preparePreview = async (
    context: ToolcraftModelPreviewPreparationContext,
  ): Promise<void> => {
    const current = preparedRenderers.get(context.target);
    if (current) {
      if (
        current.context.height === context.height &&
        current.context.host === context.host &&
        current.context.pixelRatio === context.pixelRatio &&
        current.context.width === context.width
      ) {
        return;
      }
      const resized = {
        ...current,
        context: { ...context },
      };
      mountPreparedRenderer(resized, context);
      preparedRenderers.set(context.target, resized);
      await waitForPresentationFrames();
      return;
    }
    const renderer = createRenderer();
    let built: ReturnType<typeof buildToolcraftCanonicalThreeModel> | undefined;

    try {
      built = buildToolcraftCanonicalThreeModel(
        createToolcraftThreePrewarmDocument(),
        createMaterial,
        mergeNodePrimitives,
      );
      const { camera, scene } = createToolcraftThreeModelScene(built.modelRoot);
      camera.position.set(0, 0, 5);
      camera.lookAt(0, 0, 0);
      camera.aspect = context.width / context.height;
      camera.updateProjectionMatrix();
      scene.updateMatrixWorld(true);
      const prepared = {
        camera,
        context: { ...context },
        renderer,
        retainedModel: built,
        scene,
      };
      mountPreparedRenderer(prepared, context);
      preparedRenderers.set(context.target, prepared);
      await waitForPresentationFrames();
    } catch (error) {
      for (const geometry of built?.geometries ?? []) geometry.dispose();
      for (const material of built?.materials ?? []) material.dispose();
      renderer.renderLists?.dispose();
      renderer.dispose();
      throw error;
    }
  };

  return {
    create: (
      presentation: ToolcraftModelPresentation,
      context: ToolcraftModelRenderResourceContext,
    ) => {
      throwIfAborted(context.signal);
      const prepared = preparedRenderers.get(presentation.target);
      preparedRenderers.delete(presentation.target);
      prepared?.scene.clear();
      const renderer = prepared?.renderer ?? createRenderer();
      let built: ReturnType<typeof buildToolcraftCanonicalThreeModel> | undefined;

      try {
        built = buildToolcraftCanonicalThreeModel(
          context.document,
          createMaterial,
          mergeNodePrimitives,
        );
        const { camera, fitRoot, scene } = createToolcraftThreeModelScene(
          built.modelRoot,
        );
        const resource: ToolcraftThreeModelRenderResource = {
          camera,
          configuredHeight: prepared?.context.height ?? 0,
          configuredPixelRatio: prepared
            ? Math.max(1, prepared.context.pixelRatio)
            : 0,
          configuredWidth: prepared?.context.width ?? 0,
          disposed: false,
          fitRoot,
          geometries: built.geometries,
          materials: built.materials,
          modelRoot: built.modelRoot,
          nodeObjects: built.nodeObjects,
          presentation,
          raycaster: new Raycaster(),
          renderer,
          retiredModels: prepared ? [prepared.retainedModel] : [],
          scene,
        };
        applyPresentation(resource, presentation);
        throwIfAborted(context.signal);
        return resource;
      } catch (error) {
        for (const geometry of built?.geometries ?? []) geometry.dispose();
        for (const material of built?.materials ?? []) material.dispose();
        if (prepared) {
          disposeToolcraftCanonicalThreeModel(prepared.retainedModel);
        }
        renderer.renderLists?.dispose();
        renderer.dispose();
        throw error;
      }
    },
    dispose: (resource) => {
      if (resource.disposed) return;
      resource.disposed = true;
      disposeToolcraftCanonicalThreeModel(resource);
      disposeRetiredCanonicalModels(resource);
      resource.scene.clear();
      resource.fitRoot.clear();
      resource.renderer.domElement.remove();
      resource.renderer.renderLists?.dispose();
      resource.renderer.dispose();
    },
    disposePreparedPreview: () => {
      for (const prepared of preparedRenderers.values()) {
        disposePreparedRenderer(prepared);
      }
      preparedRenderers.clear();
    },
    hitTest: (resource, point) => {
      if (resource.disposed) return false;
      const rect = resource.renderer.domElement.getBoundingClientRect();
      if (
        rect.width <= 0 ||
        rect.height <= 0 ||
        !Number.isFinite(point.clientX) ||
        !Number.isFinite(point.clientY)
      ) {
        return false;
      }
      const normalized = new Vector2(
        ((point.clientX - rect.left) / rect.width) * 2 - 1,
        -((point.clientY - rect.top) / rect.height) * 2 + 1,
      );
      resource.scene.updateMatrixWorld(true);
      resource.camera.updateMatrixWorld(true);
      resource.raycaster.setFromCamera(normalized, resource.camera);
      return resource.raycaster.intersectObject(resource.modelRoot, true).length > 0;
    },
    preparePreview,
    renderExport: async (resource, context) => {
      if (resource.disposed) return;
      configureRenderer(
        resource,
        context.width,
        context.height,
        context.pixelRatio,
      );
      try {
        resource.renderer.render(resource.scene, resource.camera);
      } finally {
        disposeRetiredCanonicalModels(resource);
      }
      await context.onRendered?.(resource.renderer.domElement);
    },
    renderPreview: (resource, context) => {
      if (resource.disposed) return;
      configureRenderer(
        resource,
        context.width,
        context.height,
        context.pixelRatio,
      );
      if (resource.renderer.domElement.parentElement !== context.host) {
        context.host.replaceChildren(resource.renderer.domElement);
      }
      try {
        resource.renderer.render(resource.scene, resource.camera);
      } finally {
        disposeRetiredCanonicalModels(resource);
      }
    },
    update: (resource, presentation, context) => {
      throwIfAborted(context.signal);
      if (
        presentation.canonicalDocumentRef !==
        resource.presentation.canonicalDocumentRef
      ) {
        replaceCanonicalModel(
          resource,
          context.document,
          presentation,
          createMaterial,
          mergeNodePrimitives,
          context.signal,
        );
        return;
      }
      applyPresentation(resource, presentation);
    },
  };
}
