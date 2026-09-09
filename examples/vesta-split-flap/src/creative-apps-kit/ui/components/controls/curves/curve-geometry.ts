import type { CurvePoint } from "../control-types";

export const curveViewBoxSize = 268;
export const curveInset = 18;
export const curveGraphSize = 232;
export const curveGraphMax = curveInset + curveGraphSize;
export const curveGridStops = [0.25, 0.5, 0.75] as const;
export const curveHitThreshold = 10;

export function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function normalizeCurvePoints(points: readonly CurvePoint[]): CurvePoint[] {
  return points.map((point) => ({ x: clamp(point.x), y: clamp(point.y) })).sort(sortPointsByX);
}

export function mapPointToSvg(point: CurvePoint): [number, number] {
  return [curveInset + point.x * curveGraphSize, curveGraphMax - point.y * curveGraphSize];
}

export function pointFromSvgEvent(
  event: Pick<PointerEvent, "clientX" | "clientY">,
  svg: SVGSVGElement | null,
): CurvePoint {
  const rect = svg?.getBoundingClientRect();
  if (!rect) {
    return { x: 0, y: 0 };
  }

  const viewBox = svg?.viewBox.baseVal;
  const viewBoxX =
    (viewBox?.x ?? 0) + ((event.clientX - rect.left) / rect.width) * (viewBox?.width ?? rect.width);
  const viewBoxY =
    (viewBox?.y ?? 0) +
    ((event.clientY - rect.top) / rect.height) * (viewBox?.height ?? rect.height);

  return {
    x: clamp((viewBoxX - curveInset) / curveGraphSize),
    y: clamp(1 - (viewBoxY - curveInset) / curveGraphSize),
  };
}

export function constrainCurvePoint(
  points: readonly CurvePoint[],
  index: number,
  point: CurvePoint,
): CurvePoint {
  if (index === 0 || index === points.length - 1) {
    return { x: points[index]?.x ?? point.x, y: point.y };
  }

  const previousPoint = points[index - 1];
  const nextPoint = points[index + 1];
  const minX = (previousPoint?.x ?? 0) + 0.01;
  const maxX = (nextPoint?.x ?? 1) - 0.01;

  return { x: Math.min(maxX, Math.max(minX, point.x)), y: point.y };
}

export function replaceCurvePoint(
  points: readonly CurvePoint[],
  index: number,
  point: CurvePoint,
): CurvePoint[] {
  return normalizeCurvePoints(
    points.map((item, itemIndex) => (itemIndex === index ? point : item)),
  );
}

export function insertCurvePoint(
  points: readonly CurvePoint[],
  point: CurvePoint,
): { index: number; points: CurvePoint[] } {
  const normalizedPoints = normalizeCurvePoints(points);
  const insertIndex = normalizedPoints.findIndex((item) => item.x > point.x);

  if (insertIndex <= 0) {
    return {
      index: 0,
      points: replaceCurvePoint(normalizedPoints, 0, { x: 0, y: point.y }),
    };
  }

  if (insertIndex === -1) {
    const endpointIndex = normalizedPoints.length - 1;

    return {
      index: endpointIndex,
      points: replaceCurvePoint(normalizedPoints, endpointIndex, { x: 1, y: point.y }),
    };
  }

  return {
    index: insertIndex,
    points: normalizeCurvePoints([
      ...normalizedPoints.slice(0, insertIndex),
      point,
      ...normalizedPoints.slice(insertIndex),
    ]),
  };
}

export function removeCurvePoint(points: readonly CurvePoint[], index: number): CurvePoint[] {
  return normalizeCurvePoints(points.filter((_, itemIndex) => itemIndex !== index));
}

export function isPointNearCurve(
  points: readonly CurvePoint[],
  point: CurvePoint,
  threshold = curveHitThreshold,
): boolean {
  const curvePoint = getCurvePointAtX(points, point.x);
  const distance = Math.abs(curvePoint.y - point.y) * curveGraphSize;

  return distance <= threshold;
}

