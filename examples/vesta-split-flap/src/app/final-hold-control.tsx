"use client";

import * as React from "react";

import type { CreativeAppsKitCommand } from "@/creative-apps-kit/template-runtime";
import type {
  CreativeAppsKitControlRendererMap,
  CreativeAppsKitCustomControlRendererProps,
} from "@/creative-apps-kit/template-runtime/react";
import { Slider } from "@/creative-apps-kit/ui";

const finalHoldMinSeconds = 0;
const finalHoldMaxSeconds = 8;
const finalHoldStepSeconds = 0.1;
const timelineDurationMinSeconds = 1;
const timelineDurationMaxSeconds = 60;
const timelineSetDurationCommandType = "timeline." + "setDuration";
const durationEpsilon = 0.0001;

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(min, Math.min(max, value))
    : fallback;
}

function clampTimelineDuration(value: number): number {
  return Math.max(timelineDurationMinSeconds, Math.min(timelineDurationMaxSeconds, value));
}

function FinalHoldSlider({
  control,
  name,
  setValue,
  state,
  dispatch,
  value,
}: CreativeAppsKitCustomControlRendererProps): React.ReactNode {
  const min = control.min ?? finalHoldMinSeconds;
  const max = control.max ?? finalHoldMaxSeconds;
  const step = control.step ?? finalHoldStepSeconds;
  const numericValue = clampNumber(value, finalHoldMinSeconds, min, max);
  const previousHoldRef = React.useRef(numericValue);
  const durationRef = React.useRef(state.timeline.durationSeconds);

  previousHoldRef.current = numericValue;
  durationRef.current = state.timeline.durationSeconds;

  function commitHold(nextRawValue: number, meta?: Parameters<typeof setValue>[1]): void {
    const previousHold = previousHoldRef.current;
    const requestedHold = clampNumber(nextRawValue, previousHold, min, max);
    const requestedDelta = requestedHold - previousHold;

    if (Math.abs(requestedDelta) <= durationEpsilon) {
      setValue(requestedHold, meta);
      return;
    }

    const previousDuration = durationRef.current;
    const nextDuration = clampTimelineDuration(previousDuration + requestedDelta);
    const appliedHold = previousHold + (nextDuration - previousDuration);

    previousHoldRef.current = appliedHold;
    durationRef.current = nextDuration;
    setValue(appliedHold, meta);
    dispatch({
      durationSeconds: nextDuration,
      type: timelineSetDurationCommandType,
    } as CreativeAppsKitCommand);
  }

  return (
    <Slider
      baseValue={clampNumber(control.defaultValue, finalHoldMinSeconds, min, max)}
      disabled={control.disabled}
      markerCount={control.markerCount}
      max={max}
      min={min}
      name={name}
      onValueChange={commitHold}
      step={step}
      unit={control.unit}
      value={numericValue}
      valueLabel={control.valueLabel}
      variant={control.variant === "discrete" ? "discrete" : "continuous"}
    />
  );
}

export const vestaboardControlRenderers: CreativeAppsKitControlRendererMap = {
  finalHoldSlider: FinalHoldSlider,
};
