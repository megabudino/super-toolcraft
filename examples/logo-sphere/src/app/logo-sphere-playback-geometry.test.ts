// Keep the delivered test path for ownership-derived verification. These tests
// now cover the unified geometry, not the removed playback-only renderer.
import { describe, expect, it } from "vitest";
import { createLogoSphereGLGeometry, getLogoSphereBaseCardSize, getLogoSphereGLShadow,
  getLogoSphereMeshSubdivisions, LOGO_SPHERE_GL_VERTEX_FLOATS } from "./logo-sphere-gl-geometry";
import { createLogoSphereSurfaceCardMapper, createSpherePoints, projectLogoSphere,
  type LogoSphereProjectionInput } from "./logo-sphere-model";
import { defaultLogoSphereCardStyle as style } from "./logo-sphere-renderer-types";
import { getLogoSphereCanvasBacking } from "./logo-sphere-state";

const projection: LogoSphereProjectionInput = {
  baseLogoSize: 112, depth: 1, distribution: "grid", feather: 0.22,
  frame: { x: -960, y: -540, width: 1920, height: 1080 }, loopProgress: 0.2,
  maskSize: 1.02, orientation: { position: [0, 0, 5], up: [0, 1, 0] },
  perspective: 2.8, rearOpacity: 0.12, radius: 370, spinAmount: 1,
  spinAxis: "diagonal", visibleCount: 30,
};
const build = (input = projection, scale = 2) => createLogoSphereGLGeometry({
  projection: input, style, imageCount: 30, width: input.frame.width * scale, height: input.frame.height * scale,
});

