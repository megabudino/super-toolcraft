import { describe, expect, it } from "vitest";

import {
  defaultLogoSphereCardStyle,
  getLogoSphereCardGeometry,
  renderLogoSphereFrame,
} from "./logo-sphere-renderer";
import { allocateLogoSphereGridSubdivisions } from "./logo-sphere-grid-renderer";
import type { LogoSphereProjectionInput } from "./logo-sphere-model";

type DrawCall = Readonly<{
  alpha: number;
  image: CanvasImageSource;
  size: number;
}>;

type FillCall = Readonly<{
  operation: GlobalCompositeOperation;
}>;

function createRecordingContext(
  options: Readonly<{ transformScale?: number }> = {},
) {
  const calls: DrawCall[] = [];
  let clips = 0;
  const fills: FillCall[] = [];
  const gradientStops: Array<readonly [number, string]> = [];
  const shadowBlurs: number[] = [];
  const shadowOffsets: number[] = [];
  const transformScale = options.transformScale ?? 1;
  let globalAlpha = 1;
  let globalCompositeOperation: GlobalCompositeOperation = "source-over";
  let fillStyle: string | CanvasGradient | CanvasPattern = "#000000";
  let shadowBlur = 0;
  let shadowOffsetY = 0;

  const context = {
    getTransform: () => ({
      a: transformScale,
      b: 0,
      c: 0,
      d: transformScale,
      e: 0,
      f: 0,
    }),
    arc: () => undefined,
    get shadowBlur() {
      return shadowBlur;
    },
    set shadowBlur(value: number) {
      shadowBlur = value;
      if (value > 0) {
        shadowBlurs.push(value);
      }
    },
    get shadowOffsetY() {
      return shadowOffsetY;
    },
    set shadowOffsetY(value: number) {
      shadowOffsetY = value;
      if (value > 0) {
        shadowOffsets.push(value);
      }
    },
    beginPath: () => undefined,
    clearRect: () => undefined,
    closePath: () => undefined,
    clip: () => {
      clips += 1;
    },
    createRadialGradient: () =>
      ({
        addColorStop: (offset: number, color: string) => {
          gradientStops.push([offset, color]);
        },
      }) as CanvasGradient,
    drawImage: (image: CanvasImageSource, _x: number, _y: number, width: number) => {
      calls.push({ alpha: globalAlpha, image, size: width });
    },
    fillRect: () => {
      fills.push({ operation: globalCompositeOperation });
    },
    fill: () => undefined,
    get fillStyle() {
      return fillStyle;
    },
    set fillStyle(value: string | CanvasGradient | CanvasPattern) {
      fillStyle = value;
    },
    get globalAlpha() {
      return globalAlpha;
    },
    set globalAlpha(value: number) {
      globalAlpha = value;
    },
    get globalCompositeOperation() {
      return globalCompositeOperation;
    },
    set globalCompositeOperation(value: GlobalCompositeOperation) {
      globalCompositeOperation = value;
    },
    restore: () => undefined,
    lineTo: () => undefined,
    moveTo: () => undefined,
    quadraticCurveTo: () => undefined,
    rect: () => undefined,
    rotate: () => undefined,
    save: () => undefined,
    scale: () => undefined,
    stroke: () => undefined,
    transform: () => undefined,
    translate: () => undefined,
  } as unknown as CanvasRenderingContext2D;

  return {
    calls,
    context,
    fills,
    get clips() {
      return clips;
    },
    gradientStops,
    shadowBlurs,
    shadowOffsets,
  };
}

const projection: LogoSphereProjectionInput = {
  baseLogoSize: 112,
  depth: 0.86,
  distribution: "fibonacci",
  feather: 0.22,
  frame: { height: 1080, width: 1920, x: 0, y: 0 },
  loopProgress: 0.2,
  maskSize: 1.02,
  orientation: { position: [0, 0, 5], up: [0, 1, 0] },
  perspective: 2.8,
  rearOpacity: 0.12,
  radius: 370,
  spinAmount: 1,
  spinAxis: "diagonal",
  visibleCount: 6,
};

