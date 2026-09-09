import { createMeshCellTriangles, type MeshCellTriangle } from "./mesh-cell-triangulation";
import {
  getMeshBasePointCount,
  type MeshPoint,
  type MeshPointHandles,
  type MeshPointLayout,
} from "./mesh-model";

type MeshGeometry = Readonly<{
  colors: Float32Array;
  indices: Uint32Array;
  positions: Float32Array;
}>;

export type MeshNode = Readonly<{
  color: readonly [number, number, number];
  handles: MeshPointHandles;
  position: MeshPoint;
}>;

type MeshDistortion = Readonly<{
  cycles: number;
  motionScale: number;
  progress: number;
  swirl: number;
  warp: number;
}>;

function cubic(a: number, b: number, c: number, d: number, t: number): number {
  const inverse = 1 - t;
  return (
    inverse * inverse * inverse * a +
    3 * inverse * inverse * t * b +
    3 * inverse * t * t * c +
    t * t * t * d
  );
}

function cubicPoint(
  start: MeshPoint,
  startHandle: MeshPoint,
  endHandle: MeshPoint,
  end: MeshPoint,
  t: number,
): MeshPoint {
  return {
    x: cubic(start.x, start.x + startHandle.x, end.x + endHandle.x, end.x, t),
    y: cubic(start.y, start.y + startHandle.y, end.y + endHandle.y, end.y, t),
  };
}

function evaluateCoonsPatch(
  topLeft: MeshNode,
  topRight: MeshNode,
  bottomLeft: MeshNode,
  bottomRight: MeshNode,
  u: number,
  v: number,
): MeshPoint {
  const top = cubicPoint(
    topLeft.position,
    topLeft.handles.handleRight,
    topRight.handles.handleLeft,
    topRight.position,
    u,
  );
  const bottom = cubicPoint(
    bottomLeft.position,
    bottomLeft.handles.handleRight,
    bottomRight.handles.handleLeft,
    bottomRight.position,
    u,
  );
  const left = cubicPoint(
    topLeft.position,
    topLeft.handles.handleDown,
    bottomLeft.handles.handleUp,
    bottomLeft.position,
    v,
  );
  const right = cubicPoint(
    topRight.position,
    topRight.handles.handleDown,
    bottomRight.handles.handleUp,
    bottomRight.position,
    v,
  );
  const bilinearX =
    (1 - u) * (1 - v) * topLeft.position.x +
    u * (1 - v) * topRight.position.x +
    (1 - u) * v * bottomLeft.position.x +
    u * v * bottomRight.position.x;
  const bilinearY =
    (1 - u) * (1 - v) * topLeft.position.y +
    u * (1 - v) * topRight.position.y +
    (1 - u) * v * bottomLeft.position.y +
    u * v * bottomRight.position.y;
  return {
    x: (1 - v) * top.x + v * bottom.x + (1 - u) * left.x + u * right.x - bilinearX,
    y: (1 - v) * top.y + v * bottom.y + (1 - u) * left.y + u * right.y - bilinearY,
  };
}

function interpolatePatchColor(
  topLeft: MeshNode,
  topRight: MeshNode,
  bottomLeft: MeshNode,
  bottomRight: MeshNode,
  u: number,
  v: number,
): [number, number, number] {
  const weights = [(1 - u) * (1 - v), u * (1 - v), (1 - u) * v, u * v] as const;
  const colors = [topLeft.color, topRight.color, bottomLeft.color, bottomRight.color] as const;
  return [0, 1, 2].map((channel) =>
    colors.reduce((total, color, index) => total + color[channel]! * weights[index]!, 0),
  ) as [number, number, number];
}

function distortPoint(point: MeshPoint, distortion: MeshDistortion): MeshPoint {
  if (distortion.warp === 0 && distortion.swirl === 0) return point;
  const centeredX = point.x - 0.5;
  const centeredY = point.y - 0.5;
  const radius = Math.hypot(centeredX, centeredY);
  const phase = Math.PI * 2 * distortion.progress * distortion.cycles;
  const angle =
    distortion.swirl * (1 - Math.min(radius, 1)) +
    Math.sin(phase) * distortion.swirl * 0.12;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const rotatedX = centeredX * cosine - centeredY * sine;
  const rotatedY = centeredX * sine + centeredY * cosine;
  return {
    x:
      rotatedX +
      0.5 +
      Math.sin(
        (rotatedY * distortion.motionScale + distortion.progress * distortion.cycles) *
          Math.PI *
          2,
      ) *
        distortion.warp,
    y:
      rotatedY +
      0.5 +
      Math.cos(
        (rotatedX * distortion.motionScale - distortion.progress * distortion.cycles) *
          Math.PI *
          2,
      ) *
        distortion.warp,
  };
}

