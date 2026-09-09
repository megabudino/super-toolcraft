import {
  createLogoSphereSurfaceCardMapper,
  createSpherePoints,
  getLogoSphereDisplayRadius,
  getLogoSphereGridTileSpan,
  gridTileReferenceLogoSize,
  projectLogoSphere,
  type LogoSphereProjectionInput,
  type ProjectedLogo,
} from "./logo-sphere-model";
import {
  getLogoSphereCardGeometry,
  type LogoSphereCardStyle,
} from "./logo-sphere-renderer-types";

// Position, face UV, tile, alpha, painter depth, rounded radius, rear mirror,
// primitive kind (card=1, shadow=0). Shared vertices bound Grid to 81/card.
export const LOGO_SPHERE_GL_VERTEX_FLOATS = 10;

export function getLogoSphereMeshSubdivisions(size: number): number {
  return size > 600 ? 8 : size > 240 ? 6 : size > 90 ? 4 : 2;
}

export function getLogoSphereBaseCardSize(input: LogoSphereProjectionInput): number {
  return input.distribution === "grid"
    ? Math.max(1, getLogoSphereGridTileSpan() * getLogoSphereDisplayRadius(input) *
      (input.baseLogoSize / gridTileReferenceLogoSize))
    : input.baseLogoSize;
}

type ShadowMetrics = Readonly<{ pad: number; size: number }>;
type PointMapper = ReturnType<ReturnType<typeof createLogoSphereSurfaceCardMapper>>;

export function getLogoSphereGLShadow(
  card: ProjectedLogo,
  baseSize: number,
  style: LogoSphereCardStyle,
  sprite: ShadowMetrics,
  input: LogoSphereProjectionInput,
  mapFace?: PointMapper,
): Readonly<{ x: number; y: number; size: number; alpha: number }> | null {
  if (style.shadowOpacity <= 0) return null;
  const geometry = getLogoSphereCardGeometry(card, baseSize, style);
  const alpha = card.opacity * Math.min(1, Math.max(0, style.shadowOpacity));
  if (!mapFace) {
    return {
      alpha,
      size: sprite.size * card.size / Math.max(1, baseSize),
      x: card.x,
      y: card.y + geometry.shadowOffset,
    };
  }
  const facing = Math.max(-1, Math.min(1, card.z / Math.max(0.2, input.depth)));
  if (facing <= 0.05) return null;
  const radius = getLogoSphereDisplayRadius(input);
  const arc = (baseSize / 2 + sprite.pad) / radius;
  const center = mapFace(0, 0);
  const east = mapFace(arc, 0);
  const west = mapFace(-arc, 0);
  const south = mapFace(0, arc);
  const north = mapFace(0, -arc);
  const size = (Math.abs(east.x - west.x) + Math.abs(south.x - north.x) +
    Math.abs(east.y - west.y) + Math.abs(south.y - north.y)) / 2;
  return size <= 1 ? null : {
    alpha: alpha * Math.min(1, facing / 0.45),
    size,
    x: center.x,
    y: center.y + geometry.shadowOffset,
  };
}

export type LogoSphereGLGeometry = Readonly<{
  vertices: Float32Array;
  indices: Uint16Array;
  opaqueIndexCount: number;
  cards: readonly Readonly<{ index: number; vertexStart: number; subdivisions: number; opacity: number }>[];
}>;

