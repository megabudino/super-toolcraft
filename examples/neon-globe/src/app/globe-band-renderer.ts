import * as THREE from "three";
import type { GlobeBandLogoSettings, GlobeBandSettings, GlobeSettings } from "./globe-model";
import { getBandDotMetrics } from "./globe-dot-grid";
import { isDotInsideLogoMask } from "./globe-logo-mask";
import { GLOBE_RADIUS, VISIBLE_HORIZON_Z } from "./globe-projection";

const BAND_DOT_COLOR = "#FFFFFF";
const LOGO_DOT_COLOR = "#000000";
const BAND_SAMPLE_COUNT = 192;
const BAND_EDGE_PADDING = 0.004;


type VisibleBandSegment = {
  bottom: THREE.Vector3[];
  top: THREE.Vector3[];
};

type BandSample = {
  bottom: THREE.Vector3;
  top: THREE.Vector3;
  visible: boolean;
  z: number;
};

type BandBounds = {
  maxY: number;
  minY: number;
  outerRadius: number;
};

type ScreenDot = readonly [number, number];

function appendDotToPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  dotRadius: number,
): void {
  context.moveTo(x + dotRadius, y);
  context.arc(x, y, dotRadius, 0, Math.PI * 2);
}


function getBandEdgeRadius(outerRadius: number, y: number): number {
  return Math.sqrt(Math.max(0, outerRadius * outerRadius - y * y));
}

function getBandBounds(
  band: GlobeBandSettings,
  distancePercent: number,
): BandBounds | null {
  const outerRadius = GLOBE_RADIUS + distancePercent / 100;
  const centerY = band.position / 100;
  const halfWidth = band.width / 200;
  const minY = Math.max(-outerRadius + BAND_EDGE_PADDING, centerY - halfWidth);
  const maxY = Math.min(outerRadius - BAND_EDGE_PADDING, centerY + halfWidth);

  return maxY > minY ? { maxY, minY, outerRadius } : null;
}

function interpolateBandSample(from: BandSample, to: BandSample): BandSample {
  const zDelta = to.z - from.z;
  const t = Math.abs(zDelta) < 0.000001
    ? 0.5
    : (VISIBLE_HORIZON_Z - from.z) / zDelta;
  const clamped = Math.min(1, Math.max(0, t));
  const top = from.top.clone().lerp(to.top, clamped);
  const bottom = from.bottom.clone().lerp(to.bottom, clamped);
  return {
    bottom,
    top,
    visible: true,
    z: VISIBLE_HORIZON_Z,
  };
}

function appendVisibleBandSegment(
  segments: VisibleBandSegment[],
  samples: BandSample[],
): void {
  if (samples.length >= 2) {
    segments.push({
      bottom: samples.map((sample) => sample.bottom),
      top: samples.map((sample) => sample.top),
    });
  }
}

function createBandSamples(
  band: GlobeBandSettings,
  distancePercent: number,
  orientation: THREE.Quaternion,
): BandSample[] {
  const bounds = getBandBounds(band, distancePercent);
  if (!bounds) {
    return [];
  }
  const { maxY, minY, outerRadius } = bounds;

  const topRadius = getBandEdgeRadius(outerRadius, maxY);
  const bottomRadius = getBandEdgeRadius(outerRadius, minY);

  return Array.from({ length: BAND_SAMPLE_COUNT }, (_, index) => {
    const theta = (index / BAND_SAMPLE_COUNT) * Math.PI * 2;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    const top = new THREE.Vector3(cosTheta * topRadius, maxY, sinTheta * topRadius);
    const bottom = new THREE.Vector3(cosTheta * bottomRadius, minY, sinTheta * bottomRadius);
    const z = top
      .clone()
      .add(bottom)
      .multiplyScalar(0.5)
      .applyQuaternion(orientation).z;
    return {
      bottom,
      top,
      visible: z >= VISIBLE_HORIZON_Z,
      z,
    };
  });
}

function createVisibleBandSegments(
  band: GlobeBandSettings,
  distancePercent: number,
  orientation: THREE.Quaternion,
): VisibleBandSegment[] {
  const samples = createBandSamples(band, distancePercent, orientation);
  if (samples.length < 2) {
    return [];
  }

  if (samples.every((sample) => sample.visible)) {
    return [
      {
        bottom: samples.map((sample) => sample.bottom),
        top: samples.map((sample) => sample.top),
      },
    ];
  }

  const segments: VisibleBandSegment[] = [];
  let current: BandSample[] = [];

  for (let index = 0; index < samples.length; index += 1) {
    const from = samples[index];
    const to = samples[(index + 1) % samples.length];

    if (from.visible && current.length === 0) {
      current.push(from);
    }

    if (from.visible && to.visible) {
      current.push(to);
      continue;
    }

    if (from.visible && !to.visible) {
      current.push(interpolateBandSample(from, to));
      appendVisibleBandSegment(segments, current);
      current = [];
      continue;
    }

    if (!from.visible && to.visible) {
      current = [interpolateBandSample(from, to), to];
    }
  }

  appendVisibleBandSegment(segments, current);
  return segments;
}