describe("logo sphere Canvas 2D renderer", () => {
  it("bounds dense Grid mesh detail while preserving the front-most cards", () => {
    const cards = Array.from({ length: 30 }, (_, index) => ({ size: 120, z: (index * 7) % 30 }));
    const levels = allocateLogoSphereGridSubdivisions(cards);
    const triangleCount = levels.reduce(
      (sum, level) => sum + 2 * level * level,
      0,
    );

    expect(triangleCount).toBeLessThanOrEqual(88);
    expect(levels.filter((level) => level === 2)).toHaveLength(4);
    expect(levels).toEqual(cards.map(({ z }) => z >= 26 ? 2 : 1));
  });

  it("keeps sparse Grid cards at full mesh detail", () => {
    expect(
      allocateLogoSphereGridSubdivisions(
        Array.from({ length: 6 }, (_, z) => ({ size: 120, z })),
      ),
    ).toEqual(Array(6).fill(2));
  });

  it("keeps stroke constant while rounding and shadow follow perspective scale", () => {
    const far = getLogoSphereCardGeometry(
      { size: 56 },
      112,
      defaultLogoSphereCardStyle,
    );
    const near = getLogoSphereCardGeometry(
      { size: 224 },
      112,
      defaultLogoSphereCardStyle,
    );

    expect(near.strokeWidth).toBe(far.strokeWidth);
    expect(near.cornerRadius).toBe(far.cornerRadius * 4);
    expect(near.shadowBlur).toBe(far.shadowBlur * 4);
    expect(near.shadowOffset).toBe(far.shadowOffset * 4);
    expect(near.shadowSpread).toBe(far.shadowSpread * 4);
  });

  it("keeps visible shadow softness stable across backing scales", () => {
    const image = { id: "a" } as unknown as CanvasImageSource;
    const preview = createRecordingContext({ transformScale: 1 });
    const retina = createRecordingContext({ transformScale: 3 });

    renderLogoSphereFrame({
      context: preview.context,
      images: [{ id: "a", image }],
      projection,
    });
    renderLogoSphereFrame({
      context: retina.context,
      images: [{ id: "a", image }],
      projection,
    });

    expect(preview.shadowBlurs.length).toBeGreaterThan(0);
    expect(retina.shadowBlurs.length).toBe(preview.shadowBlurs.length);
    retina.shadowBlurs.forEach((value, index) => {
      expect(value).toBeCloseTo((preview.shadowBlurs[index] ?? 0) * 3, 8);
    });
    expect(preview.shadowOffsets.length).toBe(preview.shadowBlurs.length);
    retina.shadowOffsets.forEach((value, index) => {
      expect(value).toBeCloseTo((preview.shadowOffsets[index] ?? 0) * 3, 8);
    });
    preview.shadowOffsets.forEach((value) => {
      expect(value).toBeGreaterThan(projection.frame.height * 2);
    });
  });

  it("keeps an empty source set neutral", () => {
    const { calls, context } = createRecordingContext();

    renderLogoSphereFrame({ context, images: [], projection });

    expect(calls).toEqual([]);
  });

  it("draws every projected position in rear-to-front order", () => {
    const { calls, context, fills, gradientStops } = createRecordingContext();
    const images = [
      { id: "a", image: { id: "a" } as unknown as CanvasImageSource },
      { id: "b", image: { id: "b" } as unknown as CanvasImageSource },
    ];

    const projected = renderLogoSphereFrame({ context, images, projection });

    expect(calls).toHaveLength(6);
    expect(calls.map(({ image }) => image)).toEqual(
      projected.map(({ index }) => images[index % images.length]?.image),
    );
    expect(projected.map(({ z }) => z)).toEqual(
      [...projected.map(({ z }) => z)].sort((left, right) => left - right),
    );
    expect(calls.some(({ alpha }) => alpha < 1)).toBe(true);
    expect(fills).toContainEqual({ operation: "destination-in" });
    expect(gradientStops.at(-1)).toEqual([
      1,
      "rgba(255, 255, 255, 0)",
    ]);
  });

  it("places an enabled background behind the masked logo layer", () => {
    const { context, fills } = createRecordingContext();

    renderLogoSphereFrame({
      backgroundColor: "#f5f4f1",
      context,
      images: [
        { id: "a", image: { id: "a" } as unknown as CanvasImageSource },
      ],
      projection,
    });

    expect(fills.map(({ operation }) => operation)).toEqual([
      "destination-in",
      "destination-over",
    ]);
  });

  it("uses runtime media order for cyclic card assignment", () => {
    const first = { id: "first", image: { id: "first" } as unknown as CanvasImageSource };
    const second = { id: "second", image: { id: "second" } as unknown as CanvasImageSource };
    const forward = createRecordingContext();
    const reversed = createRecordingContext();

    renderLogoSphereFrame({
      context: forward.context,
      images: [first, second],
      projection,
    });
    renderLogoSphereFrame({
      context: reversed.context,
      images: [second, first],
      projection,
    });

    expect(forward.calls[0]?.image).not.toBe(reversed.calls[0]?.image);
  });
});
