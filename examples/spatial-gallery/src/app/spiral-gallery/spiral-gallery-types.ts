import type { ToolcraftState } from "@/toolcraft/runtime";

export type SpiralGalleryFrameSnapshot = Readonly<{
  cardCount: number;
  currentIndex: number;
  flex: number;
  frame: number;
  settled: boolean;
  /** Signature of the applied shadow settings for browser evidence. */
  shadowSignature: string;
  texturesReady: boolean;
}>;

export type SpiralGalleryRenderRequest = Readonly<{
  includeBackground: boolean;
  now: number;
  state: ToolcraftState;
}>;

export type SpiralGalleryExportRequest = Readonly<{
  context: CanvasRenderingContext2D;
  includeBackground: boolean;
  pixelHeight: number;
  pixelWidth: number;
  state: ToolcraftState;
}>;

export type SpiralGalleryResource = Readonly<{
  canvas: HTMLCanvasElement;
  dispose: () => void;
  drawExport: (request: SpiralGalleryExportRequest) => Promise<void>;
  nudge: (kind: "drag" | "key" | "wheel", value: number) => void;
  ready: () => Promise<void>;
  render: (request: SpiralGalleryRenderRequest) => SpiralGalleryFrameSnapshot;
  setDragging: (dragging: boolean) => void;
  setPointer: (x: number, y: number) => void;
}>;

export const spiralGalleryMaxRenderedSources = 24;
