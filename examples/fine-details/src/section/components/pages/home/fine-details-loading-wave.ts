import type { FineDetailsLoadingSettings } from './fine-details-settings';

export interface FineDetailsLoadingWaveGeometry {
  duration: number;
  from: { x: number; y: number };
  mask: string;
  shift: { x: number; y: number };
  tileSize: number;
  to: { x: number; y: number };
}

export function getFineDetailsLoadingWaveGeometry(
  loading: FineDetailsLoadingSettings,
  cardSize: number,
): FineDetailsLoadingWaveGeometry {
  const angleRadians = (loading.angle * Math.PI) / 180;
  const axisX = Math.sin(angleRadians);
  const axisY = -Math.cos(angleRadians);
  const diagonal = cardSize * Math.SQRT2;
  const bandLength = (loading.waveWidth / 100) * diagonal;
  const axisExtent = Math.abs(axisX) + Math.abs(axisY);
  const passDistance = cardSize * axisExtent + bandLength;
  const passTime = Math.max(loading.passTime, 1);
  const travelDistance = passDistance * (1 + Math.max(loading.pause, 0) / passTime);
  const tileSize = cardSize * 3 + travelDistance;
  const gradientLength = tileSize * axisExtent;
  const halfBandShare = gradientLength > 0 ? (bandLength / 2 / gradientLength) * 100 : 0;
  const coreHalfShare = halfBandShare * (1 - loading.softness / 100);
  const centerOffset = (cardSize - tileSize) / 2;

  return {
    duration: loading.passTime + loading.pause,
    from: {
      x: centerOffset - (travelDistance / 2) * axisX,
      y: centerOffset - (travelDistance / 2) * axisY,
    },
    shift: {
      x: loading.distort * axisX,
      y: loading.distort * axisY,
    },
    mask: `linear-gradient(${loading.angle}deg, transparent ${50 - halfBandShare}%, #000 ${50 - coreHalfShare}%, #000 ${50 + coreHalfShare}%, transparent ${50 + halfBandShare}%)`,
    tileSize,
    to: {
      x: centerOffset + (travelDistance / 2) * axisX,
      y: centerOffset + (travelDistance / 2) * axisY,
    },
  };
}
