import type { MicrographTemplateId } from "./template-catalog";

export type InkFill = "ink" | "none" | "paper";

export type PosterLine = {
  kind: "line";
  width?: number;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
};

export type PosterRect = {
  fill?: InkFill;
  height: number;
  kind: "rect";
  radius?: number;
  stroke?: boolean;
  width: number;
  x: number;
  y: number;
};

export type PosterCircle = {
  fill?: InkFill;
  kind: "circle";
  radius: number;
  stroke?: boolean;
  x: number;
  y: number;
};

export type PosterPolyline = {
  closed?: boolean;
  fill?: InkFill;
  holes?: readonly (readonly [number, number][])[];
  kind: "polyline";
  points: readonly [number, number][];
  width?: number;
};

export type PosterText = {
  align?: "center" | "left" | "right";
  family?: "mono" | "sans";
  fill?: "ink" | "paper";
  kind: "text";
  letterSpacing?: number;
  size: number;
  text: string;
  weight?: number;
  x: number;
  y: number;
};

export type PosterPrimitive =
  | PosterCircle
  | PosterLine
  | PosterPolyline
  | PosterRect
  | PosterText;

export type MicrographElement = {
  color?: string;
  content: string;
  removed?: boolean;
  height: number;
  id: string;
  opacity: number;
  seed: number;
  template: MicrographTemplateId;
  typeScale: number;
  width: number;
  x: number;
  y: number;
};

export type RenderedElement = MicrographElement & {
  primitives: readonly PosterPrimitive[];
  strokeWidth: number;
};

export type PosterScene = {
  background: string;
  elements: readonly RenderedElement[];
  globalOpacity: number;
  glow: number;
  includeBackground: boolean;
  ink: string;
};
