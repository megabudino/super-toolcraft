import { getCreativeAppsKitCanvasSizeTargetDimension } from "./runtime-targets";
import type { CreativeAppsKitControlSchema } from "./types";

export type CreativeAppsKitControlKeyframeCapabilityReason =
  | "control-type"
  | "runtime-owned-target";

export type CreativeAppsKitControlKeyframeCapability =
  | {
      capable: true;
      reason: "control-type";
    }
  | {
      capable: false;
      reason: CreativeAppsKitControlKeyframeCapabilityReason;
    };

const keyframeCapableControlTypes = new Set([
  "anchorGrid",
  "channelMixer",
  "color",
  "curves",
  "gradient",
  "rangeInput",
  "rangeSlider",
  "slider",
  "vector",
]);

export function getCreativeAppsKitControlKeyframeCapability(
  control: CreativeAppsKitControlSchema,
): CreativeAppsKitControlKeyframeCapability {
  if (getCreativeAppsKitCanvasSizeTargetDimension(control.target)) {
    return {
      capable: false,
      reason: "runtime-owned-target",
    };
  }

  if (keyframeCapableControlTypes.has(control.type)) {
    return {
      capable: true,
      reason: "control-type",
    };
  }

  return {
    capable: false,
    reason: "control-type",
  };
}
