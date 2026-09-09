export const creativeAppsKitRuntimeOwnedTargets = [
  "canvas.size.width",
  "canvas.size.height",
] as const;

export const creativeAppsKitReservedTargets = [
  ...creativeAppsKitRuntimeOwnedTargets,
  "selectedLayer.opacity",
  "selectedLayer.visible",
] as const;

export type CreativeAppsKitRuntimeOwnedTarget =
  (typeof creativeAppsKitRuntimeOwnedTargets)[number];

export type CreativeAppsKitReservedTarget = (typeof creativeAppsKitReservedTargets)[number];

export function getCreativeAppsKitCanvasSizeTargetDimension(
  target: string,
): "height" | "width" | null {
  switch (target) {
    case "canvas.size.height":
      return "height";
    case "canvas.size.width":
      return "width";
    default:
      return null;
  }
}

export function isCreativeAppsKitReservedTarget(
  target: string,
): target is CreativeAppsKitReservedTarget {
  return creativeAppsKitReservedTargets.includes(target as CreativeAppsKitReservedTarget);
}

export function isCreativeAppsKitRuntimeOwnedTarget(
  target: string,
): target is CreativeAppsKitRuntimeOwnedTarget {
  return creativeAppsKitRuntimeOwnedTargets.includes(target as CreativeAppsKitRuntimeOwnedTarget);
}
