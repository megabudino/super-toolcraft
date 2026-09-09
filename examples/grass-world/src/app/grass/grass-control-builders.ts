import type { ToolcraftControlSchema } from "@/toolcraft/runtime";

type GrassSliderOptions = Readonly<{
  defaultValue: number;
  description?: string;
  label: string;
  max: number;
  min: number;
  performanceReason: string;
  performanceRole?: "responsiveness" | "workload";
  semanticGroup?: string;
  sliderValueKind?: "continuous" | "discrete";
  step: number;
  target: string;
  unit?: string;
  variant?: "discrete";
  visibleWhen?: NonNullable<ToolcraftControlSchema["visibleWhen"]>;
}>;

export function grassResponsive(reason: string) {
  return {
    performanceReason: reason,
    performanceRole: "responsiveness" as const,
  };
}

export function grassSlider(
  options: GrassSliderOptions,
): ToolcraftControlSchema {
  return {
    defaultValue: options.defaultValue,
    description: options.description,
    label: options.label,
    max: options.max,
    min: options.min,
    orderRole: "detail",
    performanceReason: options.performanceReason,
    performanceRole: options.performanceRole ?? "responsiveness",
    semanticGroup: options.semanticGroup,
    sliderValueKind: options.sliderValueKind ?? "continuous",
    step: options.step,
    target: options.target,
    type: "slider",
    unit: options.unit,
    variant: options.variant,
    ...(options.visibleWhen ? { visibleWhen: options.visibleWhen } : {}),
  };
}
