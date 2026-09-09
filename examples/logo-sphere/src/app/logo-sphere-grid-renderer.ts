import {
  createLogoSphereSurfaceCardMapper,
  createSpherePoints,
  getLogoSphereMaskGeometry,
  type LogoSphereProjectionInput,
  type ProjectedLogo,
} from "./logo-sphere-model";
import {
  getContextDeviceScale,
  getLogoSphereShadowSprite,
} from "./logo-sphere-card-raster";
import {
  drawLogoSphereGridCard,
  type LogoSphereGridCardEnvironment,
} from "./logo-sphere-grid-warp";
import {
  getLogoSphereCardGeometry,
  type LogoSphereCardStyle,
  type LogoSphereImageSource,
} from "./logo-sphere-renderer-types";

const OCCLUSION_CELL_SIZE = 32;
const OCCLUSION_MIN_CARDS = 24;
const OCCLUSION_OPAQUE_TRANSMITTANCE = 0.004;
const TILTED_TRIANGLE_DETAIL_BUDGET = 88;
export function allocateLogoSphereGridSubdivisions(
  cards: readonly Pick<ProjectedLogo, "size" | "z">[],
): readonly number[] {
  const subdivisionLevels = cards.map((card) =>
    card.size > 260 ? 3 : card.size > 60 ? 2 : 1,
  );
  const minimumTriangleCount = cards.length * 2;
  const triangleBudget = Math.max(
    minimumTriangleCount,
    TILTED_TRIANGLE_DETAIL_BUDGET,
  );
  let triangleTotal = subdivisionLevels.reduce(
    (sum, level) => sum + 2 * level * level,
    0,
  );

  // Draw order is not depth order for Grid stickers. Spend detail on the
  // physically nearest cards without reordering the painter's input.
  const rearToFront = cards.map((_, position) => position)
    .sort((left, right) => cards[left]!.z - cards[right]!.z || left - right);
  for (const position of rearToFront) {
    if (triangleTotal <= triangleBudget) break;
    const level = subdivisionLevels[position] ?? 1;
    if (level > 1) {
      triangleTotal -= 2 * level * level - 2;
      subdivisionLevels[position] = 1;
    }
  }

  return subdivisionLevels;
}

function collectVisibleGridCards(
  cards: readonly ProjectedLogo[],
  projection: LogoSphereProjectionInput,
  style: LogoSphereCardStyle,
  environment: LogoSphereGridCardEnvironment,
): readonly ProjectedLogo[] {
  if (cards.length < OCCLUSION_MIN_CARDS) {
    return cards;
  }

  const mask = getLogoSphereMaskGeometry(projection);
  const frame = projection.frame;
  const columns = Math.max(1, Math.ceil(frame.width / OCCLUSION_CELL_SIZE));
  const rows = Math.max(1, Math.ceil(frame.height / OCCLUSION_CELL_SIZE));
  const transmittance = new Float32Array(columns * rows).fill(1);
  const cellHalfDiagonal = OCCLUSION_CELL_SIZE * Math.SQRT1_2;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const centerX = frame.x + (column + 0.5) * OCCLUSION_CELL_SIZE;
      const centerY = frame.y + (row + 0.5) * OCCLUSION_CELL_SIZE;
      const centerDistance = Math.hypot(
        centerX - mask.centerX,
        centerY - mask.centerY,
      );
      if (centerDistance - cellHalfDiagonal > mask.outerRadius) {
        transmittance[row * columns + column] = 0;
      }
    }
  }

  const isBoxVisible = (
    left: number,
    top: number,
    right: number,
    bottom: number,
  ): boolean => {
    const firstColumn = Math.max(
      0,
      Math.floor((left - frame.x) / OCCLUSION_CELL_SIZE),
    );
    const lastColumn = Math.min(
      columns - 1,
      Math.floor((right - frame.x) / OCCLUSION_CELL_SIZE),
    );
    const firstRow = Math.max(
      0,
      Math.floor((top - frame.y) / OCCLUSION_CELL_SIZE),
    );
    const lastRow = Math.min(
      rows - 1,
      Math.floor((bottom - frame.y) / OCCLUSION_CELL_SIZE),
    );
    for (let row = firstRow; row <= lastRow; row += 1) {
      for (let column = firstColumn; column <= lastColumn; column += 1) {
        if (
          (transmittance[row * columns + column] ?? 0) >
          OCCLUSION_OPAQUE_TRANSMITTANCE
        ) {
          return true;
        }
      }
    }
    return false;
  };

  const occludeBox = (
    left: number,
    top: number,
    right: number,
    bottom: number,
    opacity: number,
  ): void => {
    const remaining = 1 - opacity;
    const firstColumn = Math.max(
      0,
      Math.ceil((left - frame.x) / OCCLUSION_CELL_SIZE),
    );
    const lastColumn = Math.min(
      columns,
      Math.floor((right - frame.x) / OCCLUSION_CELL_SIZE),
    );
    const firstRow = Math.max(
      0,
      Math.ceil((top - frame.y) / OCCLUSION_CELL_SIZE),
    );
    const lastRow = Math.min(
      rows,
      Math.floor((bottom - frame.y) / OCCLUSION_CELL_SIZE),
    );
    for (let row = firstRow; row < lastRow; row += 1) {
      for (let column = firstColumn; column < lastColumn; column += 1) {
        const index = row * columns + column;
        transmittance[index] = (transmittance[index] ?? 0) * remaining;
      }
    }
  };

  const cornerArc = Math.min(
    Math.max(0, style.cornerRadius) / environment.displayRadius,
    environment.halfArc,
  );
  const innerArc = environment.halfArc - cornerArc * 0.35;
  const keep: ProjectedLogo[] = [];

  for (let position = cards.length - 1; position >= 0; position -= 1) {
    const card = cards[position]!;
    const reach = card.size * 0.85 + 96;
    const maskDistance = Math.hypot(
      card.x - mask.centerX,
      card.y - mask.centerY,
    );
    if (maskDistance - reach > mask.outerRadius) {
      continue;
    }
    if (
      !isBoxVisible(
        card.x - reach,
        card.y - reach,
        card.x + reach,
        card.y + reach,
      )
    ) {
      continue;
    }
    keep.push(card);
    if (card.opacity >= 0.5 && innerArc > 0) {
      const sphereCenter = environment.spherePoints[card.index];
      if (!sphereCenter) {
        continue;
      }
      const mapFace = environment.mapCard(sphereCenter);
      const topLeft = mapFace(-innerArc, -innerArc);
      const topRight = mapFace(innerArc, -innerArc);
      const bottomRight = mapFace(innerArc, innerArc);
      const bottomLeft = mapFace(-innerArc, innerArc);
      const topMiddle = mapFace(0, -innerArc);
      const bottomMiddle = mapFace(0, innerArc);
      const leftMiddle = mapFace(-innerArc, 0);
      const rightMiddle = mapFace(innerArc, 0);
      const innerLeft = Math.max(topLeft.x, bottomLeft.x, leftMiddle.x) + 1;
      const innerRight = Math.min(topRight.x, bottomRight.x, rightMiddle.x) - 1;
      const innerTop = Math.max(topLeft.y, topRight.y, topMiddle.y) + 1;
      const innerBottom =
        Math.min(bottomLeft.y, bottomRight.y, bottomMiddle.y) - 1;
      if (
        innerRight - innerLeft > OCCLUSION_CELL_SIZE &&
        innerBottom - innerTop > OCCLUSION_CELL_SIZE
      ) {
        occludeBox(innerLeft, innerTop, innerRight, innerBottom, card.opacity);
      }
    }
  }

  return keep.reverse();
}

