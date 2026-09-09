export type DotRingColorStop = {
  color: string;
  opacity: number;
  position: number;
};

export type DotRingWaveFormula =
  | "audio"
  | "complex"
  | "organic"
  | "pulse"
  | "turbulent";

export type DotRingColorMode = "conic" | "energy" | "rows" | "spread";

export type DotRingAudioFrame = {
  bass: number;
  centroid: number;
  energy: number;
  high: number;
  lowMid: number;
  mid: number;
  transient: number;
  wave: number;
};

export type DotRingAudioProfile = {
  durationSeconds: number;
  frameRate: number;
  frames: readonly DotRingAudioFrame[];
  sourceName: string;
  sourcePath?: string;
};

export type DotRingSettings = {
  affectedAmplitude: number;
  background: string;
  calmAmplitude: number;
  colorMode: DotRingColorMode;
  colorSpread: number;
  density: number;
  dotSize: number;
  formula: DotRingWaveFormula;
  globalRotationSpeed: number;
  glow: number;
  palette: readonly DotRingColorStop[];
  radius: number;
  rotationSpeed: number;
  rowEchoSeconds: number;
  rows: number;
  sectorAngle: number;
  sizeResponse: number;
  speed: number;
};

export type DotRingVideoSettings = {
  format: "mp4" | "webm";
  resolution: "current" | "4k";
};

export type DotRingRenderOptions = {
  audioProfile?: DotRingAudioProfile | null;
  clearCanvas?: boolean;
  context: CanvasRenderingContext2D;
  drawBackground: boolean;
  durationSeconds: number;
  height: number;
  settings: DotRingSettings;
  timeSeconds: number;
  width: number;
};

export type DotRingFrameBead = Readonly<{
  fillStyle: string;
  row: number;
  scale: number;
  x: number;
  y: number;
}>;

export type DotRingFrameGeometry = Readonly<{
  beadRadius: number;
  beads: readonly DotRingFrameBead[];
  glowStrength: number;
}>;

export type DotRingSpatialFrameBead = Readonly<{
  index: number;
  intensity: number;
  row: number;
  scale: number;
  x: number;
  y: number;
}>;

export type DotRingSpatialFrameGeometry = Readonly<{
  beadRadius: number;
  beads: readonly DotRingSpatialFrameBead[];
}>;

export type DotRingFrameGeometryOptions = Pick<
  DotRingRenderOptions,
  | "audioProfile"
  | "durationSeconds"
  | "height"
  | "settings"
  | "timeSeconds"
  | "width"
>;
