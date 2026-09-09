import type { DotsLoopTiming } from "./dots-timing";

export type DotDistribution = "fill" | "outline" | "mixed";
export type DotLaunch = "grid" | "ring" | "scatter";

export type DotFontStyle = Readonly<{
  color: string;
  family: string;
  fontId: string;
  fontSize: number;
  fontWeight: string;
  letterSpacing: "tight" | "tighter" | "normal" | "wide" | "wider" | "widest";
  lineHeight: "loose" | "none" | "normal" | "relaxed" | "snug" | "tight";
  opacity: number;
  textCase: "capitalize" | "lowercase" | "original" | "titleCase" | "uppercase";
}>;

export type DotGradientStop = Readonly<{
  color: string;
  opacity: number;
  position: number;
}>;

export type DotGradient = Readonly<{
  angle: number;
  gradientType: "angular" | "diamond" | "linear" | "radial";
  stops: readonly DotGradientStop[];
}>;

export type DotsSettings = Readonly<{
  appearance: Readonly<{
    background: string;
    glow: number;
    palette: DotGradient;
    sizeMotion: number;
    trails: number;
  }>;
  canvas: Readonly<{
    height: number;
    width: number;
  }>;
  motion: DotsLoopTiming;
  particles: Readonly<{
    count: number;
    distribution: DotDistribution;
    edgeSpill: number;
    launch: DotLaunch;
    size: readonly [number, number];
  }>;
  physics: Readonly<{
    attraction: number;
    damping: number;
    mass: number;
    turbulence: number;
  }>;
  text: string;
  typography: DotFontStyle;
}>;

export type DotPoint = Readonly<{ x: number; y: number }>;

export type DotMotionProfile = Readonly<{
  curlFrequency: number;
  delay: number;
  holdCos: number;
  holdSin: number;
  massScale: number;
  releaseDirection: -1 | 1;
}>;

export type DotParticle = Readonly<{
  index: number;
  motion?: DotMotionProfile;
  seed: number;
  start: DotPoint;
  target: DotPoint;
}>;

export type DotPlan = Readonly<{
  key: string;
  particles: readonly DotParticle[];
}>;
