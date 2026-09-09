import { generateTemplateContent } from "./poster-model";
import {
  templateAspect,
  type MicrographTemplateId,
} from "./template-catalog";
import type { MicrographElement } from "./poster-types";

export const MICROGRAPH_TEMPLATE_DRAG_TYPE =
  "application/x-toolcraft-micrographics-template";

type PlacementBase = {
  canvasHeight: number;
  canvasWidth: number;
  elementIndex: number;
  id?: string;
  seed: number;
  template: MicrographTemplateId;
};

type PointPlacementInput = PlacementBase & {
  point: {
    x: number;
    y: number;
  };
};

type RegionPlacementInput = PlacementBase & {
  region: {
    height: number;
    width: number;
    x: number;
    y: number;
  };
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function elementSeed(input: PlacementBase): number {
  return Math.round(input.seed) * 1009 + (input.elementIndex + 1) * 131 + 53;
}

function createElement(
  input: PlacementBase,
  rect: { height: number; width: number; x: number; y: number },
): MicrographElement {
  const seed = elementSeed(input);

  return {
    content: generateTemplateContent(input.template, seed),
    height: Math.round(rect.height),
    id:
      input.id ??
      `element-${input.template}-${seed.toString(36)}-${input.elementIndex + 1}`,
    opacity: 100,
    seed,
    template: input.template,
    typeScale: 100,
    width: Math.round(rect.width),
    x: Math.round(rect.x),
    y: Math.round(rect.y),
  };
}

export function createTemplatePlacement(
  input: PointPlacementInput,
): MicrographElement {
  const aspect = templateAspect(input.template);
  const maximumWidth = Math.max(1, input.canvasWidth * 0.32);
  const maximumHeight = Math.max(1, input.canvasHeight * 0.22);
  let width = Math.min(maximumWidth, maximumHeight * aspect);
  let height = width / aspect;

  if (width < 80) {
    width = Math.min(80, input.canvasWidth);
    height = width / aspect;
  }
  if (height < 64) {
    height = Math.min(64, input.canvasHeight);
    width = height * aspect;
  }

  width = Math.min(width, input.canvasWidth);
  height = Math.min(height, input.canvasHeight);

  return createElement(input, {
    height,
    width,
    x: clamp(input.point.x - width / 2, 0, input.canvasWidth - width),
    y: clamp(input.point.y - height / 2, 0, input.canvasHeight - height),
  });
}

export function createTemplateRegionPlacement(
  input: RegionPlacementInput,
): MicrographElement {
  const x = clamp(Math.min(input.region.x, input.canvasWidth), 0, input.canvasWidth);
  const y = clamp(
    Math.min(input.region.y, input.canvasHeight),
    0,
    input.canvasHeight,
  );
  const availableWidth = Math.max(0, input.canvasWidth - x);
  const availableHeight = Math.max(0, input.canvasHeight - y);
  const minimumWidth = Math.min(60, availableWidth);
  const minimumHeight = Math.min(48, availableHeight);

  return createElement(input, {
    height: clamp(
      Math.abs(input.region.height),
      minimumHeight,
      availableHeight,
    ),
    width: clamp(Math.abs(input.region.width), minimumWidth, availableWidth),
    x,
    y,
  });
}