function drawProjectedBandSegment(
  context: CanvasRenderingContext2D,
  segment: VisibleBandSegment,
  orientation: THREE.Quaternion,
  centerX: number,
  centerY: number,
  radius: number,
): void {
  context.beginPath();
  segment.top.forEach((point, index) => {
    const projected = point.clone().applyQuaternion(orientation);
    const x = centerX + projected.x * radius;
    const y = centerY - projected.y * radius;
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });

  [...segment.bottom].reverse().forEach((point) => {
    const projected = point.clone().applyQuaternion(orientation);
    context.lineTo(centerX + projected.x * radius, centerY - projected.y * radius);
  });

  context.closePath();
  context.fill();
}

function drawBandDots(
  context: CanvasRenderingContext2D,
  band: GlobeBandSettings,
  distancePercent: number,
  columnSpacing: number,
  dotSize: number,
  logo: GlobeBandLogoSettings | undefined,
  orientation: THREE.Quaternion,
  centerX: number,
  centerY: number,
  radius: number,
): void {
  const bounds = getBandBounds(band, distancePercent);
  if (!bounds) {
    return;
  }

  const { maxY, minY, outerRadius } = bounds;
  const bandHeight = maxY - minY;
  const { columnCount, dotRadius, rowCount } = getBandDotMetrics({
    bandHeight,
    columnSpacing,
    dotSize,
    outerRadius,
    radius,
  });
  const rowPitchPixels = (bandHeight * radius) / rowCount;
  const columnPitchPixels = (Math.PI * 2 * outerRadius * radius) / columnCount;
  const logoDots: ScreenDot[] = [];
  let hasWhiteDots = false;

  context.fillStyle = BAND_DOT_COLOR;
  context.beginPath();
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const y = minY + ((rowIndex + 0.5) / rowCount) * bandHeight;
    const rowRadius = getBandEdgeRadius(outerRadius, y);

    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const theta = (columnIndex / columnCount) * Math.PI * 2;
      const local = new THREE.Vector3(
        Math.cos(theta) * rowRadius,
        y,
        Math.sin(theta) * rowRadius,
      );
      const projected = local.applyQuaternion(orientation);

      if (projected.z < VISIBLE_HORIZON_Z) {
        continue;
      }

      const x = centerX + projected.x * radius;
      const screenY = centerY - projected.y * radius;
      const isLogoDot = isDotInsideLogoMask({
        columnCount,
        columnIndex,
        columnPitchPixels,
        logo,
        rowCount,
        rowIndex,
        rowPitchPixels,
      });

      if (isLogoDot) {
        logoDots.push([x, screenY]);
      } else {
        hasWhiteDots = true;
        appendDotToPath(context, x, screenY, dotRadius);
      }
    }
  }

  if (hasWhiteDots) {
    context.fill();
  }

  if (logoDots.length > 0) {
    context.fillStyle = LOGO_DOT_COLOR;
    context.beginPath();
    for (const [x, y] of logoDots) {
      appendDotToPath(context, x, y, dotRadius);
    }
    context.fill();
    context.fillStyle = BAND_DOT_COLOR;
  }
}

export function drawBands(
  context: CanvasRenderingContext2D,
  settings: GlobeSettings,
  orientation: THREE.Quaternion,
  centerX: number,
  centerY: number,
  radius: number,
): void {
  context.save();
  context.fillStyle = settings.sphereColor;
  for (const band of settings.bands) {
    for (const segment of createVisibleBandSegments(
      band,
      settings.bandDistance,
      orientation,
    )) {
      drawProjectedBandSegment(context, segment, orientation, centerX, centerY, radius);
    }
  }
  context.fillStyle = BAND_DOT_COLOR;
  for (const band of settings.bands) {
    const logo = settings.logos.find((candidate) => candidate.bandId === band.id);
    drawBandDots(
      context,
      band,
      settings.bandDistance,
      settings.bandColumnSpacing,
      settings.bandDotSize,
      logo,
      orientation,
      centerX,
      centerY,
      radius,
    );
  }
  context.restore();
}
