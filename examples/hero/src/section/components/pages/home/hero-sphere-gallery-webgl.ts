import { clampHeroBacking, getHeroRenderMargin } from './hero-dispersion-shader';
import type { HeroGalleryImageSource } from './hero-gallery-sources';
import {
  HERO_MOTION_EFFECTS_DECAY_SECONDS,
  HERO_MOTION_EFFECTS_EPSILON,
  stepHeroMotionEffectsEnvelope,
} from './hero-motion-effects-envelope';
import {
  advanceHeroAutoScrollGlide,
  beginHeroAutoScrollGlide,
  cancelHeroAutoScrollGlide,
  consumeHeroAutoScrollCadence,
  createHeroAutoScrollCadenceState,
  createHeroAutoScrollState,
  createHeroAngularMotionState,
  createHeroPanRateWindow,
  getHeroAutoScrollDurationMultiplier,
  getHeroPanelZoneBounds,
  getHeroPeriodicPanDelta,
  pushHeroPanFrameDelta,
  readHeroPanRate,
  stepHeroAngularMotionState,
} from './hero-sphere-gallery-motion';
import {
  createHeroSphereGalleryPasses,
  type HeroSphereGalleryPasses,
} from './hero-sphere-gallery-passes';
import { createHeroSphereTextureCache } from './hero-sphere-gallery-textures';
import type { HeroSphereTextureCache } from './hero-sphere-gallery-textures';
import {
  advanceHeroPanelPhase,
  getHeroLensOrigin,
  getHeroPanelPeriod,
  getHeroPanelPitch,
  layoutHeroSphereGallery,
} from './hero-sphere-layout';
import { HERO_DESKTOP_MIN_WIDTH_PX } from './hero-responsive-settings';
import type { HeroSceneSettings } from './hero-scene-settings';

const motionSmoothing = 0.3;
const motionEpsilon = 0.001;
const compactTextureLoadingProfile = {
  maxConcurrentLoads: 1,
  maxTextureDimension: 828,
} as const;
const desktopTextureLoadingProfile = {
  maxConcurrentLoads: Number.POSITIVE_INFINITY,
  maxTextureDimension: 2048,
} as const;

function configureTextureLoading(cache: HeroSphereTextureCache, sceneWidth: number) {
  cache.configure(
    sceneWidth >= HERO_DESKTOP_MIN_WIDTH_PX
      ? desktopTextureLoadingProfile
      : compactTextureLoadingProfile,
  );
}

function isHeroGrainEffectActive(settings: HeroSceneSettings) {
  return settings.effects.grain.enabled && settings.effects.grain.amount > 0;
}

function isHeroCrtEffectActive(settings: HeroSceneSettings) {
  const crt = settings.effects.crt;
  return crt.enabled && Math.max(crt.scanlines, crt.flicker, crt.chroma / 8) > 0;
}

function getHeroFieldSettingsKey(settings: HeroSceneSettings) {
  const sphere = settings.gallery.sphere;
  return [
    sphere.bendX,
    sphere.bendY,
    sphere.width,
    sphere.height,
    sphere.depth,
    settings.perspective,
    settings.vanishingPoint.x,
    settings.vanishingPoint.y,
    settings.gallery.position.x,
    settings.gallery.position.y,
  ].join(':');
}

export interface HeroSphereGalleryRendererState {
  autoScrollOffset: Readonly<{ x: number; y: number }>;
  effect: 'post';
  phases: readonly number[];
  readyIds: readonly string[];
  renderer: 'fallback' | 'pending' | 'webgl';
  settledIds: readonly string[];
  turns: number;
}

export interface HeroSphereGalleryRenderer {
  captureFrame(): Promise<Blob | null>;
  dispose(): void;
  getState(): HeroSphereGalleryRendererState;
  prepareResources(): void;
  releaseResources(): void;
  renderFrame(): boolean;
  renderVideoFrame(frame: HeroSphereGalleryVideoFrame): boolean;
  setActive(active: boolean): void;
  setReducedMotion(reducedMotion: boolean): void;
  setStateListener(listener: (() => void) | null): void;
  setSettings(settings: HeroSceneSettings): void;
  setSize(width: number, height: number, pixelRatio: number): void;
  setSources(rowSources: readonly (readonly HeroGalleryImageSource[])[]): void;
}

