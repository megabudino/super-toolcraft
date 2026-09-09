import type { ToolcraftState } from "@/toolcraft/runtime";

import type { HeroParams } from "./hero-params";

export const FLOW_DURATION_SECONDS = 8;
export const flowDefaults = {
  direction: "toward",
  glowOrbit: 0,
  glowOrbitRadius: 0.05,
  travel: 1,
} as const;

export type HeroFlow = Readonly<{
  direction: "toward" | "away";
  glowOrbit: number;
  glowOrbitRadius: number;
  travel: number;
}>;

function bounded(value: unknown, fallback: number, max: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(0, value))
    : fallback;
}

export function readHeroFlow(state: Readonly<ToolcraftState>): HeroFlow {
  const { values } = state;
  return {
    direction: values["flow.direction"] === "away" ? "away" : "toward",
    glowOrbit: Math.round(bounded(values["flow.glowOrbit"], flowDefaults.glowOrbit, 3)),
    glowOrbitRadius: bounded(values["flow.glowOrbitRadius"], flowDefaults.glowOrbitRadius, 0.4),
    travel: Math.round(bounded(values["flow.travel"], flowDefaults.travel, 6)),
  };
}

export function evaluateHeroFlow(
  params: HeroParams,
  flow: HeroFlow,
  progress: number,
): HeroParams {
  const p = Number.isFinite(progress) ? progress : 0;
  const travel = (flow.direction === "toward" ? 1 : -1) *
    flow.travel * params.structure.spacing * p;
  const turns = flow.glowOrbit * p;
  const phase = (turns - Math.floor(turns)) * Math.PI * 2;
  const orbit = flow.glowOrbit > 0 && flow.glowOrbitRadius > 0;
  if (travel === 0 && !orbit) return params;
  return {
    ...params,
    haze: orbit ? {
      ...params.haze,
      glowPosition: {
        x: params.haze.glowPosition.x + flow.glowOrbitRadius * Math.cos(phase),
        y: params.haze.glowPosition.y + flow.glowOrbitRadius * Math.sin(phase),
      },
    } : params.haze,
    structure: { ...params.structure, travel },
  };
}

const performanceReason =
  "Flow edits update retained geometry uniforms and frame shading without rebuilding the mesh.";

export const flowSection = {
  controls: {
    travel: {
      applicability: { mode: "always" },
      defaultValue: flowDefaults.travel,
      description: "Whole ribs travelled per loop. Speed follows the timeline Duration; zero stops rib movement.",
      label: "Ribs per loop", min: 0, max: 6, step: 1,
      performanceReason, performanceRole: "responsiveness",
      sliderValueKind: "discrete", variant: "discrete",
      target: "flow.travel", type: "slider",
    },
    direction: {
      applicability: { mode: "always" },
      defaultValue: flowDefaults.direction,
      description: "Toward moves along +X, toward the authored hero camera; Away moves along −X.",
      label: "Direction",
      options: [{ label: "Toward", value: "toward" }, { label: "Away", value: "away" }],
      performanceReason, performanceRole: "responsiveness",
      target: "flow.direction", type: "segmented",
    },
    glowOrbit: {
      applicability: { mode: "always" },
      defaultValue: flowDefaults.glowOrbit,
      description: "Whole turns the glow makes around its authored position per loop; zero leaves it in place.",
      label: "Glow orbit", min: 0, max: 3, step: 1, unit: "turns",
      performanceReason, performanceRole: "responsiveness",
      sliderValueKind: "discrete", variant: "discrete",
      target: "flow.glowOrbit", type: "slider",
    },
    glowOrbitRadius: {
      applicability: { mode: "always" },
      defaultValue: flowDefaults.glowOrbitRadius,
      description: "Size of the glow orbit in the frame's normalized position coordinates.",
      label: "Glow radius", min: 0, max: 0.4, step: 0.01,
      performanceReason, performanceRole: "responsiveness",
      sliderValueKind: "continuous",
      target: "flow.glowOrbitRadius", type: "slider",
    },
  },
  id: "flow",
  title: "Flow",
} as const;