export function getCurvePointAtX(points: readonly CurvePoint[], x: number): CurvePoint {
  const normalizedPoints = normalizeCurvePoints(points);
  const firstPoint = normalizedPoints[0];

  if (!firstPoint) {
    return { x: clamp(x), y: 0 };
  }

  if (x <= firstPoint.x) {
    return { x: firstPoint.x, y: firstPoint.y };
  }

  for (let index = 1; index < normalizedPoints.length; index += 1) {
    const point = normalizedPoints[index];

    if (point && x <= point.x) {
      return getCurvePointInSegment(normalizedPoints, index, x);
    }
  }

  const lastPoint = normalizedPoints[normalizedPoints.length - 1] ?? firstPoint;

  return { x: lastPoint.x, y: lastPoint.y };
}

export function getCurvePath(points: readonly CurvePoint[]): string {
  const normalizedPoints = normalizeCurvePoints(points);
  const firstPoint = normalizedPoints[0];

  if (!firstPoint) {
    return "";
  }

  const tangents = getMonotoneTangents(normalizedPoints);
  const [startX, startY] = mapPointToSvg(firstPoint);
  let path = `M ${startX} ${startY}`;

  for (let index = 1; index < normalizedPoints.length; index += 1) {
    path += getCurveSegmentPath(normalizedPoints, tangents, index);
  }

  return path;
}

function getCurveSegmentPath(
  points: readonly CurvePoint[],
  tangents: readonly number[],
  index: number,
): string {
  const previousPoint = points[index - 1];
  const point = points[index];
  const deltaX = point.x - previousPoint.x;
  const controlPointOne = {
    x: previousPoint.x + deltaX / 3,
    y: previousPoint.y + (deltaX * (tangents[index - 1] ?? 0)) / 3,
  };
  const controlPointTwo = {
    x: point.x - deltaX / 3,
    y: point.y - (deltaX * (tangents[index] ?? 0)) / 3,
  };
  const [controlOneX, controlOneY] = mapPointToSvg(controlPointOne);
  const [controlTwoX, controlTwoY] = mapPointToSvg(controlPointTwo);
  const [pointX, pointY] = mapPointToSvg(point);

  return ` C ${controlOneX} ${controlOneY} ${controlTwoX} ${controlTwoY} ${pointX} ${pointY}`;
}

function getCurvePointInSegment(
  points: readonly CurvePoint[],
  index: number,
  x: number,
): CurvePoint {
  const previousPoint = points[index - 1];
  const point = points[index];

  if (!previousPoint || !point) {
    return { x: clamp(x), y: 0 };
  }

  const tangents = getMonotoneTangents(points);
  const deltaX = Math.max(Number.EPSILON, point.x - previousPoint.x);
  const t = clamp((x - previousPoint.x) / deltaX);
  const tSquared = t * t;
  const tCubed = tSquared * t;
  const startTangent = tangents[index - 1] ?? 0;
  const endTangent = tangents[index] ?? 0;
  const y =
    (2 * tCubed - 3 * tSquared + 1) * previousPoint.y +
    (tCubed - 2 * tSquared + t) * deltaX * startTangent +
    (-2 * tCubed + 3 * tSquared) * point.y +
    (tCubed - tSquared) * deltaX * endTangent;

  return { x: clamp(x), y: clamp(y) };
}

function getMonotoneTangents(points: readonly CurvePoint[]): number[] {
  if (points.length <= 1) {
    return points.map(() => 0);
  }

  const slopes = points.slice(0, -1).map((point, index) => getSlope(point, index, points));

  return points.map((_, index) => {
    if (index === 0) {
      return slopes[0] ?? 0;
    }

    if (index === points.length - 1) {
      return slopes[index - 1] ?? 0;
    }

    const leftSlope = slopes[index - 1] ?? 0;
    const rightSlope = slopes[index] ?? 0;

    return leftSlope * rightSlope <= 0 ? 0 : (leftSlope + rightSlope) / 2;
  });
}

function getSlope(point: CurvePoint, index: number, points: readonly CurvePoint[]): number {
  const nextPoint = points[index + 1];
  const deltaX = Math.max(Number.EPSILON, nextPoint.x - point.x);

  return (nextPoint.y - point.y) / deltaX;
}

function sortPointsByX(left: CurvePoint, right: CurvePoint): number {
  return left.x - right.x;
}
