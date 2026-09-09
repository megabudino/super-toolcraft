import { describe, expect, it } from "vitest";
import {
  createToolcraftState,
  toolcraftReducer,
} from "@/toolcraft/runtime";

import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";
import {
  buildMosaicGeometry,
  COLOR_MODES,
  createMosaicRandomValues,
  getMosaicMotionResponse,
  getMosaicSettings,
  LAYOUT_MODES,
  mosaicFragmentShaderSource,
  mosaicVertexShaderSource,
  PALETTE_PRESETS,
  resolveMosaicPalette,
  type MosaicSettings,
} from "./kinetic-mosaic-renderer";

const vertexStride = 11;

const settings: MosaicSettings = {
  accents: 100,
  arcFill: 33,
  arms: 2,
  background: "#241814",
  ballWeight: 21,
  bend: 26,
  colorMode: "spiral",
  coreOpening: 56,
  damping: 23,
  density: 88,
  depth: 42,
  dotShape: "disc",
  dotSize: 6,
  form: "circle",
  glow: 0,
  highlight: 95,
  includeBackground: true,
  layout: "rings",
  motionType: "ripple",
  orientation: {
    position: [-1.15, 0.9, 4.75],
    up: [0, 1, 0],
  },
  palette: {
    base: "#173A78",
    bright: "#F2F7FF",
    cyan: "#19D9EA",
    violet: "#B967E8",
    warm: "#FF9B38",
  },
  palettePreset: "ember",
  perspective: 84,
  radiusRange: [2, 93],
  repeats: 12,
  rotation: 249,
  seed: 6,
  sizeProfile: -59,
  sparkle: 22,
  speed: 2,
  strength: 46,
  turbulence: 25,
  wavelength: 29,
  zMotion: 34,
  zBend: -9,
  zSpread: 31,
  zTwist: 22,
};