describe("unified full-quality sphere geometry", () => {
  it("maps every Grid mesh vertex through the canonical curved surface", () => {
    const points = createSpherePoints({ count: 30, distribution: "grid" });
    const input = { ...projection, points };
    const result = build(input);
    const mapper = createLogoSphereSurfaceCardMapper(input);
    const arc = getLogoSphereBaseCardSize(input) / 2 / input.radius;
    for (const card of result.cards) {
      const n = card.subdivisions;
      for (let row = 0; row <= n; row++) for (let col = 0; col <= n; col++) {
        const offset = (card.vertexStart + row * (n + 1) + col) * LOGO_SPHERE_GL_VERTEX_FLOATS;
        const point = mapper(points[card.index]!)((col / n * 2 - 1) * arc, (row / n * 2 - 1) * arc);
        expect(result.vertices[offset]).toBeCloseTo((point.x - input.frame.x) * 2, 3);
        expect(result.vertices[offset + 1]).toBeCloseTo((point.y - input.frame.y) * 2, 3);
      }
    }
  });

  it.each(["fibonacci", "rings"] as const)("keeps %s cards as canonical projected quads", distribution => {
    const input = { ...projection, distribution };
    const result = build(input);
    const projected = projectLogoSphere(input);
    for (const card of result.cards) {
      expect(card.subdivisions).toBe(1);
      const p = projected.find(p => p.index === card.index)!;
      const offset = card.vertexStart * LOGO_SPHERE_GL_VERTEX_FLOATS;
      expect(result.vertices[offset]).toBeCloseTo((p.x - p.size / 2 - input.frame.x) * 2, 3);
      expect(result.vertices[offset + 1]).toBeCloseTo((p.y - p.size / 2 - input.frame.y) * 2, 3);
    }
  });

  it("bounds detail per card without sampling away the 500-card population", () => {
    expect([90, 91, 240, 241, 600, 601].map(getLogoSphereMeshSubdivisions)).toEqual([2, 4, 4, 6, 6, 8]);
    const result = build({ ...projection, visibleCount: 500 });
    expect(result.cards).toHaveLength(500);
    expect(new Set(result.cards.map(card => card.index)).size).toBe(500);
    expect(result.vertices.length / LOGO_SPHERE_GL_VERTEX_FLOATS).toBeLessThanOrEqual(500 * 81);
    expect(Math.max(...result.indices)).toBeLessThan(result.vertices.length / LOGO_SPHERE_GL_VERTEX_FLOATS);
  });

  it.each([0.12, 1])("uses reverse draw order for opaque interiors and draw order for blends (rear opacity %s)", rearOpacity => {
    const input = { ...projection, rearOpacity, visibleCount: 312 };
    const result = build(input);
    expect(result.cards.map(card => card.index)).toEqual(projectLogoSphere(input).map(card => card.index));
    const drawDepths = result.cards.map(card => result.vertices[card.vertexStart * LOGO_SPHERE_GL_VERTEX_FLOATS + 6]!);
    for (let position = 1; position < drawDepths.length; position++) {
      expect(drawDepths[position]).toBeLessThan(drawDepths[position - 1]!);
    }
    const indexOwners = new Map<number, number>();
    for (const card of result.cards) {
      for (let vertex = 0; vertex < (card.subdivisions + 1) ** 2; vertex++) {
        indexOwners.set(card.vertexStart + vertex, card.index);
        expect(result.vertices[(card.vertexStart + vertex) * LOGO_SPHERE_GL_VERTEX_FLOATS + 6])
          .toBe(result.vertices[card.vertexStart * LOGO_SPHERE_GL_VERTEX_FLOATS + 6]);
      }
    }
    const passOrder = (indices: Uint16Array) => [...new Set(Array.from(indices, index => indexOwners.get(index)))];
    expect(passOrder(result.indices.slice(0, result.opaqueIndexCount)))
      .toEqual(result.cards.filter(card => card.opacity >= 0.995).reverse().map(card => card.index));
    expect(passOrder(result.indices.slice(result.opaqueIndexCount))).toEqual(result.cards.map(card => card.index));
    const depths = Array.from(result.indices).map(index => result.vertices[index * LOGO_SPHERE_GL_VERTEX_FLOATS + 6]!);
    const opaque = depths.slice(0, result.opaqueIndexCount);
    const blended = depths.slice(result.opaqueIndexCount);
    expect(opaque).toEqual([...opaque].sort((a, b) => a - b));
    expect(blended).toEqual([...blended].sort((a, b) => b - a));
  });

  it("keeps overlapping Grid cards stacked when their centre depths cross at the front", () => {
    const samples = [0.24, 0.26].map(loopProgress => {
      const input = { ...projection, visibleCount: 312, loopProgress };
      const projected = projectLogoSphere(input);
      const pair = [7, 1].map(index => projected.find(card => card.index === index)!);
      expect(pair.every(card => card.z > 0.5)).toBe(true);
      expect(Math.abs(pair[0]!.x - pair[1]!.x)).toBeLessThan((pair[0]!.size + pair[1]!.size) / 2);
      expect(Math.abs(pair[0]!.y - pair[1]!.y)).toBeLessThan((pair[0]!.size + pair[1]!.size) / 2);
      const result = build(input);
      const gpuDepths = [7, 1].map(index => {
        const card = result.cards.find(card => card.index === index)!;
        return result.vertices[card.vertexStart * LOGO_SPHERE_GL_VERTEX_FLOATS + 6]!;
      });
      // Sticker 1 stays above sticker 7, regardless of their physical z.
      expect(gpuDepths[0]).toBeGreaterThan(gpuDepths[1]!);
      return pair[0]!.z - pair[1]!.z;
    });
    expect(samples[0]! * samples[1]!).toBeLessThan(0);
  });

  it("keeps rear image mirroring separate from curved geometry", () => {
    const result = build();
    const projected = projectLogoSphere(projection);
    for (const card of result.cards) {
      const p = projected.find(p => p.index === card.index)!;
      expect(result.vertices[card.vertexStart * LOGO_SPHERE_GL_VERTEX_FLOATS + 8]).toBe(p.z < 0 ? 1 : 0);
    }
  });

  it("retains exact selected backing at DPR 2 and only rescales vertex positions", () => {
    expect(getLogoSphereCanvasBacking(projection.frame, 2, 2)).toEqual({ width: 7680, height: 4320, pixelRatio: 4 });
    const normal = build(projection, 1);
    const retina = build(projection, 4);
    expect(retina.cards).toEqual(normal.cards);
    normal.vertices.forEach((value, i) => expect(retina.vertices[i]).toBeCloseTo(i % 10 < 2 ? value * 4 : value, 3));
  });

  it("omits invisible/off-frame cards, never an arbitrary dense-card subset", () => {
    const back = Array.from({ length: 6 }, () => ({ x: 0, y: 0, z: -1 }));
    expect(build({ ...projection, points: back, loopProgress: 0, visibleCount: 6, rearOpacity: 0 }).cards).toHaveLength(0);
    const outside = Array.from({ length: 6 }, () => ({ x: 1, y: 0, z: 0 }));
    expect(build({ ...projection, distribution: "fibonacci", points: outside, loopProgress: 0,
      visibleCount: 6, radius: 1600, frame: { x: 0, y: 0, width: 100, height: 100 } }).cards).toHaveLength(0);
  });

  it("uses the canonical perspective shadow offset and facing cutoff", () => {
    const card = { index: 0, x: 50, y: 60, z: 1, size: 224, opacity: 0.8 };
    expect(getLogoSphereGLShadow(card, 112, style, { pad: 20, size: 152 }, projection)).toEqual({
      alpha: 0.8 * style.shadowOpacity, x: 50, y: 76, size: 304,
    });
    const map = createLogoSphereSurfaceCardMapper(projection)({ x: 0, y: 0, z: 1 });
    expect(getLogoSphereGLShadow({ ...card, z: -1 }, 112, style,
      { pad: 20, size: 152 }, projection, map)).toBeNull();
  });

  it("separates shadow depth from its own opaque face at 16-bit precision", () => {
    const result = createLogoSphereGLGeometry({ projection: { ...projection,
      visibleCount: 6, loopProgress: 0, points: Array.from({ length: 6 }, () => ({ x: 0, y: 0, z: 1 })) },
      style, imageCount: 1, width: 1920, height: 1080, shadow: { pad: 20, size: 152 } });
    for (const card of result.cards) {
      const faceDepth = result.vertices[card.vertexStart * 10 + 6]!;
      const shadowDepth = result.vertices[(card.vertexStart - 4) * 10 + 6]!;
      expect(shadowDepth - faceDepth).toBeGreaterThan(2 / 65535);
      expect(shadowDepth - faceDepth).toBeLessThan(0.8 / 501);
    }
  });
});
