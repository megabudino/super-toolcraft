import type { CreativeAppsKitLayer } from "../state/types";

export function getCreativeAppsKitLayerById(
  layers: readonly CreativeAppsKitLayer[],
  layerId: string | undefined,
): CreativeAppsKitLayer | undefined {
  return layerId ? layers.find((layer) => layer.id === layerId) : undefined;
}

export function getCreativeAppsKitLayerDepth(
  layers: readonly CreativeAppsKitLayer[],
  layer: CreativeAppsKitLayer,
): number {
  let depth = 0;
  let parentLayer = getCreativeAppsKitLayerById(layers, layer.parentGroupId);
  const visited = new Set<string>([layer.id]);

  while (parentLayer && !visited.has(parentLayer.id)) {
    depth += 1;
    visited.add(parentLayer.id);
    parentLayer = getCreativeAppsKitLayerById(layers, parentLayer.parentGroupId);
  }

  return depth;
}

export function isCreativeAppsKitLayerInsideGroup(
  layers: readonly CreativeAppsKitLayer[],
  layer: CreativeAppsKitLayer,
  groupLayerId: string,
): boolean {
  let parentLayer = getCreativeAppsKitLayerById(layers, layer.parentGroupId);
  const visited = new Set<string>([layer.id]);

  while (parentLayer && !visited.has(parentLayer.id)) {
    if (parentLayer.id === groupLayerId) {
      return true;
    }

    visited.add(parentLayer.id);
    parentLayer = getCreativeAppsKitLayerById(layers, parentLayer.parentGroupId);
  }

  return false;
}

export function isCreativeAppsKitLayerHiddenByCollapsedParent(
  layers: readonly CreativeAppsKitLayer[],
  layer: CreativeAppsKitLayer,
): boolean {
  let parentLayer = getCreativeAppsKitLayerById(layers, layer.parentGroupId);
  const visited = new Set<string>([layer.id]);

  while (parentLayer && !visited.has(parentLayer.id)) {
    if (parentLayer.collapsed) {
      return true;
    }

    visited.add(parentLayer.id);
    parentLayer = getCreativeAppsKitLayerById(layers, parentLayer.parentGroupId);
  }

  return false;
}

export function isCreativeAppsKitLayerVisibleInTree(
  layers: readonly CreativeAppsKitLayer[],
  layerOrId: CreativeAppsKitLayer | string,
): boolean {
  const layer =
    typeof layerOrId === "string" ? getCreativeAppsKitLayerById(layers, layerOrId) : layerOrId;

  if (!layer?.visible) {
    return false;
  }

  let parentLayer = getCreativeAppsKitLayerById(layers, layer.parentGroupId);
  const visited = new Set<string>([layer.id]);

  while (parentLayer && !visited.has(parentLayer.id)) {
    if (!parentLayer.visible) {
      return false;
    }

    visited.add(parentLayer.id);
    parentLayer = getCreativeAppsKitLayerById(layers, parentLayer.parentGroupId);
  }

  return true;
}

export function getCreativeAppsKitVisibleLayerRows(
  layers: readonly CreativeAppsKitLayer[],
): CreativeAppsKitLayer[] {
  return layers.filter((layer) => !isCreativeAppsKitLayerHiddenByCollapsedParent(layers, layer));
}