export interface HeroSphereGalleryVideoFrame {
  loopDurationMs: number;
  loopProgress: number;
  offset: Readonly<{ x: number; y: number }>;
  previousOffset: Readonly<{ x: number; y: number }>;
  reset?: boolean;
  timestamp: number;
}

interface DrawOptions {
  advancePhases?: boolean;
  autoScrollOffset?: Readonly<{ x: number; y: number }>;
  force?: boolean;
  loopDurationMs?: number;
  loopProgress?: number;
  previousAutoScrollOffset?: Readonly<{ x: number; y: number }>;
}

interface HeroSphereGalleryRendererDependencies {
  cancelAnimationFrame(handle: number): void;
  clearTimeout(handle: number): void;
  createPasses(gl: WebGLRenderingContext): HeroSphereGalleryPasses;
  createTextureCache(
    gl: WebGLRenderingContext,
    schedule: () => void,
    onSettled: () => void,
  ): HeroSphereTextureCache;
  now(): number;
  random(): number;
  requestAnimationFrame(callback: (timestamp: number) => void): number;
  setTimeout(callback: () => void, delay: number): number;
}

const defaultRendererDependencies: HeroSphereGalleryRendererDependencies = {
  cancelAnimationFrame: (handle) => cancelAnimationFrame(handle),
  clearTimeout: (handle) => window.clearTimeout(handle),
  createPasses: createHeroSphereGalleryPasses,
  createTextureCache: createHeroSphereTextureCache,
  now: () => performance.now(),
  random: () => Math.random(),
  requestAnimationFrame: (callback) => requestAnimationFrame(callback),
  setTimeout: (callback, delay) => window.setTimeout(callback, delay),
};