function appendQuadPatch({
  colors,
  distortion,
  indices,
  patch,
  positions,
  tessellation,
}: {
  colors: number[];
  distortion: MeshDistortion;
  indices: number[];
  patch: readonly [MeshNode, MeshNode, MeshNode, MeshNode];
  positions: number[];
  tessellation: number;
}): void {
  const vertexOffset = positions.length / 2;
  for (let vStep = 0; vStep <= tessellation; vStep += 1) {
    const v = vStep / tessellation;
    for (let uStep = 0; uStep <= tessellation; uStep += 1) {
      const u = uStep / tessellation;
      const patchPoint = evaluateCoonsPatch(patch[0], patch[1], patch[2], patch[3], u, v);
      const point = distortPoint(patchPoint, distortion);
      const color = interpolatePatchColor(patch[0], patch[1], patch[2], patch[3], u, v);
      positions.push(point.x * 2 - 1, 1 - point.y * 2);
      colors.push(color[0], color[1], color[2]);
    }
  }
  const stride = tessellation + 1;
  for (let vStep = 0; vStep < tessellation; vStep += 1) {
    for (let uStep = 0; uStep < tessellation; uStep += 1) {
      const topLeftIndex = vertexOffset + vStep * stride + uStep;
      const topRightIndex = topLeftIndex + 1;
      const bottomLeftIndex = topLeftIndex + stride;
      const bottomRightIndex = bottomLeftIndex + 1;
      indices.push(
        topLeftIndex,
        bottomLeftIndex,
        topRightIndex,
        topRightIndex,
        bottomLeftIndex,
        bottomRightIndex,
      );
    }
  }
}

function appendTrianglePatch({
  basePointCount,
  cell,
  colors,
  distortion,
  indices,
  nodes,
  positions,
  tessellation,
  triangle,
}: {
  basePointCount: number;
  cell: readonly [MeshNode, MeshNode, MeshNode, MeshNode];
  colors: number[];
  distortion: MeshDistortion;
  indices: number[];
  nodes: readonly MeshNode[];
  positions: number[];
  tessellation: number;
  triangle: MeshCellTriangle;
}): void {
  const vertexRows: number[][] = [];
  const insertionDisplacements = triangle.map((vertex) => {
    if (vertex.pointIndex < basePointCount) return { x: 0, y: 0 };
    const node = nodes[vertex.pointIndex];
    if (!node) return { x: 0, y: 0 };
    const basePosition = evaluateCoonsPatch(
      cell[0],
      cell[1],
      cell[2],
      cell[3],
      vertex.u,
      vertex.v,
    );
    return {
      x: node.position.x - basePosition.x,
      y: node.position.y - basePosition.y,
    };
  });

  for (let rowStep = 0; rowStep <= tessellation; rowStep += 1) {
    const rowIndices: number[] = [];
    for (let columnStep = 0; columnStep <= tessellation - rowStep; columnStep += 1) {
      const weights = [
        1 - (rowStep + columnStep) / tessellation,
        columnStep / tessellation,
        rowStep / tessellation,
      ] as const;
      const u = triangle.reduce(
        (total, vertex, index) => total + vertex.u * weights[index]!,
        0,
      );
      const v = triangle.reduce(
        (total, vertex, index) => total + vertex.v * weights[index]!,
        0,
      );
      const basePosition = evaluateCoonsPatch(cell[0], cell[1], cell[2], cell[3], u, v);
      const displacedPosition = insertionDisplacements.reduce(
        (point, displacement, index) => ({
          x: point.x + displacement.x * weights[index]!,
          y: point.y + displacement.y * weights[index]!,
        }),
        basePosition,
      );
      const point = distortPoint(displacedPosition, distortion);
      const color = [0, 1, 2].map((channel) =>
        triangle.reduce(
          (total, vertex, index) =>
            total + (nodes[vertex.pointIndex]?.color[channel] ?? 0) * weights[index]!,
          0,
        ),
      );
      rowIndices.push(positions.length / 2);
      positions.push(point.x * 2 - 1, 1 - point.y * 2);
      colors.push(color[0]!, color[1]!, color[2]!);
    }
    vertexRows.push(rowIndices);
  }

  for (let rowStep = 0; rowStep < tessellation; rowStep += 1) {
    for (let columnStep = 0; columnStep < tessellation - rowStep; columnStep += 1) {
      const first = vertexRows[rowStep]![columnStep]!;
      const second = vertexRows[rowStep]![columnStep + 1]!;
      const third = vertexRows[rowStep + 1]![columnStep]!;
      indices.push(first, third, second);
      if (columnStep < tessellation - rowStep - 1) {
        const fourth = vertexRows[rowStep + 1]![columnStep + 1]!;
        indices.push(second, third, fourth);
      }
    }
  }
}

export function createMeshGeometry(
  nodes: readonly MeshNode[],
  layout: MeshPointLayout,
  columns: number,
  tessellation: number,
  distortion: MeshDistortion,
): MeshGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const basePointCount = getMeshBasePointCount(layout);
  const rows = Math.floor(basePointCount / columns);

  for (let row = 0; row < rows - 1; row += 1) {
    for (let column = 0; column < columns - 1; column += 1) {
      const topLeft = nodes[row * columns + column];
      const topRight = nodes[row * columns + column + 1];
      const bottomLeft = nodes[(row + 1) * columns + column];
      const bottomRight = nodes[(row + 1) * columns + column + 1];
      if (!topLeft || !topRight || !bottomLeft || !bottomRight) continue;
      const cell = [topLeft, topRight, bottomLeft, bottomRight] as const;
      const triangles = createMeshCellTriangles(layout, columns, row, column);
      if (triangles.length === 0) {
        appendQuadPatch({ colors, distortion, indices, patch: cell, positions, tessellation });
        continue;
      }
      triangles.forEach((triangle) =>
        appendTrianglePatch({
          basePointCount,
          cell,
          colors,
          distortion,
          indices,
          nodes,
          positions,
          tessellation,
          triangle,
        }),
      );
    }
  }

  return {
    colors: new Float32Array(colors),
    indices: new Uint32Array(indices),
    positions: new Float32Array(positions),
  };
}
