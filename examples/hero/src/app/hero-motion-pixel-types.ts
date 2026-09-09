export type HeroMotionFrameEvidence = Readonly<{
  crt: number;
  crtFlicker: number;
  crtPitch: number;
  crtScanlines: number;
  effectTime: number;
  frameDt: number;
  grain: number;
  grainSize: number;
  panRate: number;
  sequence: number;
}>;

export type HeroMotionRawPixelSample = Readonly<{
  frame: HeroMotionFrameEvidence;
  height: number;
  pixels: readonly number[];
  width: number;
}>;
