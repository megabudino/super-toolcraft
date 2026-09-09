import type { ToolcraftImageAsset, ToolcraftState } from "@/toolcraft/runtime";

import {
  createSpiralGlRenderer,
  spiralShadowOffsetScale,
  type SpiralGlCard,
  type SpiralGlRenderer,
  type SpiralGlTexture,
} from "./spiral-gallery-gl";
import {
  getSpiralGalleryMediaSignature,
  readSpiralGallerySettings,
  selectSpiralGalleryImages,
  type SpiralGallerySettings,
} from "./spiral-gallery-settings";
import {
  advanceStackScroll,
  computeStackCardPlacement,
  computeStackRelative,
  resolveStackScrollSpring,
  stackDistanceSoftening,
  stackMinimumSnapStrength,
  stackSceneScale,
  stackSceneVerticalOffset,
} from "./spiral-gallery-stack";
import type {
  SpiralGalleryFrameSnapshot,
  SpiralGalleryRenderRequest,
  SpiralGalleryResource,
} from "./spiral-gallery-types";

type CardMesh = Omit<SpiralGlCard, "position"> & {
  position: [number, number, number];
  sourceIndex: number;
};

type SourceTexture = {
  asset: ToolcraftImageAsset;
  texture: SpiralGlTexture;
};

