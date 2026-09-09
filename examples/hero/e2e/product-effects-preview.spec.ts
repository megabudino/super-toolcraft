import { heroDispersionTargets } from "../src/app/hero-dispersion-values";
import { registerHeroPreviewControlTests } from "./hero-preview-browser-helpers";

const target = heroDispersionTargets;
const waveEnabled = [
  { action: "switch" as const, target: target.warpWaveEnabled },
];
const prismEnabled = [
  {
    action: "segmented" as const,
    target: target.warpStyle,
    value: "Prism",
  },
];

registerHeroPreviewControlTests([
  { acceptanceId: target.edgeWidth, action: "slider" },
  { acceptanceId: target.curve, action: "slider" },
  { acceptanceId: target.edgeFade, action: "slider" },
  { acceptanceId: target.turbulence, action: "slider" },
  { acceptanceId: target.turbulenceScale, action: "slider" },
  { acceptanceId: target.warp, action: "slider" },
  { acceptanceId: target.warpStyle, action: "segmented", value: "Prism" },
  { acceptanceId: target.warpOffset, action: "slider" },
  { acceptanceId: target.warpWaveEnabled, action: "switch" },
  {
    acceptanceId: target.warpWaveKind,
    action: "segmented",
    prerequisites: waveEnabled,
    value: "Ripple",
  },
  {
    acceptanceId: target.warpWave,
    action: "slider",
    prerequisites: waveEnabled,
  },
  {
    acceptanceId: target.warpWaveLength,
    action: "slider",
    prerequisites: waveEnabled,
  },
  {
    acceptanceId: target.warpWaveBlur,
    action: "slider",
    prerequisites: waveEnabled,
  },
  {
    acceptanceId: target.warpFace,
    action: "slider",
    prerequisites: prismEnabled,
  },
  {
    acceptanceId: target.warpSharpness,
    action: "slider",
    prerequisites: prismEnabled,
  },
  { acceptanceId: target.amount, action: "slider" },
  { acceptanceId: target.count, action: "slider" },
  { acceptanceId: target.spectrum, action: "slider" },
  { acceptanceId: target.hue, action: "slider" },
  { acceptanceId: target.blur, action: "slider" },
  { acceptanceId: target.aura, action: "slider" },
  { acceptanceId: target.gateOffset, action: "slider" },
  { acceptanceId: target.gateWidth, action: "slider" },
  { acceptanceId: target.gateGlow, action: "slider" },
  { acceptanceId: target.gateRefraction, action: "slider" },
]);
