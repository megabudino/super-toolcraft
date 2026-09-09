export type SphereDistribution = "fibonacci" | "rings" | "grid";
export type SpinAxis = "vertical" | "diagonal" | "horizontal";

export type SpherePoint = Readonly<{
  x: number;
  y: number;
  z: number;
}>;

export type LogoSphereFrame = Readonly<{
  height: number;
  width: number;
  x: number;
  y: number;
}>;

export type LogoSphereOrientation = Readonly<{
  position: readonly [number, number, number];
  up: readonly [number, number, number];
}>;

export type LogoSphereProjectionInput = Readonly<{
  baseLogoSize: number;
  depth: number;
  distribution: SphereDistribution;
  feather: number;
  fisheye?: number;
  frame: LogoSphereFrame;
  loopProgress: number;
  maskSize: number;
  orientation: LogoSphereOrientation;
  perspective: number;
  points?: readonly SpherePoint[];
  rearOpacity: number;
  sphereRadius?: number;
  radius: number;
  spinAmount: number;
  spinAxis: SpinAxis;
  visibleCount: number;
}>;

export type ProjectedLogo = Readonly<{
  index: number;
  opacity: number;
  size: number;
  x: number;
  y: number;
  z: number;
}>;

export type LogoSphereMaskGeometry = Readonly<{
  centerX: number;
  centerY: number;
  innerRadius: number;
  outerRadius: number;
}>;

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const MIN_VISIBLE_LOGOS = 6;
const MAX_VISIBLE_LOGOS = 500;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalize(point: SpherePoint): SpherePoint {
  const length = Math.hypot(point.x, point.y, point.z);

  if (length === 0 || !Number.isFinite(length)) {
    return { x: 0, y: 0, z: 1 };
  }

  return {
    x: point.x / length,
    y: point.y / length,
    z: point.z / length,
  };
}

function cross(left: SpherePoint, right: SpherePoint): SpherePoint {
  return {
    x: left.y * right.z - left.z * right.y,
    y: left.z * right.x - left.x * right.z,
    z: left.x * right.y - left.y * right.x,
  };
}

function dot(left: SpherePoint, right: SpherePoint): number {
  return left.x * right.x + left.y * right.y + left.z * right.z;
}

function rotateAroundAxis(
  point: SpherePoint,
  axis: SpherePoint,
  angle: number,
): SpherePoint {
  if (angle === 0) {
    return point;
  }

  const normalizedAxis = normalize(axis);
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const projection = dot(normalizedAxis, point) * (1 - cosine);

  return {
    x:
      point.x * cosine +
      (normalizedAxis.y * point.z - normalizedAxis.z * point.y) * sine +
      normalizedAxis.x * projection,
    y:
      point.y * cosine +
      (normalizedAxis.z * point.x - normalizedAxis.x * point.z) * sine +
      normalizedAxis.y * projection,
    z:
      point.z * cosine +
      (normalizedAxis.x * point.y - normalizedAxis.y * point.x) * sine +
      normalizedAxis.z * projection,
  };
}

function getSpinAxis(axis: SpinAxis): SpherePoint {
  if (axis === "horizontal") {
    return { x: 1, y: 0, z: 0 };
  }

  if (axis === "diagonal") {
    return normalize({ x: 0.42, y: 0.9, z: 0.12 });
  }

  return { x: 0, y: 1, z: 0 };
}

function transformToView(
  point: SpherePoint,
  orientation: LogoSphereOrientation,
): SpherePoint {
  const cameraOut = normalize({
    x: orientation.position[0],
    y: orientation.position[1],
    z: orientation.position[2],
  });
  const authoredUp = normalize({
    x: orientation.up[0],
    y: orientation.up[1],
    z: orientation.up[2],
  });
  const rightCandidate = cross(authoredUp, cameraOut);
  const right =
    Math.hypot(rightCandidate.x, rightCandidate.y, rightCandidate.z) < 0.0001
      ? normalize(cross({ x: 0, y: 0, z: 1 }, cameraOut))
      : normalize(rightCandidate);
  const viewUp = normalize(cross(cameraOut, right));

  return {
    x: dot(point, right),
    y: dot(point, viewUp),
    z: dot(point, cameraOut),
  };
}

function smoothstep(edgeStart: number, edgeEnd: number, value: number): number {
  if (edgeEnd <= edgeStart) {
    return value >= edgeEnd ? 1 : 0;
  }

  const progress = clamp((value - edgeStart) / (edgeEnd - edgeStart), 0, 1);
  return progress * progress * (3 - 2 * progress);
}