function centeredModulo(value: number, length: number): number {
  return (((value + length * 0.5) % length) + length) % length - length * 0.5;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function transformRotation(asset: ToolcraftImageAsset): number {
  return ((asset.transform?.rotationDeg ?? 0) / 90) % 4;
}

function createSourceTexture(
  asset: ToolcraftImageAsset,
  renderer: SpiralGlRenderer,
): SourceTexture {
  return {
    asset,
    texture: renderer.createTexture(
    asset.dataUrl,
      {
        flipX: asset.transform?.flipHorizontal === true,
        flipY: asset.transform?.flipVertical === true,
        rotation: transformRotation(asset),
      },
    ),
  };
}

function canReuseSourceTexture(
  source: SourceTexture,
  asset: ToolcraftImageAsset,
): boolean {
  return (
    source.asset.id === asset.id &&
    source.asset.dataUrl === asset.dataUrl &&
    transformRotation(source.asset) === transformRotation(asset) &&
    source.asset.transform?.flipHorizontal ===
      asset.transform?.flipHorizontal &&
    source.asset.transform?.flipVertical === asset.transform?.flipVertical
  );
}

export function createSpiralGalleryResource(
  canvas: HTMLCanvasElement,
): SpiralGalleryResource {
  const renderer = createSpiralGlRenderer(canvas);

  let sources: SourceTexture[] = [];
  let cards: CardMesh[] = [];
  let mediaSignature = "";
  let cardLayoutSignature = "";
  let targetOffset = 0;
  let currentOffset = 0;
  let previousOffset = 0;
  let scrollVelocity = 0;
  let edgePull = 0;
  let press = 0;
  let dragging = false;
  let pointerX = 0;
  let pointerY = 0;
  let parallaxX = 0;
  let parallaxY = 0;
  let lastFrameTime = performance.now();
  let lastInputTime = lastFrameTime;
  let frame = 0;
  let disposed = false;
  let exportInProgress = false;
  let lastSettings: SpiralGallerySettings | null = null;
  let lastState: ToolcraftState | null = null;
  let lastIncludeBackground = true;
  let lastSnapshot: SpiralGalleryFrameSnapshot = {
    cardCount: 0,
    currentIndex: 0,
    flex: 0,
    frame: 0,
    settled: true,
    shadowSignature: "",
    texturesReady: true,
  };

  const rebuildCards = (settings: SpiralGallerySettings) => {
    cards = [];
    const repetitions =
      settings.layout.mode === "stack" ? 1 : settings.spiral.repetitions;
    const count = sources.length * repetitions;
    for (let index = 0; index < count; index += 1) {
      const sourceIndex = index % sources.length;
      cards.push({
        flatten: 0,
        focus: 1,
        opacity: 1,
        position: [0, 0, 0],
        renderOrder: 0,
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        sourceIndex,
        texture: sources[sourceIndex]!.texture,
      });
    }
    cardLayoutSignature = getCardLayoutSignature(settings);
  };

  const getCardLayoutSignature = (settings: SpiralGallerySettings): string =>
    settings.layout.mode === "stack"
      ? "stack"
      : `spiral:${settings.spiral.repetitions}`;

  const syncSources = (state: ToolcraftState, settings: SpiralGallerySettings) => {
    const assets = selectSpiralGalleryImages(state);
    const signature = getSpiralGalleryMediaSignature(assets);
    if (signature !== mediaSignature) {
      cards = [];
      const reusableSources = new Map(
        sources.map((source) => [source.asset.id, source]),
      );
      const retainedTextures = new Set<SpiralGlTexture>();
      const nextSources = assets.map((asset) => {
        const reusable = reusableSources.get(asset.id);
        if (reusable && canReuseSourceTexture(reusable, asset)) {
          retainedTextures.add(reusable.texture);
          return { asset, texture: reusable.texture };
        }
        return createSourceTexture(asset, renderer);
      });
      sources.forEach((source) => {
        if (!retainedTextures.has(source.texture)) {
          source.texture.dispose();
        }
      });
      sources = nextSources;
      mediaSignature = signature;
      cardLayoutSignature = "";
    }
    if (
      sources.length > 0 &&
      cardLayoutSignature !== getCardLayoutSignature(settings)
    ) {
      rebuildCards(settings);
    }
    if (sources.length === 0 && cards.length > 0) {
      cards = [];
    }
  };

  const updateRendererSize = (
    settings: SpiralGallerySettings,
    pixelWidth?: number,
    pixelHeight?: number,
  ) => {
    const width = pixelWidth ?? Math.round(settings.canvas.width * settings.canvas.renderScale);
    const height = pixelHeight ?? Math.round(settings.canvas.height * settings.canvas.renderScale);
    if (canvas.width !== width || canvas.height !== height) {
      renderer.setSize(width, height);
    }
  };

  const renderScene = (
    state: ToolcraftState,
    includeBackground: boolean,
    now: number,
    pixelWidth?: number,
    pixelHeight?: number,
    exportView?: Readonly<{
      fullHeight: number;
      fullWidth: number;
      tile: Readonly<{
        column: number;
        columns: number;
        row: number;
        rows: number;
      }>;
    }>,
  ): SpiralGalleryFrameSnapshot => {
    const settings = readSpiralGallerySettings(state);
    lastSettings = settings;
    lastState = state;
    lastIncludeBackground = includeBackground;
    syncSources(state, settings);
    updateRendererSize(settings, pixelWidth, pixelHeight);

    const deltaScale = Math.min(2, Math.max(0.001, (now - lastFrameTime) / 16.67));
    lastFrameTime = now;
    const stackMode = settings.layout.mode === "stack";
    const snapStrength = stackMode
      ? Math.max(settings.physics.snapStrength, stackMinimumSnapStrength)
      : settings.physics.snapStrength;
    const snapping =
      !dragging && snapStrength > 0 && now - lastInputTime > 100;
    if (snapping) {
      const snapTarget = Math.round(targetOffset);
      targetOffset +=
        (snapTarget - targetOffset) *
        snapStrength *
        deltaScale;
      if (Math.abs(snapTarget - targetOffset) < 0.00001) {
        targetOffset = snapTarget;
      }
    }

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (stackMode && !reducedMotion) {
      // The deck follows input through a weighted critically damped spring:
      // velocity ramps up and bleeds off gradually instead of jumping, and
      // `stack.scrollWeight` selects how heavy that mass feels.
      const scroll = advanceStackScroll(
        { offset: currentOffset, velocity: scrollVelocity },
        targetOffset,
        resolveStackScrollSpring(settings.stack.scrollWeight),
        deltaScale,
      );
      currentOffset = scroll.offset;
      scrollVelocity = scroll.velocity;
    } else {
      scrollVelocity = 0;
      const inertia = reducedMotion
        ? Math.max(settings.physics.inertia, 0.18)
        : settings.physics.inertia;
      currentOffset += (targetOffset - currentOffset) * inertia * deltaScale;
      if (Math.abs(targetOffset - currentOffset) < 0.00001) {
        currentOffset = targetOffset;
      }
    }
    const velocity = (currentOffset - previousOffset) / Math.max(deltaScale, 0.001);
    previousOffset = currentOffset;
    const flexTarget = reducedMotion
      ? 0
      : clamp(
          velocity * 4.5,
          -settings.physics.flexStrength,
          settings.physics.flexStrength,
        );
    const flexBase = Math.abs(flexTarget) > Math.abs(edgePull) ? 0.12 : 0.06;
    edgePull +=
      (flexTarget - edgePull) *
      flexBase *
      settings.physics.flexResponse *
      deltaScale;
    if (Math.abs(flexTarget) < 0.000001 && Math.abs(edgePull) < 0.00001) {
      edgePull = 0;
    }

    const pressTarget = dragging && !reducedMotion ? 1 : 0;
    const pressResponse = pressTarget > press ? 0.18 : 0.1;
    press += (pressTarget - press) * pressResponse * deltaScale;
    if (Math.abs(pressTarget - press) < 0.00001) press = pressTarget;
    const parallaxEnabled = settings.interaction.parallax > 0;
    parallaxX += (pointerX - parallaxX) * (parallaxEnabled ? 0.08 : 1) * deltaScale;
    parallaxY += (pointerY - parallaxY) * (parallaxEnabled ? 0.08 : 1) * deltaScale;
    if (!parallaxEnabled) {
      parallaxX = pointerX;
      parallaxY = pointerY;
    }
    if (Math.abs(pointerX - parallaxX) < 0.00001) parallaxX = pointerX;
    if (Math.abs(pointerY - parallaxY) < 0.00001) parallaxY = pointerY;

    const portrait = settings.canvas.width < 720;
    const outputWidth = exportView?.fullWidth ?? pixelWidth ?? settings.canvas.width;
    const outputHeight = exportView?.fullHeight ?? pixelHeight ?? settings.canvas.height;
    const cameraAspect = outputWidth / Math.max(1, outputHeight);
    const cameraFov = settings.view.perspective + (portrait ? 12 : 0);
    const cameraZ = settings.view.cameraDistance + (portrait ? 1.7 : 0);
    const sceneX = stackMode ? 0 : portrait ? 0.65 : 1.35;
    const stackSceneY = stackMode ? stackSceneVerticalOffset : 0;
    const parallaxAmount = settings.interaction.parallax;
    const groupPosition = [
      sceneX + settings.view.sceneOffset + parallaxX * parallaxAmount,
      stackSceneY - parallaxY * parallaxAmount,
      -press * settings.interaction.pressDepth,
    ] as const;
    const baseScale =
      (portrait ? settings.view.portraitScale : 1) *
      (stackMode ? stackSceneScale : 1);
    const groupScale = baseScale * (1 - press * settings.interaction.pressShrink);

    let currentCardIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    const totalCardCount = cards.length;
    const stackPlacementSettings = {
      backTiltRadians: settings.stack.backTiltRadians,
      depthStep: settings.stack.depthStep,
      fallDistance: settings.stack.fallDistance,
      fallTiltRadians: settings.stack.fallTiltRadians,
      focusFalloff: settings.depth.focusFalloff * stackDistanceSoftening,
      gap: settings.stack.gap,
      minScale: settings.depth.minScale,
      scaleFalloff: settings.depth.scaleFalloff * stackDistanceSoftening,
    } as const;
    cards.forEach((card, index) => {
      const relative = stackMode
        ? computeStackRelative(index, currentOffset, totalCardCount)
        : centeredModulo(index - currentOffset, totalCardCount);
      if (stackMode) {
        const placement = computeStackCardPlacement(
          relative,
          stackPlacementSettings,
        );
        card.position[0] = placement.position[0];
        card.position[1] = placement.position[1];
        card.position[2] = placement.position[2];
        card.rotationX = placement.rotationX;
        card.rotationY = 0;
        card.scale = placement.scale;
        card.focus = placement.focus;
        card.opacity = placement.opacity;
        card.flatten = placement.flatten;
        card.renderOrder = placement.renderOrder;
      } else {
        const angle = relative * settings.spiral.twistRadians;
        const cosine = Math.cos(angle);
        const taper = 1 - Math.min(Math.abs(relative) * settings.spiral.taper, 0.42);
        card.position[0] = Math.sin(angle) * settings.spiral.radius * taper;
        card.position[1] = relative * -settings.spiral.verticalGap;
        card.position[2] =
          cosine * settings.spiral.depth + settings.spiral.depthOffset;
        const tilt = -Math.min(Math.abs(relative) * settings.depth.tiltRadians, 0.72);
        card.rotationX = tilt;
        card.rotationY = angle;
        const focus = clamp(
          1 - Math.abs(relative) * settings.depth.focusFalloff,
          0,
          1,
        );
        const scale = clamp(
          1 - (1 - focus) * settings.depth.scaleFalloff,
          settings.depth.minScale,
          1,
        );
        card.scale = scale;
        card.focus = focus;
        card.opacity = 1;
        card.flatten = 0;
        card.renderOrder = Math.round((cosine + 1) * 100);
      }
      if (Math.abs(relative) < nearestDistance) {
        nearestDistance = Math.abs(relative);
        currentCardIndex = index;
      }
    });

    renderer.render({
      camera: {
        aspect: cameraAspect,
        fovDegrees: cameraFov,
        positionX: sceneX,
        positionZ: cameraZ,
      },
      card: {
        cornerRadius: settings.card.cornerRadius,
        curveRadius: settings.card.curveRadius,
        edgePull,
        focusFloor: settings.depth.focusFloor,
        height: settings.card.height,
        shadowBlur: settings.shadow.blur,
        shadowColor: [
          settings.shadow.colorRgb[0],
          settings.shadow.colorRgb[1],
          settings.shadow.colorRgb[2],
          settings.shadow.opacity,
        ],
        // The offset pad uses screen coordinates: dragging down moves the
        // shadow down, so world Y flips sign.
        shadowOffsetX: settings.shadow.offsetX * spiralShadowOffsetScale,
        shadowOffsetY: -settings.shadow.offsetY * spiralShadowOffsetScale,
        width: settings.card.width,
      },
      cards,
      group: { position: groupPosition, scale: groupScale },
      viewTile: exportView?.tile,
    });
    frame += 1;
    const sourceCount = sources.length;
    lastSnapshot = {
      cardCount: totalCardCount,
      currentIndex: sourceCount > 0 ? currentCardIndex % sourceCount : 0,
      flex: edgePull,
      frame,
      shadowSignature: [
        settings.shadow.colorHex,
        Math.round(settings.shadow.opacity * 100),
        settings.shadow.blur.toFixed(2),
        settings.shadow.offsetX.toFixed(2),
        settings.shadow.offsetY.toFixed(2),
      ].join("|"),
      settled:
        Math.abs(targetOffset - currentOffset) < 0.00001 &&
        Math.abs(scrollVelocity) < 0.00001 &&
        (!snapping || Math.abs(Math.round(targetOffset) - targetOffset) < 0.00001) &&
        Math.abs(edgePull) < 0.00001 &&
        Math.abs(pressTarget - press) < 0.00001 &&
        Math.abs(pointerX - parallaxX) < 0.00001 &&
        Math.abs(pointerY - parallaxY) < 0.00001,
      texturesReady: sources.every((source) => source.texture.loaded),
    };
    return lastSnapshot;
  };

  return {
    canvas,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      cards = [];
      sources.forEach((source) => source.texture.dispose());
      sources = [];
      renderer.dispose();
    },
    drawExport: async (request) => {
      const previewWidth = canvas.width;
      const previewHeight = canvas.height;
      const previewState = lastState;
      const previewIncludeBackground = lastIncludeBackground;
      const columns = Math.max(1, Math.ceil(request.pixelWidth / 2048));
      const rows = Math.max(1, Math.ceil(request.pixelHeight / 2048));
      const waitForFrame = () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const resizeBacking = async (width: number, height: number) => {
        if (canvas.width !== width) {
          canvas.width = width;
          await waitForFrame();
        }
        if (canvas.height !== height) {
          canvas.height = height;
          await waitForFrame();
        }
      };
      const previousTransform = request.context.getTransform();
      request.context.setTransform(1, 0, 0, 1, 0, 0);
      exportInProgress = true;
      try {
        for (let row = 0; row < rows; row += 1) {
          const top = Math.floor((row * request.pixelHeight) / rows);
          const bottom = Math.floor(((row + 1) * request.pixelHeight) / rows);
          for (let column = 0; column < columns; column += 1) {
            const left = Math.floor((column * request.pixelWidth) / columns);
            const right = Math.floor(((column + 1) * request.pixelWidth) / columns);
            const tileWidth = right - left;
            const tileHeight = bottom - top;
            await resizeBacking(tileWidth, tileHeight);
            renderScene(
              request.state,
              request.includeBackground,
              performance.now(),
              tileWidth,
              tileHeight,
              {
                fullHeight: request.pixelHeight,
                fullWidth: request.pixelWidth,
                tile: { column, columns, row, rows },
              },
            );
            await waitForFrame();
            const bitmap =
              typeof createImageBitmap === "function"
                ? await createImageBitmap(canvas)
                : null;
            request.context.drawImage(
              bitmap ?? canvas,
              left,
              top,
              tileWidth,
              tileHeight,
            );
            bitmap?.close();
            await waitForFrame();
          }
        }
      } finally {
        request.context.setTransform(previousTransform);
        await resizeBacking(previewWidth, previewHeight);
        if (!disposed && previewState) {
          renderScene(
            previewState,
            previewIncludeBackground,
            performance.now(),
            previewWidth,
            previewHeight,
          );
        }
        exportInProgress = false;
      }
    },
    nudge: (kind, value) => {
      if (!lastSettings || sources.length === 0) return;
      let amount = value;
      if (kind === "wheel") amount = -value * lastSettings.physics.wheelSpeed;
      if (kind === "drag") amount = value * lastSettings.physics.dragSpeed;
      if (kind === "key") amount = value * lastSettings.physics.keyStep;
      let direction = lastSettings.interaction.invertDirection ? -1 : 1;
      // The deck flips the shared offset so wheel-down and ArrowDown move
      // forward through the image sequence.
      if (lastSettings.layout.mode === "stack") direction *= -1;
      targetOffset += clamp(amount * direction, -180, 180) * 0.0035;
      lastInputTime = performance.now();
    },
    ready: async () => {
      await Promise.all(sources.map((source) => source.texture.ready));
    },
    render: (request) =>
      exportInProgress
        ? lastSnapshot
        : renderScene(
            request.state,
            request.includeBackground,
            request.now,
          ),
    setDragging: (nextDragging) => {
      dragging = nextDragging;
      lastInputTime = performance.now();
    },
    setPointer: (x, y) => {
      pointerX = clamp(x, -1, 1);
      pointerY = clamp(y, -1, 1);
    },
  };
}

export function disposeSpiralGalleryResource(
  resource: SpiralGalleryResource,
): void {
  resource.dispose();
}
