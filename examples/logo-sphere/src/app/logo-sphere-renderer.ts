import {
  getLogoSphereDisplayRadius,
  getLogoSphereGridTileSpan,
  getLogoSphereMaskGeometry,
  gridTileReferenceLogoSize,
  projectLogoSphere,
  type LogoSphereProjectionInput,
  type ProjectedLogo,
} from "./logo-sphere-model";
import {
  addRoundedRectPath,
  getContextDeviceScale,
  getLogoSphereShadowSprite,
} from "./logo-sphere-card-raster";
import { renderLogoSphereGridCards } from "./logo-sphere-grid-renderer";
import {
  defaultLogoSphereCardStyle,
  getLogoSphereCardGeometry,
  type LogoSphereCardStyle,
  type LogoSphereImageSource,
} from "./logo-sphere-renderer-types";

export {
  defaultLogoSphereCardStyle,
  getLogoSphereCardGeometry,
  type LogoSphereCardGeometry,
  type LogoSphereCardStyle,
  type LogoSphereImageSource,
  type LogoSphereImageTransform,
} from "./logo-sphere-renderer-types";

export type RenderLogoSphereFrameInput = Readonly<{
  backgroundColor?: string | null;
  cardStyle?: LogoSphereCardStyle;
  context: CanvasRenderingContext2D;
  images: readonly LogoSphereImageSource[];
  projection: LogoSphereProjectionInput;
}>;

function getMaskBounds(projection: LogoSphereProjectionInput): Readonly<{
  height: number;
  width: number;
  x: number;
  y: number;
}> {
  const mask = getLogoSphereMaskGeometry(projection);
  const left = Math.max(projection.frame.x, mask.centerX - mask.outerRadius);
  const top = Math.max(projection.frame.y, mask.centerY - mask.outerRadius);
  const right = Math.min(
    projection.frame.x + projection.frame.width,
    mask.centerX + mask.outerRadius,
  );
  const bottom = Math.min(
    projection.frame.y + projection.frame.height,
    mask.centerY + mask.outerRadius,
  );

  return {
    height: Math.max(0, bottom - top),
    width: Math.max(0, right - left),
    x: left,
    y: top,
  };
}