export function createHeroSphereGalleryRenderer(
  canvas: HTMLCanvasElement,
  dependencies: HeroSphereGalleryRendererDependencies = defaultRendererDependencies,
): HeroSphereGalleryRenderer {
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    stencil: false,
  });
  if (!gl) throw new Error('The sphere gallery requires WebGL support.');

  let active = true;
  let autoScroll = createHeroAutoScrollState();
  let autoScrollCadence = createHeroAutoScrollCadenceState();
  let autoScrollDurationMultiplier = 1;
  let autoScrollTimer: number | null = null;
  let autoScrollTimerGeneration = 0;
  let contextLost = false;
  let contextRecovering = false;
  let cachedGeometryKey: string | null = null;
  let cachedPanelZoneBounds: ReturnType<typeof getHeroPanelZoneBounds> | null = null;
  let disposed = false;
  let fieldDirty = true;
  let fieldSettingsKey: string | null = null;
  let frame: number | null = null;
  let hasMeasuredSize = false;
  let height = 1;
  let lastFrameTimestamp = 0;
  let lastPhaseTimestamp = 0;
  let phaseCarries: number[] = [];
  let phases: number[] = [];
  let previousPan: { turns: number; x: number; y: number } | null = null;
  let previousRenderedPan: { turns: number; x: number; y: number } | null = null;
  let previousPeriods: number[] = [];
  let reducedMotion = false;
  let settings: HeroSceneSettings | null = null;
  let stateListener: (() => void) | null = null;
  let rowSources: readonly (readonly HeroGalleryImageSource[])[] = [];
  let turns = 0;
  let width = 1;
  let pixelRatio = 1;
  let panMotion = createHeroAngularMotionState();
  let panRateWindow = createHeroPanRateWindow();
  let grainEnvelope = 0;
  let crtEnvelope = 0;
  let effectTime = 0;
  let passes: HeroSphereGalleryPasses | null = null;
  let textures: HeroSphereTextureCache | null = null;
  let resourcesRequested = true;

  const resetMotionEffectsState = () => {
    panMotion = createHeroAngularMotionState();
    panRateWindow = createHeroPanRateWindow();
    grainEnvelope = 0;
    crtEnvelope = 0;
    previousRenderedPan = null;
  };

  const areCurrentSourcesSettled = () => {
    const sources = rowSources.flat();
    return sources.length === 0 || textures?.getSettledSourceIds(sources).length === sources.length;
  };

  const handleTextureSettled = () => {
    if (contextRecovering && areCurrentSourcesSettled()) contextRecovering = false;
    stateListener?.();
  };

  const requestFrame = () => {
    if (
      !disposed &&
      active &&
      !contextLost &&
      passes?.isReady() &&
      textures &&
      areCurrentSourcesSettled() &&
      frame === null
    ) {
      frame = dependencies.requestAnimationFrame(draw);
    }
  };

  const schedule = () => {
    if (passes?.isReady() && textures) requestFrame();
  };

  const clearAutoScrollTimer = () => {
    autoScrollTimerGeneration += 1;
    if (autoScrollTimer === null) return;
    dependencies.clearTimeout(autoScrollTimer);
    autoScrollTimer = null;
  };

  const canAutoScroll = () =>
    !disposed &&
    active &&
    !reducedMotion &&
    !contextLost &&
    passes?.isReady() === true &&
    textures !== null &&
    settings !== null &&
    settings.gallery.type === 'sphere' &&
    settings.gallery.sphere.autoScroll.enabled &&
    autoScroll.mode === 'idle';

  const armAutoScrollTimer = () => {
    clearAutoScrollTimer();
    if (
      !settings ||
      settings.gallery.type !== 'sphere' ||
      !settings.gallery.sphere.autoScroll.enabled ||
      !active ||
      reducedMotion ||
      contextLost ||
      disposed ||
      !passes?.isReady() ||
      !textures ||
      autoScroll.mode !== 'idle'
    ) {
      return;
    }

    const generation = autoScrollTimerGeneration;
    autoScrollTimer = dependencies.setTimeout(() => {
      if (generation !== autoScrollTimerGeneration || autoScrollTimer === null) return;
      autoScrollTimer = null;
      autoScrollTimerGeneration += 1;
      if (!canAutoScroll()) return;
      const currentSettings = settings;
      if (!currentSettings) return;
      const currentRows = currentSettings.gallery.sphere.rows;
      lastFrameTimestamp = dependencies.now();
      const consumedCadence = consumeHeroAutoScrollCadence(autoScrollCadence, dependencies.random);
      autoScrollCadence = consumedCadence.state;
      autoScroll = beginHeroAutoScrollGlide(
        autoScroll,
        currentRows.length,
        dependencies.random,
        consumedCadence.glideKind,
      );
      autoScrollDurationMultiplier = getHeroAutoScrollDurationMultiplier(autoScroll);
      schedule();
    }, settings.gallery.sphere.autoScroll.interval * 1000);
  };

  const resizePasses = (targetPasses: HeroSphereGalleryPasses) => {
    if (!settings || !hasMeasuredSize) return false;
    const renderMargin = getHeroRenderMargin(settings, width);
    const expanded = clampHeroBacking(
      width + renderMargin * 2,
      height + renderMargin * 2,
      pixelRatio,
    );
    const backingRatio = Math.min(
      expanded.width / (width + renderMargin * 2),
      expanded.height / (height + renderMargin * 2),
    );
    const backing = {
      height: Math.max(1, Math.round(height * backingRatio)),
      width: Math.max(1, Math.round(width * backingRatio)),
    };
    if (canvas.width !== backing.width || canvas.height !== backing.height) {
      canvas.width = backing.width;
      canvas.height = backing.height;
    }
    return targetPasses.setSize({
      backingHeight: backing.height,
      backingWidth: backing.width,
      height,
      horizontalMargin: renderMargin,
      verticalMargin: renderMargin,
      width,
    });
  };

  const disposeResources = () => {
    textures?.dispose();
    passes?.dispose();
    textures = null;
    passes = null;
  };

  const rebuildResources = () => {
    if (disposed || contextLost || !resourcesRequested || passes || textures) return;
    let nextPasses: HeroSphereGalleryPasses | null = null;
    let nextTextures: HeroSphereTextureCache | null = null;
    try {
      nextPasses = dependencies.createPasses(gl);
      nextTextures = dependencies.createTextureCache(gl, schedule, handleTextureSettled);
      configureTextureLoading(nextTextures, width);
      if (settings) resizePasses(nextPasses);
      nextTextures.sync(rowSources.flat());
    } catch (error) {
      nextTextures?.dispose();
      nextPasses?.dispose();
      throw error;
    }
    passes = nextPasses;
    textures = nextTextures;
    fieldDirty = true;
  };

  rebuildResources();

  function draw(timestamp: number, options?: DrawOptions) {
    frame = null;
    const currentPasses = passes;
    const currentTextures = textures;
    if (
      disposed ||
      (!active && !options?.force) ||
      contextLost ||
      !settings ||
      !currentPasses?.isReady() ||
      !currentTextures
    )
      return;
    const loopProgress = options?.loopProgress;
    const isVideoLoopFrame = loopProgress !== undefined && options?.loopDurationMs !== undefined;
    const shouldAdvancePhases = options?.advancePhases !== false && !isVideoLoopFrame;
    const sphere = settings.gallery.sphere;
    const rows = sphere.rows;
    const renderMargin = getHeroRenderMargin(settings, width);
    const frameDtMs = lastFrameTimestamp === 0 ? 1000 / 60 : timestamp - lastFrameTimestamp;
    const frameDt = Math.min(50, Math.max(0, frameDtMs)) / 1000;
    lastFrameTimestamp = timestamp;
    const autoScrollOffsetOverride = options?.autoScrollOffset;
    const wasAutoScrollGliding = autoScroll.mode === 'gliding';
    if (!autoScrollOffsetOverride && shouldAdvancePhases && autoScroll.mode === 'gliding') {
      autoScroll = advanceHeroAutoScrollGlide(
        autoScroll,
        frameDt,
        sphere.autoScroll.duration * autoScrollDurationMultiplier,
      );
    }
    const completedAutoScrollGlide =
      !autoScrollOffsetOverride && wasAutoScrollGliding && autoScroll.mode === 'idle';
    if (completedAutoScrollGlide) autoScrollDurationMultiplier = 1;
    const renderedAutoScrollOffset = autoScrollOffsetOverride ?? autoScroll.offset;
    const effectivePan = {
      turns,
      x: sphere.pan.x + renderedAutoScrollOffset.x,
      y: sphere.pan.y + renderedAutoScrollOffset.y,
    };
    while (phases.length < rows.length) phases.push(0);
    phases = phases.slice(0, rows.length);
    while (phaseCarries.length < rows.length) phaseCarries.push(0);
    phaseCarries = phaseCarries.slice(0, rows.length);
    const principal = {
      x: (settings.vanishingPoint.x / 100 + settings.gallery.position.x * 0.36) * width,
      y: (settings.vanishingPoint.y / 100 + settings.gallery.position.y * 0.28) * height,
    };
    const geometryKey = [
      fieldSettingsKey ?? getHeroFieldSettingsKey(settings),
      principal.x,
      principal.y,
      width,
      height,
      canvas.width,
      canvas.height,
    ].join(':');
    if (geometryKey !== cachedGeometryKey || cachedPanelZoneBounds === null) {
      cachedPanelZoneBounds = getHeroPanelZoneBounds(
        {
          bendX: sphere.bendX,
          bendY: sphere.bendY,
          focal: settings.perspective,
          principal,
          rx: sphere.width,
          ry: sphere.height,
          rz: sphere.depth,
        },
        { height, width },
      );
      cachedGeometryKey = geometryKey;
      fieldDirty = true;
    }
    const createLayout = () =>
      layoutHeroSphereGallery({
        bendX: sphere.bendX,
        bendY: sphere.bendY,
        bleed: { horizontal: renderMargin, vertical: renderMargin },
        cardHeight: settings!.gallery.cardHeight,
        focal: settings!.perspective,
        gap: settings!.gallery.cardGap,
        pan: effectivePan,
        phaseCarries,
        phases,
        principal,
        rowGap: sphere.rowGap,
        rowSources,
        rows,
        rx: sphere.width,
        ry: sphere.height,
        rz: sphere.depth,
        viewport: { height, width },
      });
    let layout = createLayout();

    if (isVideoLoopFrame) {
      const durationSeconds = Math.max(0, options?.loopDurationMs ?? 0) / 1_000;
      const progress = ((loopProgress % 1) + 1) % 1;
      phases = layout.periods.map((period, index) => {
        const safePeriod = Math.max(1, period);
        const rawCycles =
          (((rows[index]?.speed ?? 0) * (Math.PI / 180) * Math.max(1, sphere.width)) /
            safePeriod) *
          durationSeconds;
        if (Math.abs(rawCycles) < 1e-6) return 0;
        const cycleCount = Math.sign(rawCycles) * Math.max(1, Math.round(Math.abs(rawCycles)));
        const phase = cycleCount * safePeriod * progress;
        return ((phase % safePeriod) + safePeriod) % safePeriod;
      });
      phaseCarries = rowSources.map(() => 0);
      layout = createLayout();
    }

    const phaseDt =
      !shouldAdvancePhases || lastPhaseTimestamp === 0 ? 0 : timestamp - lastPhaseTimestamp;
    if (shouldAdvancePhases) lastPhaseTimestamp = timestamp;
    const periodChanged = layout.periods.map(
      (period, index) =>
        previousPeriods[index] !== undefined &&
        Math.abs(period - (previousPeriods[index] ?? period)) > 0.001,
    );
    phaseCarries = phaseCarries.map((carry, index) => (periodChanged[index] ? 0 : carry));
    if (shouldAdvancePhases && !reducedMotion) {
      phases = phases.map((phase, index) => {
        const period = layout.periods[index] ?? 1;
        const next = advanceHeroPanelPhase(
          phase,
          rows[index]?.speed ?? 0,
          phaseDt,
          period,
          previousPeriods[index] ?? period,
          sphere.width,
        );
        if (!periodChanged[index]) {
          if (next < phase - period / 2) phaseCarries[index] = (phaseCarries[index] ?? 0) - 1;
          else if (next > phase + period / 2) {
            phaseCarries[index] = (phaseCarries[index] ?? 0) + 1;
          }
        }
        return next;
      });
    }
    previousPeriods = layout.periods;

    const pitch = getHeroPanelPitch(settings.gallery.cardHeight, sphere.rowGap);
    const panelPeriod = getHeroPanelPeriod(rows.length, pitch);
    const origin = getHeroLensOrigin({
      pan: effectivePan,
      period: panelPeriod,
      ry: sphere.height,
      turns,
    });
    const previousEffectivePan = options?.previousAutoScrollOffset
      ? {
          turns: effectivePan.turns,
          x: sphere.pan.x + options.previousAutoScrollOffset.x,
          y: sphere.pan.y + options.previousAutoScrollOffset.y,
        }
      : previousRenderedPan;
    const periodicPanDelta = previousEffectivePan
      ? getHeroPeriodicPanDelta(effectivePan, previousEffectivePan)
      : { x: 0, y: 0 };
    pushHeroPanFrameDelta(
      panRateWindow,
      {
        phi: (-periodicPanDelta.y * (panelPeriod / 2)) / Math.max(1, sphere.height),
        theta: periodicPanDelta.x * Math.PI,
      },
      frameDtMs,
    );
    previousRenderedPan = { ...effectivePan };
    const targetPanRate = readHeroPanRate(panRateWindow);
    panMotion = isVideoLoopFrame
      ? targetPanRate
      : stepHeroAngularMotionState(panMotion, targetPanRate, motionSmoothing);
    const isGrainEffectActive = !reducedMotion && isHeroGrainEffectActive(settings);
    const isCrtEffectActive = !reducedMotion && isHeroCrtEffectActive(settings);
    grainEnvelope = !isGrainEffectActive
      ? 0
      : isVideoLoopFrame
        ? 1
        : stepHeroMotionEffectsEnvelope(
          grainEnvelope,
          panMotion,
          frameDt,
          false,
          HERO_MOTION_EFFECTS_DECAY_SECONDS,
        );
    crtEnvelope = !isCrtEffectActive
      ? 0
      : isVideoLoopFrame
        ? 1
        : stepHeroMotionEffectsEnvelope(
          crtEnvelope,
          panMotion,
          frameDt,
          false,
          settings.effects.crt.fade,
        );
    effectTime = isVideoLoopFrame ? 0 : (effectTime + frameDt) % 1000;
    const bounds = cachedPanelZoneBounds;

    currentPasses.drawScene({ layout, principal, rowSources, settings, textures: currentTextures });
    if (fieldDirty) {
      currentPasses.drawField(settings, principal);
      fieldDirty = false;
    }
    currentPasses.drawPost({
      bounds,
      crtEnvelope,
      effectTime,
      frameDt,
      grainEnvelope,
      panRate: panMotion,
      phi0: origin.phi0,
      pitch,
      reducedMotion,
      settings,
    });

    const hasAutonomousRows = !reducedMotion && rows.some((row) => row.speed !== 0);
    const hasPanMotion = Math.hypot(panMotion.theta, panMotion.phi) > motionEpsilon;
    const hasPanRate = Math.hypot(targetPanRate.theta, targetPanRate.phi) > motionEpsilon;
    const hasGrainEffectTail = isGrainEffectActive && grainEnvelope > HERO_MOTION_EFFECTS_EPSILON;
    const hasCrtEffectTail = isCrtEffectActive && crtEnvelope > HERO_MOTION_EFFECTS_EPSILON;
    if (!autoScrollOffsetOverride && shouldAdvancePhases && autoScroll.mode === 'gliding') schedule();
    if (shouldAdvancePhases && completedAutoScrollGlide) armAutoScrollTimer();
    if (
      shouldAdvancePhases &&
      (hasAutonomousRows || hasPanMotion || hasPanRate || hasGrainEffectTail || hasCrtEffectTail)
    ) {
      schedule();
    }
  }

  const handleContextLost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    contextRecovering = false;
    clearAutoScrollTimer();
    resetMotionEffectsState();
    if (frame !== null) dependencies.cancelAnimationFrame(frame);
    frame = null;
    disposeResources();
    stateListener?.();
  };
  const handleContextRestored = () => {
    contextLost = false;
    fieldDirty = true;
    resetMotionEffectsState();
    try {
      rebuildResources();
    } catch {
      contextLost = true;
      stateListener?.();
      return;
    }
    contextRecovering = !areCurrentSourcesSettled();
    schedule();
    armAutoScrollTimer();
    stateListener?.();
  };
  canvas.addEventListener('webglcontextlost', handleContextLost, false);
  canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

  const renderCurrentFrame = () => {
    if (
      disposed ||
      contextLost ||
      !settings ||
      !passes?.isReady() ||
      !textures ||
      !areCurrentSourcesSettled()
    ) {
      return false;
    }
    if (frame !== null) dependencies.cancelAnimationFrame(frame);
    frame = null;
    draw(dependencies.now(), { advancePhases: false, force: true });
    gl.finish();
    return true;
  };

  const resetVideoFrameState = () => {
    if (frame !== null) dependencies.cancelAnimationFrame(frame);
    frame = null;
    clearAutoScrollTimer();
    autoScroll = createHeroAutoScrollState();
    autoScrollCadence = createHeroAutoScrollCadenceState();
    autoScrollDurationMultiplier = 1;
    phases = rowSources.map(() => 0);
    phaseCarries = rowSources.map(() => 0);
    previousPeriods = [];
    previousPan = null;
    lastFrameTimestamp = 0;
    lastPhaseTimestamp = 0;
    effectTime = 0;
    resetMotionEffectsState();
  };

  const renderExportVideoFrame = (videoFrame: HeroSphereGalleryVideoFrame) => {
    if (
      disposed ||
      contextLost ||
      !settings ||
      !passes?.isReady() ||
      !textures ||
      !areCurrentSourcesSettled()
    ) {
      return false;
    }
    if (videoFrame.reset) resetVideoFrameState();
    if (frame !== null) dependencies.cancelAnimationFrame(frame);
    frame = null;
    draw(videoFrame.timestamp, {
      advancePhases: false,
      autoScrollOffset: videoFrame.offset,
      force: true,
      loopDurationMs: videoFrame.loopDurationMs,
      loopProgress: videoFrame.loopProgress,
      previousAutoScrollOffset: videoFrame.previousOffset,
    });
    gl.finish();
    return true;
  };

  return {
    captureFrame() {
      if (!renderCurrentFrame()) return Promise.resolve(null);
      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
          schedule();
        }, 'image/png');
      });
    },
    dispose() {
      disposed = true;
      resourcesRequested = false;
      clearAutoScrollTimer();
      if (frame !== null) dependencies.cancelAnimationFrame(frame);
      frame = null;
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      disposeResources();
    },
    getState() {
      return {
        autoScrollOffset: { ...autoScroll.offset },
        effect: 'post',
        phases: [...phases],
        readyIds: textures?.getReadySourceIds(rowSources.flat()) ?? [],
        renderer:
          contextLost ||
          contextRecovering ||
          (resourcesRequested && (!passes?.isReady() || !textures))
            ? 'fallback'
            : 'webgl',
        settledIds: textures?.getSettledSourceIds(rowSources.flat()) ?? [],
        turns,
      };
    },
    prepareResources() {
      if (disposed) return;
      resourcesRequested = true;
      if (contextLost) return;
      try {
        rebuildResources();
      } catch {
        stateListener?.();
        return;
      }
      if (active) {
        armAutoScrollTimer();
        schedule();
      }
      stateListener?.();
    },
    releaseResources() {
      if (disposed || (!resourcesRequested && !passes && !textures)) return;
      resourcesRequested = false;
      clearAutoScrollTimer();
      if (frame !== null) dependencies.cancelAnimationFrame(frame);
      frame = null;
      resetMotionEffectsState();
      disposeResources();
      stateListener?.();
    },
    renderFrame() {
      return renderCurrentFrame();
    },
    renderVideoFrame(videoFrame) {
      return renderExportVideoFrame(videoFrame);
    },
    setActive(nextActive) {
      active = nextActive;
      lastFrameTimestamp = 0;
      lastPhaseTimestamp = 0;
      if (!active) {
        autoScroll = cancelHeroAutoScrollGlide(autoScroll);
        autoScrollDurationMultiplier = 1;
        clearAutoScrollTimer();
        resetMotionEffectsState();
      }
      if (active) {
        armAutoScrollTimer();
        schedule();
      } else if (frame !== null) {
        dependencies.cancelAnimationFrame(frame);
        frame = null;
      }
    },
    setReducedMotion(nextReducedMotion) {
      reducedMotion = nextReducedMotion;
      if (reducedMotion) {
        autoScroll = cancelHeroAutoScrollGlide(autoScroll);
        autoScrollDurationMultiplier = 1;
        clearAutoScrollTimer();
        resetMotionEffectsState();
      } else {
        armAutoScrollTimer();
      }
      schedule();
    },
    setStateListener(listener) {
      stateListener = listener;
    },
    setSettings(nextSettings) {
      const nextFieldSettingsKey = getHeroFieldSettingsKey(nextSettings);
      if (nextFieldSettingsKey !== fieldSettingsKey) fieldDirty = true;
      fieldSettingsKey = nextFieldSettingsKey;
      const nextPan = nextSettings.gallery.sphere.pan;
      if (Number.isInteger(nextPan.turns)) {
        turns = nextPan.turns ?? 0;
      } else if (previousPan) {
        const delta = nextPan.x - previousPan.x;
        if (delta < -1) turns += 1;
        else if (delta > 1) turns -= 1;
      }
      const resolvedPan = { turns, x: nextPan.x, y: nextPan.y };
      const authoredPanChanged =
        previousPan !== null &&
        (resolvedPan.turns !== previousPan.turns ||
          resolvedPan.x !== previousPan.x ||
          resolvedPan.y !== previousPan.y);
      previousPan = resolvedPan;
      settings = nextSettings;
      if (passes) resizePasses(passes);
      if (reducedMotion || !isHeroGrainEffectActive(nextSettings)) grainEnvelope = 0;
      if (reducedMotion || !isHeroCrtEffectActive(nextSettings)) crtEnvelope = 0;
      if (
        nextSettings.gallery.type !== 'sphere' ||
        !nextSettings.gallery.sphere.autoScroll.enabled
      ) {
        autoScroll = createHeroAutoScrollState();
        autoScrollCadence = createHeroAutoScrollCadenceState();
        autoScrollDurationMultiplier = 1;
        clearAutoScrollTimer();
        schedule();
        return;
      }
      if (authoredPanChanged) {
        autoScroll = cancelHeroAutoScrollGlide(autoScroll);
        autoScrollDurationMultiplier = 1;
      }
      armAutoScrollTimer();
      schedule();
    },
    setSize(nextWidth, nextHeight, nextPixelRatio) {
      width = Math.max(1, nextWidth);
      height = Math.max(1, nextHeight);
      pixelRatio = Math.max(0.5, Math.min(2, nextPixelRatio));
      hasMeasuredSize = true;
      if (textures) configureTextureLoading(textures, width);
      if (passes) resizePasses(passes);
      schedule();
    },
    setSources(nextRowSources) {
      if (frame !== null) dependencies.cancelAnimationFrame(frame);
      frame = null;
      rowSources = nextRowSources;
      textures?.sync(rowSources.flat());
      schedule();
    },
  };
}