describe("Kinetic Circle app schema", () => {
  it("publishes the complete Toolcraft product shell", () => {
    expect(appSchema.canvas).toMatchObject({
      draggable: true,
      enabled: true,
      size: { height: 1080, width: 1920 },
      sizing: { mode: "editable-output" },
      upload: false,
    });
    expect(appSchema.canvas.renderScale.enabled).toBe(true);
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.timeline).toMatchObject({
      defaultDurationSeconds: 8,
      enabled: true,
      mode: "playback",
    });
    expect(appSchema.assembly.components).toEqual(
      expect.arrayContaining(["canvas", "controlsPanel", "timelinePanel", "toolbar"]),
    );
    expect(appSchema.assembly.capabilities).toEqual(
      expect.arrayContaining([
        "canvas.draggable",
        "canvas.editableSize",
        "canvas.infinity",
        "canvas.renderScale",
        "timeline.playback",
        "timeline.duration",
        "toolbar.zoom",
      ]),
    );
    expect(appSchema.assembly.commands).toEqual(
      expect.arrayContaining([
        "canvas.center",
        "canvas.setSize",
        "controls.reset",
        "history.undo",
        "timeline.setCurrentTime",
        "timeline.setDuration",
        "timeline.togglePlayback",
      ]),
    );
  });

  it("starts fresh state with the approved background", () => {
    expect(getMosaicSettings(createToolcraftState(appSchema)).background).toBe(
      "#241814",
    );
  });

  it("keeps mandatory runtime Setup before semantic product sections", () => {
    const sectionTitles = appSchema.panels.controls?.sections.map((section) => section.title);

    expect(sectionTitles).toEqual([
      "Setup",
      "Variations",
      "Shape",
      "Volume",
      "Dot Field",
      "Dot Style",
      "Mosaic Palette",
      "Coloring",
      "Motion",
      "Dynamics",
      "Background",
      "Image Export",
      "Video Export",
      "Export",
    ]);
    expect(appSchema.panels.controls?.sections[0]?.controls).toMatchObject({
      canvasAspectRatio: { target: "canvas.aspectRatio" },
      canvasHeight: { target: "canvas.size.height" },
      infinityCanvas: { target: "canvas.infinity" },
      canvasRenderScale: { target: "canvas.renderScale" },
      canvasWidth: { target: "canvas.size.width" },
      settingsTransfer: { target: "runtime.settingsTransfer" },
      timelineExtended: { target: "panels.timeline.extended" },
    });
  });

  it("declares product controls, persistence, and delivery actions", () => {
    const controls = appSchema.panels.controls?.sections.flatMap((section) =>
      Object.values(section.controls),
    );
    const targets = controls?.map((control) => control.target);

    expect(targets).toEqual(
      expect.arrayContaining([
        "panel.variations",
        "shape.form",
        "shape.bend",
        "shape.depth",
        "shape.repeats",
        "shape.rotation",
        "view.orbit",
        "volume.radiusRange",
        "volume.zSpread",
        "volume.zBend",
        "volume.zTwist",
        "volume.perspective",
        "pattern.layout",
        "pattern.arms",
        "pattern.arcFill",
        "pattern.density",
        "pattern.dotSize",
        "style.dotShape",
        "style.taper",
        "style.glow",
        "palette.preset",
        "palette.bright",
        "palette.colorMode",
        "palette.highlight",
        "palette.accents",
        "motion.type",
        "motion.strength",
        "motion.sparkle",
        "motion.zMotion",
        "motion.coreOpening",
        "motion.ballWeight",
        "appearance.background",
        "export.image.resolution",
        "export.video.resolution",
        "panel.exports",
      ]),
    );
    expect(appSchema.persistence).toMatchObject({
      include: ["values", "canvas", "panels", "timeline"],
      key: "toolcraft:kinetic-circle:state:v7",
      storage: "localStorage",
      version: 7,
    });
    expect(controls?.find((control) => control.target === "panel.exports")?.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: "export-video" }),
        expect.objectContaining({ value: "export-png" }),
      ]),
    );
    expect(
      controls?.find((control) => control.target === "panel.variations")?.actions,
    ).toEqual([
      expect.objectContaining({ value: "randomize-look" }),
      expect.objectContaining({ value: "randomize-colors" }),
    ]);
    expect(
      controls?.find((control) => control.target === "pattern.arms")?.visibleWhen,
    ).toEqual({ equals: "spiral", target: "pattern.layout" });
    expect(
      controls?.find((control) => control.target === "pattern.arcFill")?.visibleWhen,
    ).toEqual({ equals: "arcs", target: "pattern.layout" });
    expect(
      controls?.find((control) => control.target === "palette.base")?.visibleWhen,
    ).toEqual({ equals: "custom", target: "palette.preset" });
  });

  it("generates one deterministic high-count field with distinct authored forms", () => {
    const first = buildMosaicGeometry(1920, 1080, settings);
    const second = buildMosaicGeometry(1920, 1080, settings);
    const denser = buildMosaicGeometry(1920, 1080, { ...settings, density: 100 });
    const flower = buildMosaicGeometry(1920, 1080, { ...settings, form: "flower" });
    const pinch = buildMosaicGeometry(1920, 1080, { ...settings, form: "pinch" });
    const vortex = buildMosaicGeometry(1920, 1080, { ...settings, form: "vortex" });
    const fullRadius = buildMosaicGeometry(1920, 1080, {
      ...settings,
      radiusRange: [0, 100],
    });

    expect(first.vertexCount).toBeGreaterThan(2_500);
    expect(second.data).toEqual(first.data);
    expect(denser.vertexCount).toBeGreaterThan(first.vertexCount);
    expect(flower.vertexCount).toBe(first.vertexCount);
    expect(pinch.vertexCount).toBe(first.vertexCount);
    expect(vortex.vertexCount).toBe(first.vertexCount);
    expect(flower.data).not.toEqual(first.data);
    expect(pinch.data).not.toEqual(first.data);
    expect(vortex.data).not.toEqual(first.data);
    expect(fullRadius.vertexCount).toBeGreaterThan(first.vertexCount);
    expect(first.data.length).toBe(first.vertexCount * vertexStride);
    expect(
      Array.from(
        { length: first.vertexCount },
        (_, index) =>
          Math.abs(first.data[index * vertexStride + 2] ?? 0) +
          Math.abs(first.data[index * vertexStride + 10] ?? 0),
      ).some((z) => Math.abs(z) > 1),
    ).toBe(true);
  });

  it("restructures the same bounded point budget across layouts", () => {
    const rings = buildMosaicGeometry(1920, 1080, settings);
    const phyllotaxis = buildMosaicGeometry(1920, 1080, {
      ...settings,
      layout: "phyllotaxis",
    });
    const spiral = buildMosaicGeometry(1920, 1080, {
      ...settings,
      layout: "spiral",
    });
    const fiveArms = buildMosaicGeometry(1920, 1080, {
      ...settings,
      arms: 5,
      layout: "spiral",
    });
    const arcs = buildMosaicGeometry(1920, 1080, {
      ...settings,
      layout: "arcs",
    });
    const openArcs = buildMosaicGeometry(1920, 1080, {
      ...settings,
      arcFill: 25,
      layout: "arcs",
    });

    expect(phyllotaxis.vertexCount).toBe(rings.vertexCount);
    expect(Math.abs(spiral.vertexCount - rings.vertexCount)).toBeLessThan(
      rings.vertexCount * 0.02,
    );
    expect(phyllotaxis.data).not.toEqual(rings.data);
    expect(spiral.data).not.toEqual(rings.data);
    expect(fiveArms.vertexCount).toBeLessThanOrEqual(
      Math.ceil(rings.vertexCount * 1.02),
    );
    expect(fiveArms.data).not.toEqual(spiral.data);
    expect(arcs.vertexCount).toBeLessThan(rings.vertexCount);
    expect(arcs.vertexCount).toBeGreaterThan(rings.vertexCount * 0.3);
    expect(openArcs.vertexCount).toBeLessThan(arcs.vertexCount);
  });

  it("recolors the field through presets, color modes, highlight, and accents", () => {
    const customSettings = { ...settings, palettePreset: "custom" };
    const custom = buildMosaicGeometry(1920, 1080, customSettings);
    const neon = buildMosaicGeometry(1920, 1080, {
      ...settings,
      palettePreset: "neon",
    });
    const gradient = buildMosaicGeometry(1920, 1080, {
      ...settings,
      colorMode: "gradient",
    });
    const shiftedHighlight = buildMosaicGeometry(1920, 1080, {
      ...settings,
      highlight: 30,
    });
    const denseAccents = buildMosaicGeometry(1920, 1080, {
      ...settings,
      accents: 100,
    });
    const noAccents = buildMosaicGeometry(1920, 1080, {
      ...settings,
      accents: 0,
    });
    const positions = (geometry: ReturnType<typeof buildMosaicGeometry>) =>
      Array.from({ length: geometry.vertexCount }, (_, index) => [
        geometry.data[index * vertexStride],
        geometry.data[index * vertexStride + 1],
      ]);

    expect(resolveMosaicPalette({ ...settings, palettePreset: "neon" })).toBe(
      PALETTE_PRESETS.neon,
    );
    expect(resolveMosaicPalette(customSettings)).toEqual(settings.palette);
    expect(neon.vertexCount).toBe(custom.vertexCount);
    expect(neon.data).not.toEqual(custom.data);
    expect(positions(neon)).toEqual(positions(custom));
    for (const mode of COLOR_MODES) {
      const geometry = buildMosaicGeometry(1920, 1080, {
        ...settings,
        colorMode: mode,
      });
      expect(geometry.vertexCount).toBe(custom.vertexCount);
    }
    expect(gradient.data).not.toEqual(custom.data);
    expect(positions(gradient)).toEqual(positions(custom));
    expect(shiftedHighlight.data).not.toEqual(custom.data);
    expect(denseAccents.data).not.toEqual(custom.data);
    expect(noAccents.data).not.toEqual(custom.data);
  });

  it("randomizes curated in-range values for look and colors", () => {
    const sequence = (values: number[]) => {
      let index = 0;
      return () => {
        const value = values[index % values.length] ?? 0.5;
        index += 1;
        return value;
      };
    };
    const look = createMosaicRandomValues("look", sequence([0.1, 0.9, 0.4, 0.7]));
    const colors = createMosaicRandomValues("colors", sequence([0.6, 0.2, 0.8]));

    expect(Object.keys(colors).sort()).toEqual([
      "palette.accents",
      "palette.colorMode",
      "palette.highlight",
      "palette.preset",
    ]);
    expect(COLOR_MODES).toContain(colors["palette.colorMode"]);
    expect(Object.keys(PALETTE_PRESETS)).toContain(colors["palette.preset"]);
    expect(LAYOUT_MODES).toContain(look["pattern.layout"]);
    expect(Number(look["pattern.density"])).toBeGreaterThanOrEqual(45);
    expect(Number(look["pattern.density"])).toBeLessThanOrEqual(85);
    expect(Number(look["shape.repeats"])).toBeGreaterThanOrEqual(3);
    expect(Number(look["shape.repeats"])).toBeLessThanOrEqual(9);
    const radiusRange = look["volume.radiusRange"] as [number, number];
    expect(radiusRange[0]).toBeLessThan(radiusRange[1]);
    expect(look).toHaveProperty("motion.type");
    expect(look).toHaveProperty("style.dotShape");
  });

  it("authors independent radial bounds and bounded static Z volume", () => {
    const inset = buildMosaicGeometry(1920, 1080, {
      ...settings,
      bend: 0,
      form: "circle",
      radiusRange: [44, 82],
    });
    const flat = buildMosaicGeometry(1920, 1080, {
      ...settings,
      zSpread: 0,
    });
    const reverseTwist = buildMosaicGeometry(1920, 1080, {
      ...settings,
      zTwist: -settings.zTwist,
    });
    const expanded = buildMosaicGeometry(1920, 1080, {
      ...settings,
      zSpread: 160,
    });
    const baseline = buildMosaicGeometry(1920, 1080, settings);
    const authoredDepths = (
      geometry: ReturnType<typeof buildMosaicGeometry>,
      bend: number,
    ) => {
      const normalized = Math.max(-1, Math.min(1, bend / 100));
      const bendResponse =
        Math.sign(normalized) * Math.pow(Math.abs(normalized), 0.82);
      const depthLimit = Math.min(1920, 1080) * 0.33 * 1.35;

      return Array.from({ length: geometry.vertexCount }, (_, index) => {
        const rawDepth =
          (geometry.data[index * vertexStride + 2] ?? 0) +
          (geometry.data[index * vertexStride + 10] ?? 0) * bendResponse;
        return depthLimit * Math.tanh(rawDepth / depthLimit);
      });
    };
    const planarRadii = Array.from(
      { length: inset.vertexCount },
      (_, index) =>
        Math.hypot(
          inset.data[index * vertexStride] - 960,
          inset.data[index * vertexStride + 1] - 540,
        ),
    );

    expect(Math.min(...planarRadii)).toBeGreaterThan(130);
    expect(Math.max(...planarRadii)).toBeLessThan(340);
    expect(
      Array.from(
        { length: flat.vertexCount },
        (_, index) =>
          (flat.data[index * vertexStride + 2] ?? 0) === 0 &&
          (flat.data[index * vertexStride + 10] ?? 0) === 0,
      ).every(Boolean),
    ).toBe(true);
    expect(reverseTwist.data).not.toEqual(
      baseline.data,
    );
    expect(
      buildMosaicGeometry(1920, 1080, {
        ...settings,
        zBend: -100,
      }).data,
    ).toEqual(
      buildMosaicGeometry(1920, 1080, {
        ...settings,
        zBend: 100,
      }).data,
    );
    const strongestDomeIndex = Array.from(
      { length: expanded.vertexCount },
      (_, index) => index,
    ).reduce((strongest, index) =>
      (expanded.data[index * vertexStride + 10] ?? 0) >
      (expanded.data[strongest * vertexStride + 10] ?? 0)
        ? index
        : strongest,
    );
    const concaveDepths = authoredDepths(expanded, -100);
    const convexDepths = authoredDepths(expanded, 100);
    expect(concaveDepths[strongestDomeIndex]).toBeLessThan(
      convexDepths[strongestDomeIndex] ?? 0,
    );
    const defaultMaxZ = Math.max(
      ...authoredDepths(baseline, settings.zBend).map(Math.abs),
    );
    const expandedMaxZ = Math.max(
      ...convexDepths.map(Math.abs),
    );
    expect(expandedMaxZ).toBeGreaterThan(defaultMaxZ * 1.35);
    expect(expandedMaxZ).toBeLessThanOrEqual(1080 * 0.33 * 1.35);
  });

  it("gives every shader slider an independent subtle-to-expressive response", () => {
    const minimum = getMosaicMotionResponse(
      {
        ...settings,
        ballWeight: 0,
        coreOpening: 0,
        damping: 0,
        perspective: 0,
        strength: 0,
        turbulence: 0,
        wavelength: 0,
        zMotion: 0,
      },
      1080,
    );
    const maximum = getMosaicMotionResponse(
      {
        ...settings,
        ballWeight: 100,
        coreOpening: 100,
        damping: 100,
        perspective: 100,
        strength: 100,
        turbulence: 100,
        wavelength: 100,
        zMotion: 100,
      },
      1080,
    );

    expect(minimum).toEqual({
      ballWeight: 0,
      coreOpening: 0,
      damping: 0,
      perspective: 0,
      strength: 0,
      turbulence: 0,
      wavelength: 0.8,
      zMotion: 0,
    });
    expect(maximum).toEqual({
      ballWeight: 1,
      coreOpening: 162,
      damping: 6,
      perspective: 1,
      strength: 108,
      turbulence: 81,
      wavelength: 9,
      zMotion: 162,
    });
  });

  it("makes contour angle and repetition visibly alter the default Circle geometry", () => {
    const baseline = buildMosaicGeometry(1920, 1080, {
      ...settings,
      rotation: 0,
    });
    const quarterTurn = buildMosaicGeometry(1920, 1080, {
      ...settings,
      rotation: 90,
    });
    const lowRepeats = buildMosaicGeometry(1920, 1080, {
      ...settings,
      repeats: 2,
    });
    const highRepeats = buildMosaicGeometry(1920, 1080, {
      ...settings,
      repeats: 12,
    });

    expect(quarterTurn.data).not.toEqual(baseline.data);
    expect(highRepeats.data).not.toEqual(lowRepeats.data);
  });

  it("projects canvas geometry through a right-handed Y-up 3D basis", () => {
    expect(mosaicVertexShaderSource).toContain("center.y - displaced.y");
    expect(mosaicVertexShaderSource).toMatch(
      /gl_Position\s*=\s*vec4\(\s*clip\.x,\s*clip\.y,/,
    );
    expect(mosaicVertexShaderSource).not.toContain("-clip.y");
    expect(mosaicVertexShaderSource).toContain("float axial = 0.0");
    expect(mosaicVertexShaderSource).toContain("u_zMotion");
    expect(mosaicVertexShaderSource).toContain("u_coreOpening");
    expect(mosaicVertexShaderSource).toContain("u_ballWeight");
    expect(mosaicVertexShaderSource).toContain("u_perspective");
    expect(mosaicVertexShaderSource).toContain("u_sizeProfile");
    expect(mosaicVertexShaderSource).toContain("u_sparkle");
    expect(mosaicVertexShaderSource).toContain("a_dome * u_zBend");
    expect(mosaicVertexShaderSource).toContain("tanh(");
    expect(mosaicVertexShaderSource).toContain("compositionScale");
    expect(mosaicVertexShaderSource).toContain("perspectiveCap");
    expect(mosaicVertexShaderSource).not.toContain("float zMotion = radial");
    expect(mosaicFragmentShaderSource).toContain("u_dotShape");
    expect(mosaicFragmentShaderSource).toContain("u_glow");
    expect(mosaicFragmentShaderSource).toContain("outColor = vec4(color, alpha)");
    expect(mosaicFragmentShaderSource).not.toContain("u_pseudoVolume");
    expect(mosaicFragmentShaderSource).not.toContain("sphereZ");
  });

  it("loops every motion family seamlessly through integer cycle phases", () => {
    const branchCount = (mosaicVertexShaderSource.match(/u_motionType </g) ?? []).length;

    expect(branchCount).toBe(6);
    expect(mosaicVertexShaderSource).toContain("float flowA = TAU * (localCycle + pointHash)");
    expect(mosaicVertexShaderSource).toContain("mod(a_angle - TAU * localCycle, TAU)");
    expect(mosaicVertexShaderSource).toContain("float frontA = fract(localCycle)");
    expect(mosaicVertexShaderSource).toContain("float twinkle");
  });

  it("keeps the strongest authored contour inside a motion-safe canvas margin", () => {
    for (const layout of LAYOUT_MODES) {
      const geometry = buildMosaicGeometry(1920, 1080, {
        ...settings,
        bend: 100,
        depth: 100,
        dotSize: 14,
        form: "flower",
        layout,
        radiusRange: [0, 100],
        repeats: 10,
        zBend: 100,
        zSpread: 160,
        zTwist: 100,
      });
      const positions = Array.from({ length: geometry.vertexCount }, (_, index) => ({
        x: geometry.data[index * vertexStride],
        y: geometry.data[index * vertexStride + 1],
      }));

      expect(Math.min(...positions.map(({ x }) => x))).toBeGreaterThan(65);
      expect(Math.max(...positions.map(({ x }) => x))).toBeLessThan(1920 - 65);
      expect(Math.min(...positions.map(({ y }) => y))).toBeGreaterThan(65);
      expect(Math.max(...positions.map(({ y }) => y))).toBeLessThan(1080 - 65);
    }
  });

  it("keeps Infinity canvas runtime-owned, undoable, and size preserving", () => {
    const initial = createToolcraftState(appSchema);
    const finiteSize = initial.canvas.size;
    const infinite = toolcraftReducer(initial, {
      target: "canvas.infinity",
      type: "controls.setValue",
      value: true,
    });
    const undone = toolcraftReducer(infinite, { type: "history.undo" });
    const redone = toolcraftReducer(undone, { type: "history.redo" });
    const backgroundOff = toolcraftReducer(redone, {
      target: "export.includeBackground",
      type: "controls.setValue",
      value: false,
    });

    expect(initial.canvas.mode).toBe("finite");
    expect(infinite.canvas.mode).toBe("infinite");
    expect(infinite.canvas.size).toEqual(finiteSize);
    expect(infinite.values).not.toHaveProperty("canvas.infinity");
    expect(undone.canvas.mode).toBe("finite");
    expect(redone.canvas.mode).toBe("infinite");
    expect(backgroundOff.canvas.mode).toBe("finite");
    expect(backgroundOff.canvas.size).toEqual(finiteSize);
  });

  it("declares GPU workload and exact hard-limit performance scenarios", () => {
    expect(appPerformance.rendererStrategy).toBe("webgl");
    expect(appPerformance.rendererWorkload).toBe("pixel-output");
    expect(appPerformance.workloadTargets).toEqual([
      "volume.radiusRange",
      "pattern.density",
      "pattern.dotSize",
      "export.image.resolution",
      "export.video.resolution",
    ]);
    expect(appPerformance.scenarios.map((scenario) => scenario.id)).toEqual(
      expect.arrayContaining([
        "volume-radius-range-drag",
        "density-control-drag",
        "dot-size-control-drag",
        "layout-change",
        "arms-drag",
        "arc-fill-drag",
        "dot-shape-change",
        "taper-drag",
        "glow-drag",
        "palette-preset-change",
        "color-mode-change",
        "highlight-drag",
        "accents-drag",
        "sparkle-drag",
        "dense-preview-render",
        "timeline-playback",
        "animation-viewport-drag",
        "viewport-zoom-stress",
        "image-export-8k",
        "video-export-4k",
      ]),
    );
  });
});
