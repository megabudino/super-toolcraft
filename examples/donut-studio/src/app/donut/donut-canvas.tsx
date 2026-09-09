import * as React from "react";
import {
  shouldIncludeToolcraftPreviewBackground,
  type ToolcraftState,
} from "@/toolcraft/runtime";
import {
  readToolcraftOrientationPose,
  useToolcraftDispatch,
  useToolcraftModelOrbitInteraction,
  useToolcraftPipeline,
  useToolcraftSelector,
} from "@/toolcraft/runtime/react";

import {
  DONUT_DEFAULT_PRESET_ORIENTATION,
  DONUT_PRESET_CUSTOM,
  DONUT_PRESET_DEFAULT,
  DONUT_PRESET_TARGET,
} from "./donut-presets";
import {
  DONUT_DEFAULT_PRESET_LIBRARY_JSON,
  DONUT_FACTORY_PRESET_LIBRARY,
  DONUT_PRESET_LIBRARY_TARGET,
  findDonutLibraryPreset,
  parseDonutPresetLibrary,
  readCurrentDonutPresetValues,
  serializeDonutPresetLibrary,
  shouldApplyDonutPresetOnInitialMount,
  updateDonutPresetLibrary,
} from "./donut-preset-library";
import { DONUT_CAMERA } from "./donut-reference";
import {
  createDonutScene,
  resolveDonutPreviewPixelRatio,
  type DonutScene,
  type DonutSceneEvidence,
} from "./donut-scene";
import { readDonutSettings } from "./donut-values";
import styles from "./donut-canvas.module.css";

const selectState = (state: ToolcraftState) => state;
const DEFAULT_ORIENTATION = {
  position: [...DONUT_CAMERA.defaultPosition] as [number, number, number],
  up: [...DONUT_CAMERA.up] as [number, number, number],
};

function writeEvidence(
  canvas: HTMLCanvasElement,
  evidence: DonutSceneEvidence,
  orientation: ReturnType<typeof readToolcraftOrientationPose>,
): void {
  canvas.dataset.donutAntialias = String(evidence.antialias);
  canvas.dataset.donutBackingHeight = String(evidence.backingHeight);
  canvas.dataset.donutBackingWidth = String(evidence.backingWidth);
  canvas.dataset.donutDrawingBufferPreserved = String(
    evidence.drawingBufferPreserved,
  );
  canvas.dataset.donutIcingVisible = String(evidence.icingVisible);
  canvas.dataset.donutOutputSignature = evidence.outputSignature;
  canvas.dataset.donutPixelRatio = String(evidence.pixelRatio);
  canvas.dataset.donutPlateVisible = String(evidence.plateVisible);
  canvas.dataset.donutSprinkleCount = String(evidence.sprinkleCount);
  canvas.dataset.donutSprinkleShape = String(evidence.sprinkleShape);
  canvas.dataset.donutShadowMapUpdates = String(evidence.shadowMapUpdates);
  canvas.dataset.donutOrientation = JSON.stringify(orientation);
  canvas.dataset.donutFrameReady = "true";
}

