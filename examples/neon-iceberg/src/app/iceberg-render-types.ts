import type { ToolcraftProductExportFrameContext } from '@/toolcraft/runtime';
import type { IcebergSettings } from './iceberg-controls';
export type IcebergPose = { position: readonly number[]; up: readonly number[] };
export type IcebergEngine = {
  canvas: HTMLCanvasElement;
  draw: (settings: IcebergSettings, pose: IcebergPose, width: number, height: number) => void;
  hitTest: (clientX: number, clientY: number) => boolean;
  exportFrame: (settings: IcebergSettings, pose: IcebergPose, frame: ToolcraftProductExportFrameContext) => Promise<void>;
  dispose: () => void;
};
