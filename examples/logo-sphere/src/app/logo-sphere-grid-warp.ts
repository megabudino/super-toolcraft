import type {
  LogoSphereSurfacePoint,
  ProjectedLogo,
  SpherePoint,
} from "./logo-sphere-model";
import {
  getLogoSphereCardGeometry,
  type LogoSphereCardStyle,
  type LogoSphereImageSource,
  type LogoSphereImageTransform,
} from "./logo-sphere-renderer-types";

type LogoSphereScreenPoint = Readonly<{ x: number; y: number }>;

export type LogoSphereGridCardEnvironment = Readonly<{
  depth: number;
  deviceScale: number;
  displayRadius: number;
  halfArc: number;
  maskCenterX: number;
  maskCenterY: number;
  maskOuterRadius: number;
  mapCard: (
    center: SpherePoint,
  ) => (faceX: number, faceY: number) => LogoSphereSurfacePoint;
  spherePoints: readonly SpherePoint[];
}>;

function buildRoundedRectPerimeter(
  halfSize: number,
  cornerRadius: number,
): readonly LogoSphereScreenPoint[] {
  const radius = Math.min(Math.max(0, cornerRadius), halfSize);
  const straight = halfSize - radius;
  const points: Array<LogoSphereScreenPoint> = [];
  const edgeSteps = 2;
  const cornerSteps = 4;

  const addEdge = (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
  ): void => {
    for (let step = 0; step < edgeSteps; step += 1) {
      const t = step / edgeSteps;
      points.push({
        x: fromX + (toX - fromX) * t,
        y: fromY + (toY - fromY) * t,
      });
    }
  };
  const addCorner = (
    centerX: number,
    centerY: number,
    startAngle: number,
  ): void => {
    for (let step = 0; step <= cornerSteps; step += 1) {
      const angle = startAngle + (step / cornerSteps) * (Math.PI / 2);
      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    }
  };

  addEdge(-straight, -halfSize, straight, -halfSize);
  addCorner(straight, -straight, -Math.PI / 2);
  addEdge(halfSize, -straight, halfSize, straight);
  addCorner(straight, straight, 0);
  addEdge(straight, halfSize, -straight, halfSize);
  addCorner(-straight, straight, Math.PI / 2);
  addEdge(-halfSize, straight, -halfSize, -straight);
  addCorner(-straight, -straight, Math.PI);

  return points;
}

function traceScreenPath(
  context: CanvasRenderingContext2D,
  points: readonly LogoSphereScreenPoint[],
): void {
  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      context.moveTo(point.x, point.y);
    } else {
      context.lineTo(point.x, point.y);
    }
  });
  context.closePath();
}

function getImageSourceRect(
  source: LogoSphereImageSource,
): Readonly<{ height: number; width: number; x: number; y: number }> {
  if (source.sourceRect) {
    return source.sourceRect;
  }
  const image = source.image as Partial<
    Readonly<{
      height: number;
      naturalHeight: number;
      naturalWidth: number;
      videoHeight: number;
      videoWidth: number;
      width: number;
    }>
  >;
  const width =
    (typeof image.naturalWidth === "number" && image.naturalWidth) ||
    (typeof image.videoWidth === "number" && image.videoWidth) ||
    (typeof image.width === "number" && image.width) ||
    1;
  const height =
    (typeof image.naturalHeight === "number" && image.naturalHeight) ||
    (typeof image.videoHeight === "number" && image.videoHeight) ||
    (typeof image.height === "number" && image.height) ||
    1;

  return { height, width, x: 0, y: 0 };
}

function faceToSourceNormalized(
  faceX: number,
  faceY: number,
  transform: LogoSphereImageTransform | undefined,
): LogoSphereScreenPoint {
  let x = faceX - 0.5;
  let y = faceY - 0.5;
  const rotation = -((transform?.rotationDeg ?? 0) * Math.PI) / 180;

  if (rotation !== 0) {
    const cosine = Math.cos(rotation);
    const sine = Math.sin(rotation);
    const rotatedX = x * cosine - y * sine;
    const rotatedY = x * sine + y * cosine;
    x = rotatedX;
    y = rotatedY;
  }
  if (transform?.flipHorizontal) {
    x = -x;
  }
  if (transform?.flipVertical) {
    y = -y;
  }

  return { x: x + 0.5, y: y + 0.5 };
}