function getLogoSphereRadius(input: LogoSphereProjectionInput): number {
  return input.sphereRadius ?? clamp(input.radius, 60, 2400);
}

const FISHEYE_WIDE_PERSPECTIVE = 1.32;

// Fisheye behaves like dollying a wide-angle lens toward the sphere: the
// camera distance interpolates in optical power (1 / distance) from the
// Perspective setting down to an ultra-wide minimum just outside the ball.
// Near logos therefore grow and genuinely distort through the very same
// projection, the far hemisphere compresses, and no screen-space warp is
// involved, so the mapping never folds or smears.
export function getLogoSphereEffectivePerspective(
  perspective: number,
  depth: number,
  fisheye: number | undefined,
): number {
  const amount = clamp(fisheye ?? 0, 0, 1);
  const base = clamp(perspective, 1.25, 6);

  if (amount === 0) {
    return base;
  }

  const wide = Math.max(FISHEYE_WIDE_PERSPECTIVE, clamp(depth, 0.2, 1.2) + 0.24);
  const minimum = Math.min(base, wide);
  const power = 1 / base + (1 / minimum - 1 / base) * amount;

  return 1 / power;
}

// Widest screen radius of a perspective sphere, in sphere radii: the
// silhouette ring sits slightly in front of the limb at E / sqrt(E^2 - d^2).
function getSilhouetteFactor(perspectiveValue: number, depth: number): number {
  return (
    perspectiveValue /
    Math.sqrt(Math.max(0.04, perspectiveValue ** 2 - depth ** 2))
  );
}

// Dolly-zoom counterpart of the widening lens: the whole projection is
// renormalized so the sphere silhouette keeps its exact base-perspective
// screen radius. The ball therefore never zooms — front logos grow and
// distort against nearly unchanged neighbors while the limb and the far
// hemisphere compress like a real wide-angle edge, raising the size
// contrast between the front logos and the rest.
export function getLogoSphereFisheyeNormalization(
  perspective: number,
  depth: number,
  fisheye: number | undefined,
): number {
  const amount = clamp(fisheye ?? 0, 0, 1);

  if (amount === 0) {
    return 1;
  }

  const base = clamp(perspective, 1.25, 6);
  const safeDepth = clamp(depth, 0.2, 1.2);
  const effective = getLogoSphereEffectivePerspective(
    perspective,
    depth,
    fisheye,
  );

  return (
    getSilhouetteFactor(base, safeDepth) /
    getSilhouetteFactor(effective, safeDepth)
  );
}

export function getLogoSphereMaskGeometry(
  input: LogoSphereProjectionInput,
): LogoSphereMaskGeometry {
  const sphereRadius = getLogoSphereRadius(input);
  const maskSize = clamp(input.maskSize, 0.45, 1.25);
  const feather = clamp(input.feather, 0.01, 0.6);
  const outerRadius = sphereRadius * maskSize;

  return {
    centerX: input.frame.x + input.frame.width / 2,
    centerY: input.frame.y + input.frame.height / 2,
    innerRadius: sphereRadius * Math.max(0, maskSize - feather),
    outerRadius,
  };
}