function applyLogoSphereMask(
  context: CanvasRenderingContext2D,
  projection: LogoSphereProjectionInput,
): void {
  const mask = getLogoSphereMaskGeometry(projection);
  const bounds = getMaskBounds(projection);
  const gradient = context.createRadialGradient(
    mask.centerX,
    mask.centerY,
    0,
    mask.centerX,
    mask.centerY,
    mask.outerRadius,
  );
  const innerStop = Math.min(
    0.999,
    Math.max(0, mask.innerRadius / Math.max(1, mask.outerRadius)),
  );

  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(innerStop, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  context.save();
  context.globalCompositeOperation = "destination-in";
  context.fillStyle = gradient;
  context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  context.restore();
}

function placeBackgroundBehindLogos(
  context: CanvasRenderingContext2D,
  projection: LogoSphereProjectionInput,
  backgroundColor: string,
): void {
  const bounds = getMaskBounds(projection);
  context.save();
  context.globalCompositeOperation = "destination-over";
  context.fillStyle = backgroundColor;
  context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  context.restore();
}

function drawProjectedLogo(
  context: CanvasRenderingContext2D,
  source: LogoSphereImageSource,
  projected: ProjectedLogo,
  baseLogoSize: number,
  style: LogoSphereCardStyle,
  shadowCastClearance: number,
): void {
  const halfSize = projected.size / 2;
  const rotationRadians = ((source.transform?.rotationDeg ?? 0) * Math.PI) / 180;
  const scaleX = source.transform?.flipHorizontal ? -1 : 1;
  const scaleY = source.transform?.flipVertical ? -1 : 1;
  const geometry = getLogoSphereCardGeometry(projected, baseLogoSize, style);

  context.save();
  context.globalAlpha = projected.opacity;
  context.translate(projected.x, projected.y);

  if (style.shadowOpacity > 0) {
    const deviceScale = getContextDeviceScale(context);
    const sprite = getLogoSphereShadowSprite(style, baseLogoSize, deviceScale);
    const shadowAlpha =
      projected.opacity * Math.min(1, Math.max(0, style.shadowOpacity));

    if (sprite) {
      const depthScale = projected.size / Math.max(1, baseLogoSize);
      const destinationSize = sprite.size * depthScale;
      const destinationPad = sprite.pad * depthScale;
      context.globalAlpha = shadowAlpha;
      context.drawImage(
        sprite.canvas,
        -halfSize - destinationPad,
        -halfSize - destinationPad + geometry.shadowOffset,
        destinationSize,
        destinationSize,
      );
      context.globalAlpha = projected.opacity;
    } else {
      const shadowExtent = geometry.shadowSpread;
      const castDistance =
        shadowCastClearance +
        projected.size +
        geometry.shadowBlur * 4 +
        geometry.shadowOffset;
      context.save();
      context.globalAlpha = shadowAlpha;
      context.fillStyle = style.shadowColor;
      context.shadowBlur = geometry.shadowBlur * deviceScale;
      context.shadowColor = style.shadowColor;
      context.shadowOffsetX = 0;
      context.shadowOffsetY =
        (castDistance + geometry.shadowOffset) * deviceScale;
      addRoundedRectPath(
        context,
        -halfSize - shadowExtent,
        -halfSize - shadowExtent - castDistance,
        projected.size + shadowExtent * 2,
        projected.size + shadowExtent * 2,
        geometry.cornerRadius + shadowExtent,
      );
      context.fill();
      context.restore();
    }
  }

  addRoundedRectPath(
    context,
    -halfSize,
    -halfSize,
    projected.size,
    projected.size,
    geometry.cornerRadius,
  );
  context.fillStyle = "#FFFFFF";
  context.fill();

  context.save();
  addRoundedRectPath(
    context,
    -halfSize,
    -halfSize,
    projected.size,
    projected.size,
    geometry.cornerRadius,
  );
  context.clip();
  if (rotationRadians !== 0) {
    context.rotate(rotationRadians);
  }
  if (scaleX !== 1 || scaleY !== 1) {
    context.scale(scaleX, scaleY);
  }
  if (source.sourceRect) {
    context.drawImage(
      source.image,
      source.sourceRect.x,
      source.sourceRect.y,
      source.sourceRect.width,
      source.sourceRect.height,
      -halfSize,
      -halfSize,
      projected.size,
      projected.size,
    );
  } else {
    context.drawImage(
      source.image,
      -halfSize,
      -halfSize,
      projected.size,
      projected.size,
    );
  }
  context.restore();

  if (geometry.strokeWidth > 0) {
    const inset = Math.min(geometry.strokeWidth / 2, halfSize);
    addRoundedRectPath(
      context,
      -halfSize + inset,
      -halfSize + inset,
      Math.max(0, projected.size - inset * 2),
      Math.max(0, projected.size - inset * 2),
      Math.max(0, geometry.cornerRadius - inset),
    );
    context.lineWidth = geometry.strokeWidth;
    context.strokeStyle = style.strokeColor;
    context.stroke();
  }
  context.restore();
}

export function renderLogoSphereFrame({
  backgroundColor = null,
  cardStyle = defaultLogoSphereCardStyle,
  context,
  images,
  projection,
}: RenderLogoSphereFrameInput): readonly ProjectedLogo[] {
  if (images.length === 0) {
    return [];
  }

  const projected = projectLogoSphere(projection);
  const maskBounds = getMaskBounds(projection);

  context.save();
  context.globalCompositeOperation = "source-over";
  context.beginPath();
  context.rect(
    maskBounds.x,
    maskBounds.y,
    maskBounds.width,
    maskBounds.height,
  );
  context.clip();

  const shadowCastClearance = Math.max(1, projection.frame.height) * 2;
  const displayRadius = getLogoSphereDisplayRadius(projection);
  const baseCardSize =
    projection.distribution === "grid"
      ? Math.max(
          1,
          getLogoSphereGridTileSpan() *
            displayRadius *
            (projection.baseLogoSize / gridTileReferenceLogoSize),
        )
      : projection.baseLogoSize;

  const cullLeft = projection.frame.x;
  const cullTop = projection.frame.y;
  const cullRight = projection.frame.x + projection.frame.width;
  const cullBottom = projection.frame.y + projection.frame.height;
  const drawable = projected.filter((card) => {
    if (card.opacity < 0.01) {
      return false;
    }
    const cullMargin = card.size * 2 + 160;
    return (
      card.x >= cullLeft - cullMargin &&
      card.x <= cullRight + cullMargin &&
      card.y >= cullTop - cullMargin &&
      card.y <= cullBottom + cullMargin
    );
  });

  if (projection.distribution === "grid") {
    renderLogoSphereGridCards({
      baseCardSize,
      cards: drawable,
      context,
      displayRadius,
      images,
      projection,
      style: cardStyle,
      totalCardCount: projected.length,
    });
  } else {
    drawable.forEach((card) => {
      const source = images[card.index % images.length];
      if (!source) {
        return;
      }
      drawProjectedLogo(
        context,
        source,
        card,
        baseCardSize,
        cardStyle,
        shadowCastClearance,
      );
    });
  }

  applyLogoSphereMask(context, projection);
  if (backgroundColor) {
    placeBackgroundBehindLogos(context, projection, backgroundColor);
  }
  context.restore();

  return projected;
}