function drawImageTriangle(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  sourceTriangle: readonly [
    LogoSphereScreenPoint,
    LogoSphereScreenPoint,
    LogoSphereScreenPoint,
  ],
  destinationTriangle: readonly [
    LogoSphereScreenPoint,
    LogoSphereScreenPoint,
    LogoSphereScreenPoint,
  ],
): void {
  const [s0, s1, s2] = sourceTriangle;
  const [d0, d1, d2] = destinationTriangle;
  const denominator =
    s0.x * (s1.y - s2.y) + s1.x * (s2.y - s0.y) + s2.x * (s0.y - s1.y);

  if (!Number.isFinite(denominator) || Math.abs(denominator) < 1e-9) {
    return;
  }

  const centroidX = (d0.x + d1.x + d2.x) / 3;
  const centroidY = (d0.y + d1.y + d2.y) / 3;
  const expand = (point: LogoSphereScreenPoint): LogoSphereScreenPoint => {
    const dx = point.x - centroidX;
    const dy = point.y - centroidY;
    const length = Math.hypot(dx, dy);
    if (length < 1e-6) {
      return point;
    }
    const grow = (length + 0.45) / length;
    return { x: centroidX + dx * grow, y: centroidY + dy * grow };
  };
  const e0 = expand(d0);
  const e1 = expand(d1);
  const e2 = expand(d2);

  const a =
    (d0.x * (s1.y - s2.y) + d1.x * (s2.y - s0.y) + d2.x * (s0.y - s1.y)) /
    denominator;
  const b =
    (d0.y * (s1.y - s2.y) + d1.y * (s2.y - s0.y) + d2.y * (s0.y - s1.y)) /
    denominator;
  const c =
    (d0.x * (s2.x - s1.x) + d1.x * (s0.x - s2.x) + d2.x * (s1.x - s0.x)) /
    denominator;
  const d =
    (d0.y * (s2.x - s1.x) + d1.y * (s0.x - s2.x) + d2.y * (s1.x - s0.x)) /
    denominator;
  const e = d0.x - a * s0.x - c * s0.y;
  const f = d0.y - b * s0.x - d * s0.y;

  context.save();
  context.beginPath();
  context.moveTo(e0.x, e0.y);
  context.lineTo(e1.x, e1.y);
  context.lineTo(e2.x, e2.y);
  context.closePath();
  context.clip();
  context.transform(a, b, c, d, e, f);
  context.drawImage(image, 0, 0);
  context.restore();
}

function drawImageAffinePatch(
  context: CanvasRenderingContext2D,
  source: LogoSphereImageSource,
  mapFace: (faceX: number, faceY: number) => LogoSphereSurfacePoint,
  halfArc: number,
  mirrorRear: boolean,
): void {
  const faceCorners = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ] as const;
  const sourceTriangle = faceCorners.map((corner) =>
    faceToSourceNormalized(
      mirrorRear ? 1 - corner.x : corner.x,
      corner.y,
      source.transform,
    ),
  );
  const destinationTriangle = [
    mapFace(-halfArc, -halfArc),
    mapFace(halfArc, -halfArc),
    mapFace(-halfArc, halfArc),
  ] as const;
  const [s0, s1, s2] = sourceTriangle;
  const [d0, d1, d2] = destinationTriangle;
  const denominator =
    s0.x * (s1.y - s2.y) + s1.x * (s2.y - s0.y) + s2.x * (s0.y - s1.y);
  if (!Number.isFinite(denominator) || Math.abs(denominator) < 1e-9) {
    return;
  }

  const a =
    (d0.x * (s1.y - s2.y) + d1.x * (s2.y - s0.y) + d2.x * (s0.y - s1.y)) /
    denominator;
  const b =
    (d0.y * (s1.y - s2.y) + d1.y * (s2.y - s0.y) + d2.y * (s0.y - s1.y)) /
    denominator;
  const c =
    (d0.x * (s2.x - s1.x) + d1.x * (s0.x - s2.x) + d2.x * (s1.x - s0.x)) /
    denominator;
  const d =
    (d0.y * (s2.x - s1.x) + d1.y * (s0.x - s2.x) + d2.y * (s1.x - s0.x)) /
    denominator;
  const e = d0.x - a * s0.x - c * s0.y;
  const f = d0.y - b * s0.x - d * s0.y;
  const sourceRect = getImageSourceRect(source);

  context.save();
  context.transform(a, b, c, d, e, f);
  context.drawImage(
    source.image,
    sourceRect.x,
    sourceRect.y,
    sourceRect.width,
    sourceRect.height,
    0,
    0,
    1,
    1,
  );
  context.restore();
}