export function createLogoSphereGLGeometry({
  projection,
  style,
  imageCount,
  width,
  height,
  shadow,
}: Readonly<{
  projection: LogoSphereProjectionInput;
  style: LogoSphereCardStyle;
  imageCount: number;
  width: number;
  height: number;
  shadow?: ShadowMetrics | null;
}>): LogoSphereGLGeometry {
  const projected = imageCount > 0 ? projectLogoSphere(projection) : [];
  const grid = projection.distribution === "grid";
  const points = projection.points?.length === projected.length ? projection.points :
    createSpherePoints({ count: projected.length, distribution: projection.distribution });
  const mapper = createLogoSphereSurfaceCardMapper(projection);
  const baseSize = getLogoSphereBaseCardSize(projection);
  const halfArc = baseSize / 2 / getLogoSphereDisplayRadius(projection);
  const scaleX = width / projection.frame.width;
  const scaleY = height / projection.frame.height;
  const vertices: number[] = [];
  const opaque: number[][] = [];
  const blended: number[] = [];
  const cards: Array<{ index: number; vertexStart: number; subdivisions: number; opacity: number }> = [];
  const vertex = (x: number, y: number, u: number, v: number, tile: number,
    alpha: number, depth: number, corner: number, mirror: number, kind: number) => {
    vertices.push((x - projection.frame.x) * scaleX, (y - projection.frame.y) * scaleY,
      u, v, tile, alpha, depth, corner, mirror, kind);
  };
  const meshIndices = (start: number, n: number): number[] => {
    const result: number[] = [];
    for (let row = 0; row < n; row += 1) {
      for (let column = 0; column < n; column += 1) {
        const a = start + row * (n + 1) + column;
        result.push(a, a + 1, a + n + 2, a, a + n + 2, a + n + 1);
      }
    }
    return result;
  };

  projected.forEach((card, rank) => {
    if (card.opacity < 0.01) return;
    const mapFace = grid && points[card.index] ? mapper(points[card.index]!) : undefined;
    const n = grid ? getLogoSphereMeshSubdivisions(card.size) : 1;
    const mapped: Array<{ x: number; y: number; u: number; v: number }> = [];
    for (let row = 0; row <= n; row += 1) {
      for (let column = 0; column <= n; column += 1) {
        const u = column / n;
        const v = row / n;
        const p = mapFace ? mapFace((u * 2 - 1) * halfArc, (v * 2 - 1) * halfArc) :
          { x: card.x + (u - 0.5) * card.size, y: card.y + (v - 0.5) * card.size };
        mapped.push({ ...p, u, v });
      }
    }
    const shadowQuad = shadow ? getLogoSphereGLShadow(card, baseSize, style, shadow, projection, mapFace) : null;
    const xs = mapped.map(p => p.x);
    const ys = mapped.map(p => p.y);
    const shadowReach = shadowQuad ? shadowQuad.size / 2 : 0;
    const left = Math.min(...xs, shadowQuad ? shadowQuad.x - shadowReach : Infinity);
    const right = Math.max(...xs, shadowQuad ? shadowQuad.x + shadowReach : -Infinity);
    const top = Math.min(...ys, shadowQuad ? shadowQuad.y - shadowReach : Infinity);
    const bottom = Math.max(...ys, shadowQuad ? shadowQuad.y + shadowReach : -Infinity);
    if (right < projection.frame.x || left > projection.frame.x + projection.frame.width ||
      bottom < projection.frame.y || top > projection.frame.y + projection.frame.height) return;

    // Constant depth per card preserves the canonical painter ordering, including
    // overlaps between bent faces. Interpolated surface z would change that art.
    const depth = 0.9 - (rank + 1) / (projected.length + 1) * 0.8;
    if (shadowQuad) {
      const start = vertices.length / LOGO_SPHERE_GL_VERTEX_FLOATS;
      for (const [u, v] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        vertex(shadowQuad.x + (u! - 0.5) * shadowQuad.size,
          shadowQuad.y + (v! - 0.5) * shadowQuad.size, u!, v!, 0,
          // More than two DEPTH_COMPONENT16 steps: a smaller bias can round
          // to the face's depth and let its own shadow tint opaque interiors.
          shadowQuad.alpha, depth + 0.0001, 0, 0, 0);
      }
      blended.push(...meshIndices(start, 1));
    }
    const start = vertices.length / LOGO_SPHERE_GL_VERTEX_FLOATS;
    const corner = grid ? style.cornerRadius / baseSize :
      getLogoSphereCardGeometry(card, baseSize, style).cornerRadius / card.size;
    mapped.forEach(p => vertex(p.x, p.y, p.u, p.v, card.index % imageCount,
      card.opacity, depth, Math.min(0.5, Math.max(0, corner)), grid && card.z < 0 ? 1 : 0, 1));
    const indices = meshIndices(start, n);
    if (card.opacity >= 0.995) opaque.push(indices);
    // Opaque AA fringes also need painter blending, but never write depth.
    blended.push(...indices);
    cards.push({ index: card.index, vertexStart: start, subdivisions: n, opacity: card.opacity });
  });
  const opaqueIndices = opaque.reverse().flat();
  return {
    cards,
    vertices: new Float32Array(vertices),
    indices: new Uint16Array([...opaqueIndices, ...blended]),
    opaqueIndexCount: opaqueIndices.length,
  };
}