function drawGridCardShadow(
  context: CanvasRenderingContext2D,
  projected: ProjectedLogo,
  baseLogoSize: number,
  style: LogoSphereCardStyle,
  environment: LogoSphereGridCardEnvironment,
): void {
  const sphereCenter = environment.spherePoints[projected.index];
  if (!sphereCenter || style.shadowOpacity <= 0) {
    return;
  }
  const facing = Math.max(
    -1,
    Math.min(1, projected.z / Math.max(0.2, environment.depth)),
  );
  if (facing <= 0.05) {
    return;
  }
  const sprite = getLogoSphereShadowSprite(
    style,
    baseLogoSize,
    environment.deviceScale,
  );
  if (!sprite) {
    return;
  }
  const mapFace = environment.mapCard(sphereCenter);
  const geometry = getLogoSphereCardGeometry(projected, baseLogoSize, style);
  const shadowAlpha =
    projected.opacity *
    Math.min(1, Math.max(0, style.shadowOpacity)) *
    Math.min(1, facing / 0.45);
  const extendedArc =
    environment.halfArc + sprite.pad / environment.displayRadius;
  const middle = mapFace(0, 0);
  const east = mapFace(extendedArc, 0);
  const west = mapFace(-extendedArc, 0);
  const south = mapFace(0, extendedArc);
  const north = mapFace(0, -extendedArc);
  const halfWidth =
    (Math.abs(east.x - west.x) + Math.abs(south.x - north.x)) / 2;
  const halfHeight =
    (Math.abs(east.y - west.y) + Math.abs(south.y - north.y)) / 2;
  const halfSpan = (halfWidth + halfHeight) / 2;
  if (halfSpan <= 0.5) {
    return;
  }
  context.save();
  context.globalAlpha = shadowAlpha;
  context.drawImage(
    sprite.canvas,
    middle.x - halfSpan,
    middle.y + geometry.shadowOffset - halfSpan,
    halfSpan * 2,
    halfSpan * 2,
  );
  context.restore();
}

type RenderLogoSphereGridCardsInput = Readonly<{
  baseCardSize: number;
  cards: readonly ProjectedLogo[];
  context: CanvasRenderingContext2D;
  displayRadius: number;
  images: readonly LogoSphereImageSource[];
  projection: LogoSphereProjectionInput;
  style: LogoSphereCardStyle;
  totalCardCount: number;
}>;

export function renderLogoSphereGridCards({
  baseCardSize,
  cards,
  context,
  displayRadius,
  images,
  projection,
  style,
  totalCardCount,
}: RenderLogoSphereGridCardsInput): void {
  const mask = getLogoSphereMaskGeometry(projection);
  const environment: LogoSphereGridCardEnvironment = {
    depth: Math.min(1.2, Math.max(0.2, projection.depth)),
    deviceScale: getContextDeviceScale(context),
    displayRadius,
    halfArc: baseCardSize / 2 / displayRadius,
    maskCenterX: mask.centerX,
    maskCenterY: mask.centerY,
    maskOuterRadius: mask.outerRadius,
    mapCard: createLogoSphereSurfaceCardMapper(projection),
    spherePoints:
      projection.points?.length === totalCardCount
        ? projection.points
        : createSpherePoints({ count: totalCardCount, distribution: "grid" }),
  };
  const visibleCards = collectVisibleGridCards(cards, projection, style, environment);
  const subdivisionLevels = allocateLogoSphereGridSubdivisions(visibleCards);

  visibleCards.forEach((card, position) => {
    const source = images[card.index % images.length];
    if (!source) {
      return;
    }
    drawGridCardShadow(context, card, baseCardSize, style, environment);
    drawLogoSphereGridCard(
      context,
      source,
      card,
      baseCardSize,
      style,
      environment,
      subdivisionLevels[position] ?? 1,
    );
  });
}
