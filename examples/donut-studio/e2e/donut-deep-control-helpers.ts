import { expect, type Locator } from "@playwright/test";

import { DONUT_DEFAULTS } from "../src/app/donut/donut-values";
import { setSliderValue } from "./donut-test-helpers";

export type DonutDeepControlType = "color" | "slider" | "switch";

export function getDonutDeepControlRole(
  componentType: DonutDeepControlType,
): "slider" | "switch" | "textbox" {
  if (componentType === "color") return "textbox";
  if (componentType === "switch") return "switch";
  return "slider";
}

export function getDonutVisibilityOwner(target: string): string | null {
  if (target === "studio.environmentBlur") return "studio.hdriVisible";
  if (
    target === "studio.shadowStrength" ||
    target === "studio.shadowSoftness"
  ) {
    return "studio.shadowsEnabled";
  }
  return null;
}

export function readDonutDeepControlDefault(
  target: string,
): boolean | string | number {
  const defaultTarget =
    target === "studio.hdriVisible"
      ? "studio.environmentBackdrop"
      : target;
  const settingPath = defaultTarget.startsWith("material.")
    ? `materials.${defaultTarget.slice("material.".length)}`
    : defaultTarget;
  let value: unknown = DONUT_DEFAULTS;
  for (const key of settingPath.split(".")) {
    if (typeof value !== "object" || value === null || !(key in value)) {
      throw new Error(`No reference default is mapped for ${target}.`);
    }
    value = (value as Record<string, unknown>)[key];
  }
  if (
    typeof value !== "boolean" &&
    typeof value !== "number" &&
    typeof value !== "string"
  ) {
    throw new Error(`Reference default for ${target} is not scalar.`);
  }
  return value;
}

export async function setAlternateDonutSliderValue(
  control: Locator,
  target?: string,
): Promise<void> {
  const slider = control.getByRole("slider");
  if (target === "sprinkles.surfaceOffset") {
    await expect(slider).toHaveAttribute("min", "-0.15");
    await setSliderValue(control, -0.08);
    await expect(slider).toHaveValue("-0.08");
    return;
  }
  const [currentValue, minValue, maxValue] = await Promise.all([
    slider.inputValue(),
    slider.getAttribute("min"),
    slider.getAttribute("max"),
  ]);
  const current = Number(currentValue);
  const min = Number(minValue ?? 0);
  const max = Number(maxValue ?? 1);
  await setSliderValue(control, Math.abs(current - max) > 1e-6 ? max : min);
}