export function DonutCanvas(): React.JSX.Element {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const sceneRef = React.useRef<DonutScene | null>(null);
  const viewportSizeRef = React.useRef({ height: 0, width: 0 });
  const dispatch = useToolcraftDispatch();
  const pipeline = useToolcraftPipeline();
  const state = useToolcraftSelector(selectState);
  const viewportOffsetRef = React.useRef(state.canvas.offset);
  viewportOffsetRef.current = state.canvas.offset;
  const settings = React.useMemo(
    () => readDonutSettings(state.values),
    [state.values],
  );
  const settingsKey = JSON.stringify(settings);
  const orientation = readToolcraftOrientationPose(
    state.values["scene.orientation"],
    DEFAULT_ORIENTATION,
  );
  const orientationKey = JSON.stringify(orientation);
  const includeBackground = shouldIncludeToolcraftPreviewBackground({ state });
  const [sceneVersion, setSceneVersion] = React.useState(0);
  const [viewportVersion, setViewportVersion] = React.useState(0);
  const [loadState, setLoadState] = React.useState<
    "error" | "loading" | "ready"
  >("loading");

  const icingRegenerationKey = JSON.stringify([
    settings.donut,
    {
      color: settings.icing.color,
      coverage: settings.icing.coverage,
      detail: settings.icing.detail,
      dripAmount: settings.icing.dripAmount,
      dripFrequency: settings.icing.dripFrequency,
      enabled: settings.icing.enabled,
      flow: settings.icing.flow,
      thickness: settings.icing.thickness,
    },
  ]);
  const sprinkleRegenerationKey = JSON.stringify([
    settings.donut,
    settings.icing.thickness,
    {
      coverage: settings.sprinkles.coverage,
      flow: settings.sprinkles.flow,
      metallic: settings.sprinkles.metallic,
      palette: settings.sprinkles.palette,
      rotation: settings.sprinkles.rotation,
      scale: settings.sprinkles.scale,
      seed: settings.sprinkles.seed,
      shape: settings.sprinkles.shape,
      sizeVariation: settings.sprinkles.sizeVariation,
      solidColor: settings.sprinkles.solidColor,
      surfaceOffset: settings.sprinkles.surfaceOffset,
    },
  ]);
  const regenerationRef = React.useRef({
    icing: icingRegenerationKey,
    sprinkles: sprinkleRegenerationKey,
  });
  const presetValue = state.values[DONUT_PRESET_TARGET];
  const presetLibrarySource =
    state.values[DONUT_PRESET_LIBRARY_TARGET] ??
    DONUT_DEFAULT_PRESET_LIBRARY_JSON;
  const currentPresetValues = React.useMemo(
    () => readCurrentDonutPresetValues(state),
    [state.canvas.mode, state.values],
  );
  const [initialPresetState] = React.useState(() => {
    const parsed = parseDonutPresetLibrary(presetLibrarySource);
    const library = parsed.ok
      ? parsed.library
      : DONUT_FACTORY_PRESET_LIBRARY;
    const storedPreset = findDonutLibraryPreset(library, presetValue);
    return {
      library,
      shouldApply: shouldApplyDonutPresetOnInitialMount(
        presetValue,
        currentPresetValues,
        storedPreset?.values,
      ),
    };
  });
  const presetRef = React.useRef(
    initialPresetState.shouldApply ? DONUT_PRESET_CUSTOM : presetValue,
  );
  const skipInitialPresetHistoryRef = React.useRef(
    initialPresetState.shouldApply,
  );
  const lastValidPresetLibraryRef = React.useRef(initialPresetState.library);
  const presetApplicationRef = React.useRef<Readonly<{
    presetId: string;
    signature: string;
  }> | null>(null);
  const currentPresetValuesRef = React.useRef(currentPresetValues);
  currentPresetValuesRef.current = currentPresetValues;
  const currentPresetSignature = JSON.stringify(currentPresetValues);

  React.useLayoutEffect(() => {
    if (presetRef.current === presetValue) return;
    presetRef.current = presetValue;
    const parsed = parseDonutPresetLibrary(
      presetLibrarySource,
      lastValidPresetLibraryRef.current,
    );
    if (parsed.ok) {
      lastValidPresetLibraryRef.current = parsed.library;
    }
    const preset = findDonutLibraryPreset(
      parsed.ok ? parsed.library : lastValidPresetLibraryRef.current,
      presetValue,
    );
    if (!preset) return;
    const skipHistory = skipInitialPresetHistoryRef.current;
    skipInitialPresetHistoryRef.current = false;
    presetApplicationRef.current = {
      presetId: preset.id,
      signature: JSON.stringify(preset.values),
    };
    for (const [target, value] of Object.entries(preset.values)) {
      dispatch({
        history: skipHistory ? "skip" : "merge",
        label: `Apply ${preset.label} preset`,
        target,
        type: "controls.setValue",
        value,
      });
    }
  }, [dispatch, presetLibrarySource, presetValue]);

  React.useLayoutEffect(() => {
    if (presetValue === DONUT_PRESET_CUSTOM) return;
    dispatch({
      history: "skip",
      label: "Use preset Infinity canvas",
      target: "canvas.infinity",
      type: "controls.setValue",
      value: true,
    });
    dispatch({
      history: "skip",
      label: "Use shared preset camera",
      target: "scene.orientation",
      type: "controls.setValue",
      value: DONUT_DEFAULT_PRESET_ORIENTATION,
    });
    dispatch({
      offset: viewportOffsetRef.current,
      type: "canvas.setViewport",
      zoom: 170,
    });
  }, [dispatch, presetValue]);

  React.useLayoutEffect(() => {
    const parsed = parseDonutPresetLibrary(
      presetLibrarySource,
      lastValidPresetLibraryRef.current,
    );
    if (parsed.ok) {
      lastValidPresetLibraryRef.current = parsed.library;
      const normalizedLibrarySource = serializeDonutPresetLibrary(
        parsed.library,
      );
      if (presetLibrarySource !== normalizedLibrarySource) {
        dispatch({
          history: "skip",
          label: "Normalize donut preset viewport",
          target: DONUT_PRESET_LIBRARY_TARGET,
          type: "controls.setValue",
          value: normalizedLibrarySource,
        });
        return;
      }
    }
    if (!parsed.ok || presetValue === DONUT_PRESET_CUSTOM) {
      return;
    }

    const application = presetApplicationRef.current;
    if (application) {
      if (
        application.presetId === presetValue &&
        application.signature === currentPresetSignature
      ) {
        presetApplicationRef.current = null;
      }
      return;
    }

    const storedPreset = findDonutLibraryPreset(parsed.library, presetValue);
    if (
      !storedPreset ||
      JSON.stringify(storedPreset.values) === currentPresetSignature
    ) {
      return;
    }

    const updated = updateDonutPresetLibrary(
      parsed.library,
      storedPreset.id,
      currentPresetValuesRef.current,
    );
    lastValidPresetLibraryRef.current = updated;
    dispatch({
      history: "skip",
      label: `Save ${storedPreset.label} preset`,
      target: DONUT_PRESET_LIBRARY_TARGET,
      type: "controls.setValue",
      value: serializeDonutPresetLibrary(updated),
    });
  }, [
    currentPresetSignature,
    dispatch,
    presetLibrarySource,
    presetValue,
  ]);

  React.useEffect(() => {
    if (
      regenerationRef.current.icing !== icingRegenerationKey &&
      settings.icing.clearMode !== "none"
    ) {
      dispatch({
        history: "merge",
        label: "Rebuild icing",
        target: "icing.clearMode",
        type: "controls.setValue",
        value: "none",
      });
    }
    regenerationRef.current.icing = icingRegenerationKey;
  }, [dispatch, icingRegenerationKey, settings.icing.clearMode]);

  React.useEffect(() => {
    if (
      regenerationRef.current.sprinkles !== sprinkleRegenerationKey &&
      settings.sprinkles.clear
    ) {
      dispatch({
        history: "merge",
        label: "Rebuild sprinkles",
        target: "sprinkles.clear",
        type: "controls.setValue",
        value: false,
      });
    }
    regenerationRef.current.sprinkles = sprinkleRegenerationKey;
  }, [dispatch, settings.sprinkles.clear, sprinkleRegenerationKey]);

  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    setLoadState("loading");
    const width = Math.max(
      1,
      Math.round(canvas.clientWidth || state.canvas.size.width),
    );
    const height = Math.max(
      1,
      Math.round(canvas.clientHeight || state.canvas.size.height),
    );
    viewportSizeRef.current = { height, width };
    const pixelRatio = resolveDonutPreviewPixelRatio(
      window.devicePixelRatio,
      settings.renderScale,
      state.canvas.zoom,
    );

    void createDonutScene({
      canvas,
      height,
      orientation,
      pipeline,
      pixelRatio,
      preserveDrawingBuffer: true,
      settings,
      width,
    })
      .then((scene) => {
        if (cancelled) {
          scene.dispose();
          return;
        }
        sceneRef.current = scene;
        setLoadState("ready");
        setSceneVersion((version) => version + 1);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadState("error");
        console.error("Donut scene failed to load.", error);
      });

    return () => {
      cancelled = true;
      const scene = sceneRef.current;
      sceneRef.current = null;
      scene?.dispose();
    };
  }, [pipeline]);

  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const width = Math.max(1, Math.round(entry.contentRect.width));
      const height = Math.max(1, Math.round(entry.contentRect.height));
      if (
        viewportSizeRef.current.height === height &&
        viewportSizeRef.current.width === width
      ) {
        return;
      }
      viewportSizeRef.current = { height, width };
      setViewportVersion((version) => version + 1);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const scene = sceneRef.current;
    if (!canvas || !scene || loadState !== "ready") return;
    let cancelled = false;
    let animationFrame = window.requestAnimationFrame(() => {
      const viewportSize = viewportSizeRef.current;
      const width = Math.max(
        1,
        viewportSize.width || state.canvas.size.width,
      );
      const height = Math.max(
        1,
        viewportSize.height || state.canvas.size.height,
      );
      scene.resize(
        width,
        height,
        resolveDonutPreviewPixelRatio(
          window.devicePixelRatio,
          settings.renderScale,
          state.canvas.zoom,
        ),
      );
      scene.setOrientation(orientation);
      void scene
        .updateSettings(settings)
        .then(() => (cancelled ? null : scene.render(includeBackground)))
        .then((evidence) => {
          if (!cancelled && evidence) {
            writeEvidence(canvas, evidence, orientation);
          }
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            canvas.dataset.donutFrameReady = "false";
            console.error("Donut frame failed to render.", error);
          }
        });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    };
  }, [
    includeBackground,
    loadState,
    orientationKey,
    sceneVersion,
    settingsKey,
    state.canvas.size.height,
    state.canvas.size.width,
    state.canvas.zoom,
    viewportVersion,
  ]);

  const hitTest = React.useCallback(
    (clientX: number, clientY: number) =>
      sceneRef.current?.hitTest(clientX, clientY) ?? false,
    [],
  );
  const orbitHandlers = useToolcraftModelOrbitInteraction<HTMLCanvasElement>({
    enabled: loadState === "ready",
    hitTest,
    target: "scene.orientation",
  });

  return (
    <div
      className={styles.root}
      data-background-color={settings.background.color}
      data-background-visible={includeBackground ? "true" : "false"}
      data-canvas-height={state.canvas.size.height}
      data-canvas-width={state.canvas.size.width}
      data-donut-shape={JSON.stringify(settings.donut)}
      data-donut-renderer=""
      data-export-image-format={settings.image.format}
      data-export-image-resolution={settings.image.resolution}
      data-icing-clear-mode={settings.icing.clearMode}
      data-icing-color={settings.icing.color}
      data-icing-enabled={settings.icing.enabled ? "true" : "false"}
      data-load-state={loadState}
      data-materials={JSON.stringify(settings.materials)}
      data-orientation={orientationKey}
      data-plate-visible={settings.plateVisible ? "true" : "false"}
      data-render-scale={settings.renderScale}
      data-sprinkle-clear={settings.sprinkles.clear ? "true" : "false"}
      data-sprinkle-flow={settings.sprinkles.flow}
      data-sprinkle-metallic={settings.sprinkles.metallic}
      data-sprinkle-palette={settings.sprinkles.palette}
      data-sprinkle-scale={settings.sprinkles.scale}
      data-sprinkle-shape={settings.sprinkles.shape}
      data-sprinkle-solid-color={settings.sprinkles.solidColor}
      data-studio={JSON.stringify(settings.studio)}
      data-toolcraft-product-output="donut-3d-scene"
    >
      <canvas
        {...orbitHandlers}
        aria-label="Interactive 3D donut"
        className={styles.canvas}
        data-canvas-model-layer="donut-scene"
        data-donut-canvas=""
        data-engine="three.js-r185"
        data-toolcraft-generated-output=""
        data-toolcraft-model-orbit-surface="true"
        ref={canvasRef}
      />
    </div>
  );
}