function createFibonacciPoints(count: number): SpherePoint[] {
  if (count === 1) {
    return [{ x: 0, y: 0, z: 1 }];
  }

  return Array.from({ length: count }, (_, index) => {
    const y = 1 - (index / (count - 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = index * GOLDEN_ANGLE;

    return normalize({
      x: Math.cos(angle) * radius,
      y,
      z: Math.sin(angle) * radius,
    });
  });
}

function createRingPoints(count: number): SpherePoint[] {
  const points: SpherePoint[] = [{ x: 0, y: 1, z: 0 }];
  if (count === 1) return points;
  if (count === 2) return [...points, { x: 0, y: -1, z: 0 }];

  // A pole is one position, not a zero-radius ring of coincident cards.
  // Equal angular latitude steps and circumference-weighted populations keep
  // the remaining cards separated instead of piling shadows near the poles.
  const bandCount = Math.max(3, Math.round(Math.sqrt(count * Math.PI) / 2) + 1);
  const rings = Array.from({ length: bandCount - 2 }, (_, index) => {
    const theta = ((index + 1) / (bandCount - 1)) * Math.PI;
    return { radius: Math.sin(theta), y: Math.cos(theta), count: 0, remainder: 0 };
  });
  const totalRadius = rings.reduce((sum, ring) => sum + ring.radius, 0);
  let unassigned = count - 2;
  rings.forEach(ring => {
    const quota = ((count - 2) * ring.radius) / totalRadius;
    ring.count = Math.floor(quota);
    ring.remainder = quota - ring.count;
    unassigned -= ring.count;
  });
  [...rings].sort((a, b) => b.remainder - a.remainder)
    .slice(0, unassigned).forEach(ring => { ring.count += 1; });
  rings.forEach((ring, band) => {
    for (let index = 0; index < ring.count; index += 1) {
      const angle = ((index + (band % 2) * 0.5) / ring.count) * Math.PI * 2;
      points.push({
        x: Math.cos(angle) * ring.radius,
        y: ring.y,
        z: Math.sin(angle) * ring.radius,
      });
    }
  });
  points.push({ x: 0, y: -1, z: 0 });
  return points;
}

const GRID_JITTER = 0.6;
const GRID_RELAX_ITERATIONS = 30;
const GRID_RELAX_RADIUS = 1.5;
const GRID_RELAX_STEP = 0.35;

const gridPointsCache = new Map<number, readonly SpherePoint[]>();

// Deterministic blue-noise fill: an offset Fibonacci lattice is decorrelated
// with hash-based tangent jitter and then evened back out by repulsion
// relaxation. Pure lattices keep their spacing but their spiral arms read as
// straight rows and columns of cards from the front; the relaxed set stays
// near-equidistant (neighbor spread ~1.3x) with no visible alignment. The
// result is a pure function of the count, memoized because relaxation is
// quadratic in the point count.
function createGridPoints(count: number): readonly SpherePoint[] {
  const cached = gridPointsCache.get(count);
  if (cached) {
    return cached;
  }

  const spacing = 2 * Math.sqrt(Math.PI / count);
  let points: SpherePoint[] = Array.from({ length: count }, (_, index) => {
    const y = clamp(1 - ((index + 0.5) / count) * 2, -0.999, 0.999);
    const ringRadius = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = index * GOLDEN_ANGLE;

    return normalize({
      x: Math.cos(angle) * ringRadius,
      y,
      z: Math.sin(angle) * ringRadius,
    });
  });

  points = points.map((point, index) => {
    const u = fract((index + 1) * 0.7548776662466927);
    const v = fract((index + 1) * 0.5698402909980532);
    const angle = u * Math.PI * 2;
    const magnitude = spacing * GRID_JITTER * Math.sqrt(v);
    const pole: SpherePoint =
      Math.abs(point.y) < 0.99 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
    const east = normalize(cross(pole, point));
    const north = cross(point, east);

    return normalize({
      x: point.x + (east.x * Math.cos(angle) + north.x * Math.sin(angle)) * magnitude,
      y: point.y + (east.y * Math.cos(angle) + north.y * Math.sin(angle)) * magnitude,
      z: point.z + (east.z * Math.cos(angle) + north.z * Math.sin(angle)) * magnitude,
    });
  });

  const radius = spacing * GRID_RELAX_RADIUS;
  for (let iteration = 0; iteration < GRID_RELAX_ITERATIONS; iteration += 1) {
    const stepSize =
      spacing * GRID_RELAX_STEP * (1 - iteration / GRID_RELAX_ITERATIONS);
    points = points.map((point, index) => {
      let forceX = 0;
      let forceY = 0;
      let forceZ = 0;
      for (let other = 0; other < count; other += 1) {
        if (other === index) {
          continue;
        }
        const neighbor = points[other]!;
        const deltaX = point.x - neighbor.x;
        const deltaY = point.y - neighbor.y;
        const deltaZ = point.z - neighbor.z;
        const distance = Math.hypot(deltaX, deltaY, deltaZ);
        if (distance < radius && distance > 1e-9) {
          const weight = (radius - distance) / radius / distance;
          forceX += deltaX * weight;
          forceY += deltaY * weight;
          forceZ += deltaZ * weight;
        }
      }
      return normalize({
        x: point.x + forceX * stepSize,
        y: point.y + forceY * stepSize,
        z: point.z + forceZ * stepSize,
      });
    });
  }

  if (gridPointsCache.size > 6) {
    gridPointsCache.clear();
  }
  gridPointsCache.set(count, points);
  return points;
}

function fract(value: number): number {
  return value - Math.floor(value);
}

export const gridTileReferenceLogoSize = 112;

export function getLogoSphereDisplayRadius(
  input: LogoSphereProjectionInput,
): number {
  return getLogoSphereRadius(input);
}

export type LogoSphereSurfacePoint = Readonly<{
  scale: number;
  x: number;
  y: number;
  z: number;
}>;

// Maps card-face offsets (in sphere-radius arc units) around a sphere point
// through the exponential map, so each card wraps onto the sphere surface and
// is genuinely distorted by it, then follows the shared spin, orbit, depth,
// and perspective transform of the rotating ball.
export function createLogoSphereSurfaceCardMapper(
  input: LogoSphereProjectionInput,
): (
  center: SpherePoint,
) => (faceX: number, faceY: number) => LogoSphereSurfacePoint {
  const sphereRadius = getLogoSphereRadius(input);
  const centerX = input.frame.x + input.frame.width / 2;
  const centerY = input.frame.y + input.frame.height / 2;
  const normalizedProgress = ((input.loopProgress % 1) + 1) % 1;
  const spinAngle = normalizedProgress * input.spinAmount * Math.PI * 2;
  const spinAxis = getSpinAxis(input.spinAxis);
  const depth = clamp(input.depth, 0.2, 1.2);
  const cameraDistance =
    sphereRadius *
    getLogoSphereEffectivePerspective(input.perspective, depth, input.fisheye);
  const fisheyeNormalization = getLogoSphereFisheyeNormalization(
    input.perspective,
    depth,
    input.fisheye,
  );

  return (center) => {
    // The tangent frame is built in view space after spin and orbit, with a
    // strictly horizontal east axis, so every card stays upright on screen
    // while still bending over the sphere surface.
    const spun = rotateAroundAxis(normalize(center), spinAxis, spinAngle);
    const anchor = transformToView(spun, input.orientation);
    const eastLength = Math.hypot(anchor.z, anchor.x);
    const east =
      eastLength < 0.0001
        ? { x: 1, y: 0, z: 0 }
        : { x: anchor.z / eastLength, y: 0, z: -anchor.x / eastLength };
    const north = cross(anchor, east);

    return (faceX, faceY) => {
      const arc = Math.hypot(faceX, faceY);
      let surface: SpherePoint;

      if (arc < 1e-9) {
        surface = anchor;
      } else {
        const directionX = (faceX * east.x + faceY * north.x) / arc;
        const directionY = (faceX * east.y + faceY * north.y) / arc;
        const directionZ = (faceX * east.z + faceY * north.z) / arc;
        const cosine = Math.cos(arc);
        const sine = Math.sin(arc);

        surface = {
          x: anchor.x * cosine + directionX * sine,
          y: anchor.y * cosine + directionY * sine,
          z: anchor.z * cosine + directionZ * sine,
        };
      }

      const z = surface.z * depth;
      const scale =
        (cameraDistance / Math.max(1, cameraDistance - z * sphereRadius)) *
        fisheyeNormalization;

      return {
        scale,
        x: centerX + surface.x * sphereRadius * scale,
        y: centerY + surface.y * sphereRadius * scale,
        z,
      };
    };
  };
}

const GRID_REFERENCE_POINT_COUNT = 30;

// Span of one grid card in sphere-radius units. The span is a constant of
// the sphere (sized as one cell of the reference 30-point fill) rather than
// a function of the point count, so raising Points densifies the coverage
// without shrinking the logos: Logo size, the sphere radius, and perspective
// remain the only card-size controls.
export function getLogoSphereGridTileSpan(): number {
  return 2 * Math.sqrt(Math.PI / GRID_REFERENCE_POINT_COUNT) * 0.58;
}

export function createSpherePoints({
  count,
  distribution,
}: Readonly<{
  count: number;
  distribution: SphereDistribution;
}>): readonly SpherePoint[] {
  const safeCount = Math.max(1, Math.round(count));

  if (distribution === "grid") {
    return createGridPoints(safeCount);
  }

  return distribution === "rings"
    ? createRingPoints(safeCount)
    : createFibonacciPoints(safeCount);
}


export function rotateLogoSphereOrientation(
  orientation: LogoSphereOrientation,
  deltaX: number,
  deltaY: number,
): LogoSphereOrientation {
  const radiansPerPixel = (0.4 * Math.PI) / 180;
  const position = {
    x: orientation.position[0],
    y: orientation.position[1],
    z: orientation.position[2],
  };
  const up = normalize({
    x: orientation.up[0],
    y: orientation.up[1],
    z: orientation.up[2],
  });
  const yawedPosition = rotateAroundAxis(
    position,
    { x: 0, y: 1, z: 0 },
    -deltaX * radiansPerPixel,
  );
  const yawedUp = rotateAroundAxis(
    up,
    { x: 0, y: 1, z: 0 },
    -deltaX * radiansPerPixel,
  );
  const right = normalize(cross(yawedUp, normalize(yawedPosition)));
  const pitchedPosition = rotateAroundAxis(
    yawedPosition,
    right,
    -deltaY * radiansPerPixel,
  );
  const pitchedUp = normalize(
    rotateAroundAxis(yawedUp, right, -deltaY * radiansPerPixel),
  );

  return {
    position: [pitchedPosition.x, pitchedPosition.y, pitchedPosition.z],
    up: [pitchedUp.x, pitchedUp.y, pitchedUp.z],
  };
}

/** Painter order: Grid stickers keep their index order within each hemisphere. */
export function compareLogoSphereDrawOrder(distribution: SphereDistribution) {
  return (left: Pick<ProjectedLogo, "index" | "z">, right: Pick<ProjectedLogo, "index" | "z">): number =>
    distribution === "grid"
      ? Number(left.z >= 0) - Number(right.z >= 0) || right.index - left.index
      : left.z - right.z || left.index - right.index;
}

/** Returns draw order (underneath first); use z, not position, for physical depth. */
export function projectLogoSphere(
  input: LogoSphereProjectionInput,
): readonly ProjectedLogo[] {
  const visibleCount = clamp(
    Math.round(input.visibleCount),
    MIN_VISIBLE_LOGOS,
    MAX_VISIBLE_LOGOS,
  );
  const sphereRadius = getLogoSphereRadius(input);
  const centerX = input.frame.x + input.frame.width / 2;
  const centerY = input.frame.y + input.frame.height / 2;
  const normalizedProgress =
    ((input.loopProgress % 1) + 1) % 1;
  const spinAngle = normalizedProgress * input.spinAmount * Math.PI * 2;
  const spinAxis = getSpinAxis(input.spinAxis);
  const depth = clamp(input.depth, 0.2, 1.2);
  const cameraDistance =
    sphereRadius *
    getLogoSphereEffectivePerspective(input.perspective, depth, input.fisheye);
  const fisheyeNormalization = getLogoSphereFisheyeNormalization(
    input.perspective,
    depth,
    input.fisheye,
  );
  const rearOpacity = clamp(input.rearOpacity, 0, 1);
  const depthStrength = clamp((depth - 0.2) / 0.8, 0, 1);

  // Grid cards share one base size derived from the constant sphere cell
  // span, so on screen every size difference comes purely from sphere
  // perspective: cards grow toward the viewer and shrink toward the limb and
  // rear, and the point count never changes their size. Logo size acts as a
  // multiplier around its default.
  const isGrid = input.distribution === "grid";
  const baseCardSize = isGrid
    ? getLogoSphereGridTileSpan() *
      sphereRadius *
      (input.baseLogoSize / gridTileReferenceLogoSize)
    : input.baseLogoSize;

  const points =
    input.points?.length === visibleCount
      ? input.points
      : createSpherePoints({
          count: visibleCount,
          distribution: input.distribution,
        });

  return points
    .map((point, index): ProjectedLogo => {
      const spun = rotateAroundAxis(point, spinAxis, spinAngle);
      const viewed = transformToView(spun, input.orientation);
      const spatial = { ...viewed, z: viewed.z * depth };
      const perspectiveScale =
        (cameraDistance /
          Math.max(1, cameraDistance - spatial.z * sphereRadius)) *
        fisheyeNormalization;
      const projectedX = spatial.x * sphereRadius * perspectiveScale;
      const projectedY = spatial.y * sphereRadius * perspectiveScale;
      // Grid fades on true facing (view z before depth flattening) with a
      // steeper curve, so the ball visibly darkens from the front card out to
      // the limb and rear instead of staying near-uniform.
      const frontProgress = isGrid
        ? Math.pow(smoothstep(-1, 1, viewed.z), 2.2)
        : Math.pow(smoothstep(-0.9, 0.9, spatial.z), 1.35);
      const fullDepthOpacity =
        rearOpacity + (1 - rearOpacity) * frontProgress;
      const depthOpacity =
        1 - depthStrength * (1 - fullDepthOpacity);

      return {
        index,
        opacity: clamp(depthOpacity, 0, 1),
        size: Math.max(1, baseCardSize * perspectiveScale),
        x: centerX + projectedX,
        y: centerY + projectedY,
        z: spatial.z,
      };
    })
    .sort(compareLogoSphereDrawOrder(input.distribution));
}