export function drawLogoSphereGridCard(
  context: CanvasRenderingContext2D,
  source: LogoSphereImageSource,
  projected: ProjectedLogo,
  baseLogoSize: number,
  style: LogoSphereCardStyle,
  environment: LogoSphereGridCardEnvironment,
  subdivisions: number,
): void {
  const sphereCenter = environment.spherePoints[projected.index];
  if (!sphereCenter) {
    return;
  }
  const mapFace = environment.mapCard(sphereCenter);
  const halfArc = environment.halfArc;
  const facing = Math.max(
    -1,
    Math.min(1, projected.z / Math.max(0.2, environment.depth)),
  );

  const cornerArc = Math.min(
    Math.max(0, style.cornerRadius) / environment.displayRadius,
    halfArc,
  );
  const geometry = getLogoSphereCardGeometry(projected, baseLogoSize, style);
  const perimeter = buildRoundedRectPerimeter(halfArc, cornerArc);
  const outline = perimeter.map((point) => mapFace(point.x, point.y));
  context.save();
  context.globalAlpha = projected.opacity;
  context.save();
  traceScreenPath(context, outline);
  context.fillStyle = "#FFFFFF";
  context.fill();
  context.clip();

  const sourceRect = getImageSourceRect(source);
  const mirrorRear = facing < 0;
  if (subdivisions === 1) {
    drawImageAffinePatch(context, source, mapFace, halfArc, mirrorRear);
  } else {
    for (let row = 0; row < subdivisions; row += 1) {
      for (let column = 0; column < subdivisions; column += 1) {
        const faceCorners = [
          { x: column / subdivisions, y: row / subdivisions },
          { x: (column + 1) / subdivisions, y: row / subdivisions },
          { x: (column + 1) / subdivisions, y: (row + 1) / subdivisions },
          { x: column / subdivisions, y: (row + 1) / subdivisions },
        ] as const;
        const sourcePoints = faceCorners.map((corner) => {
          const normalized = faceToSourceNormalized(
            mirrorRear ? 1 - corner.x : corner.x,
            corner.y,
            source.transform,
          );
          return {
            x: sourceRect.x + normalized.x * sourceRect.width,
            y: sourceRect.y + normalized.y * sourceRect.height,
          };
        });
        const destinationPoints = faceCorners.map((corner) =>
          mapFace(
            (corner.x * 2 - 1) * halfArc,
            (corner.y * 2 - 1) * halfArc,
          ),
        );
        drawImageTriangle(
          context,
          source.image,
          [sourcePoints[0]!, sourcePoints[1]!, sourcePoints[2]!],
          [destinationPoints[0]!, destinationPoints[1]!, destinationPoints[2]!],
        );
        drawImageTriangle(
          context,
          source.image,
          [sourcePoints[0]!, sourcePoints[2]!, sourcePoints[3]!],
          [destinationPoints[0]!, destinationPoints[2]!, destinationPoints[3]!],
        );
      }
    }
  }
  context.restore();

  if (geometry.strokeWidth > 0) {
    traceScreenPath(context, outline);
    context.lineWidth = geometry.strokeWidth;
    context.strokeStyle = style.strokeColor;
    context.stroke();
  }
  context.restore();
}
