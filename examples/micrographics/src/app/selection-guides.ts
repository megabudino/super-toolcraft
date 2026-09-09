export type GuideRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type ActiveGuides = {
  x: readonly number[];
  y: readonly number[];
};

export type ResizeCorner = "ne" | "nw" | "se" | "sw";

type AxisSnap = {
  guide: number | null;
  offset: number;
};

function axisLines(start: number, size: number): number[] {
  return [start, start + size / 2, start + size];
}

function snapAxis(
  moving: readonly number[],
  candidates: readonly number[],
  threshold: number,
): AxisSnap {
  let best: AxisSnap = { guide: null, offset: 0 };
  let bestDistance = threshold;

  for (const line of candidates) {
    for (const edge of moving) {
      const distance = Math.abs(line - edge);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { guide: line, offset: line - edge };
      }
    }
  }

  return best;
}

function candidateLines(
  others: readonly GuideRect[],
  canvasSize: number,
  axis: "x" | "y",
): number[] {
  const lines = [0, canvasSize / 2, canvasSize];
  for (const other of others) {
    lines.push(
      ...(axis === "x"
        ? axisLines(other.x, other.width)
        : axisLines(other.y, other.height)),
    );
  }
  return lines;
}

export function snapMovingRect(
  rect: GuideRect,
  others: readonly GuideRect[],
  canvasWidth: number,
  canvasHeight: number,
  threshold: number,
): { guides: ActiveGuides; x: number; y: number } {
  const snapX = snapAxis(
    axisLines(rect.x, rect.width),
    candidateLines(others, canvasWidth, "x"),
    threshold,
  );
  const snapY = snapAxis(
    axisLines(rect.y, rect.height),
    candidateLines(others, canvasHeight, "y"),
    threshold,
  );

  return {
    guides: {
      x: snapX.guide === null ? [] : [snapX.guide],
      y: snapY.guide === null ? [] : [snapY.guide],
    },
    x: rect.x + snapX.offset,
    y: rect.y + snapY.offset,
  };
}

export function snapResizeEdges(
  rect: GuideRect,
  corner: ResizeCorner,
  others: readonly GuideRect[],
  canvasWidth: number,
  canvasHeight: number,
  threshold: number,
): { guides: ActiveGuides; rect: GuideRect } {
  const horizontalEdge = corner.includes("e") ? rect.x + rect.width : rect.x;
  const verticalEdge = corner.includes("s") ? rect.y + rect.height : rect.y;
  const snapX = snapAxis(
    [horizontalEdge],
    candidateLines(others, canvasWidth, "x"),
    threshold,
  );
  const snapY = snapAxis(
    [verticalEdge],
    candidateLines(others, canvasHeight, "y"),
    threshold,
  );
  const next = { ...rect };

  if (snapX.guide !== null) {
    if (corner.includes("e")) {
      next.width += snapX.offset;
    } else {
      next.x += snapX.offset;
      next.width -= snapX.offset;
    }
  }
  if (snapY.guide !== null) {
    if (corner.includes("s")) {
      next.height += snapY.offset;
    } else {
      next.y += snapY.offset;
      next.height -= snapY.offset;
    }
  }

  return {
    guides: {
      x: snapX.guide === null ? [] : [snapX.guide],
      y: snapY.guide === null ? [] : [snapY.guide],
    },
    rect: next,
  };
}

export type DistanceMeasurement = {
  at: number;
  axis: "x" | "y";
  from: number;
  to: number;
};

function overlap(
  startA: number,
  sizeA: number,
  startB: number,
  sizeB: number,
): { center: number; size: number } | null {
  const start = Math.max(startA, startB);
  const end = Math.min(startA + sizeA, startB + sizeB);
  return end > start ? { center: (start + end) / 2, size: end - start } : null;
}

export function measureDistances(
  rect: GuideRect,
  others: readonly GuideRect[],
  canvasWidth: number,
  canvasHeight: number,
): DistanceMeasurement[] {
  const measurements: DistanceMeasurement[] = [];
  const middleY = rect.y + rect.height / 2;
  const middleX = rect.x + rect.width / 2;

  let leftEdge = 0;
  let leftAt = middleY;
  let rightEdge = canvasWidth;
  let rightAt = middleY;
  let topEdge = 0;
  let topAt = middleX;
  let bottomEdge = canvasHeight;
  let bottomAt = middleX;

  for (const other of others) {
    const vertical = overlap(rect.y, rect.height, other.y, other.height);
    if (vertical) {
      const otherRight = other.x + other.width;
      if (otherRight <= rect.x && otherRight > leftEdge) {
        leftEdge = otherRight;
        leftAt = vertical.center;
      }
      if (other.x >= rect.x + rect.width && other.x < rightEdge) {
        rightEdge = other.x;
        rightAt = vertical.center;
      }
    }
    const horizontal = overlap(rect.x, rect.width, other.x, other.width);
    if (horizontal) {
      const otherBottom = other.y + other.height;
      if (otherBottom <= rect.y && otherBottom > topEdge) {
        topEdge = otherBottom;
        topAt = horizontal.center;
      }
      if (other.y >= rect.y + rect.height && other.y < bottomEdge) {
        bottomEdge = other.y;
        bottomAt = horizontal.center;
      }
    }
  }

  if (rect.x - leftEdge > 0.5) {
    measurements.push({ at: leftAt, axis: "x", from: leftEdge, to: rect.x });
  }
  if (rightEdge - (rect.x + rect.width) > 0.5) {
    measurements.push({
      at: rightAt,
      axis: "x",
      from: rect.x + rect.width,
      to: rightEdge,
    });
  }
  if (rect.y - topEdge > 0.5) {
    measurements.push({ at: topAt, axis: "y", from: topEdge, to: rect.y });
  }
  if (bottomEdge - (rect.y + rect.height) > 0.5) {
    measurements.push({
      at: bottomAt,
      axis: "y",
      from: rect.y + rect.height,
      to: bottomEdge,
    });
  }

  return measurements;
}
