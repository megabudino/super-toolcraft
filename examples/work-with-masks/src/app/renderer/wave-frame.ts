import type { WavePlacement } from "../domain/wave-placement";

export type SceneRect = Readonly<{
  height: number;
  width: number;
  x: number;
  y: number;
}>;

export function getWaveFrame(scene: SceneRect, placement: WavePlacement): SceneRect {
  return {
    height: placement.height,
    width: placement.width,
    x: scene.x + (scene.width - placement.width) / 2 + placement.position.x,
    y: scene.y + (scene.height - placement.height) / 2 + placement.position.y,
  };
}
