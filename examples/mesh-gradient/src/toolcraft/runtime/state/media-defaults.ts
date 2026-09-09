import type { ResolvedToolcraftAppSchema } from "../schema/types";
import {
  createToolcraftDefaultModelPlaceholder,
  resolveToolcraftDefaultModelControl,
} from "../model-import/default-model-source-assets";
import { cloneToolcraftModelAssetRecord } from "../model-import/model-asset-metadata";
import type {
  ToolcraftImageAsset,
  ToolcraftInitialMediaAsset,
  ToolcraftLayer,
  ToolcraftMediaAsset,
  ToolcraftModelAsset,
} from "./types";

export type ToolcraftDefaultMediaState = {
  layers: ToolcraftLayer[];
  mediaAssets: ToolcraftMediaAsset[];
  selectedLayerId: string | null;
};

function getDefaultLayerName(fileName: string): string {
  const baseName = fileName.replace(/\.[^.]+$/u, "").trim();

  return baseName || "Media";
}

function cloneImageAsset(
  asset: Extract<ToolcraftInitialMediaAsset, { assetKind?: "image" }>,
): ToolcraftImageAsset {
  return {
    assetKind: "image",
    dataUrl: asset.dataUrl,
    fileName: asset.fileName,
    id: asset.id,
    layerId: asset.layerId,
    mimeType: asset.mimeType,
    position: { ...asset.position },
    ...(asset.sourceTarget ? { sourceTarget: asset.sourceTarget } : {}),
    ...(asset.size ? { size: { ...asset.size } } : {}),
    ...(asset.transform ? { transform: { ...asset.transform } } : {}),
  };
}

function cloneModelAsset(asset: ToolcraftModelAsset): ToolcraftModelAsset {
  const record = cloneToolcraftModelAssetRecord(asset);

  return {
    ...record,
    assetKind: "model",
    fileName: asset.fileName,
    id: asset.id,
    layerId: asset.layerId,
    mimeType: asset.mimeType,
    ...(asset.sourceTarget ? { sourceTarget: asset.sourceTarget } : {}),
  };
}

function cloneMediaAsset(asset: ToolcraftInitialMediaAsset): ToolcraftMediaAsset {
  if (asset.assetKind === "model") {
    return cloneModelAsset(asset);
  }

  if (asset.assetKind === "file") {
    return {
      assetKind: "file",
      dataUrl: asset.dataUrl,
      fileName: asset.fileName,
      id: asset.id,
      layerId: asset.layerId,
      mimeType: asset.mimeType,
      position: { ...asset.position },
      ...(asset.sourceTarget ? { sourceTarget: asset.sourceTarget } : {}),
    };
  }

  return cloneImageAsset(asset);
}

function cloneLayer(layer: ToolcraftLayer): ToolcraftLayer {
  return { ...layer };
}

export function cloneToolcraftMediaAssets(
  mediaAssets: readonly ToolcraftInitialMediaAsset[],
): ToolcraftMediaAsset[] {
  return mediaAssets.map(cloneMediaAsset);
}

export function cloneToolcraftLayers(layers: readonly ToolcraftLayer[]): ToolcraftLayer[] {
  return layers.map(cloneLayer);
}

export function createToolcraftLayersFromMediaAssets(
  mediaAssets: readonly ToolcraftMediaAsset[],
  defaultLayers: readonly ToolcraftLayer[] = [],
): ToolcraftLayer[] {
  const layers: ToolcraftLayer[] = [];
  const defaultLayerById = new Map(defaultLayers.map((layer) => [layer.id, layer]));
  const seenLayerIds = new Set<string>();

  for (const asset of mediaAssets) {
    if (seenLayerIds.has(asset.layerId)) {
      continue;
    }

    seenLayerIds.add(asset.layerId);
    layers.push(
      cloneLayer(
        defaultLayerById.get(asset.layerId) ?? {
          displayName: getDefaultLayerName(asset.fileName),
          id: asset.layerId,
          kind: "layer",
          name: getDefaultLayerName(asset.fileName),
          visible: true,
        },
      ),
    );
  }

  return layers;
}

export function createToolcraftDefaultMediaState(
  schema: ResolvedToolcraftAppSchema,
): ToolcraftDefaultMediaState {
  const layers: ToolcraftLayer[] = [];
  const mediaAssets: ToolcraftMediaAsset[] = [];

  schema.media.defaultAssets.forEach((asset, index) => {
    if (asset.assetKind === "model") {
      const control = resolveToolcraftDefaultModelControl(schema, asset);
      const model = createToolcraftDefaultModelPlaceholder({
        asset,
        index,
        topologyProfile: control.topologyProfile ?? "realtime-mesh",
      });
      const layerName = asset.layerName ?? getDefaultLayerName(asset.fileName);

      layers.push({
        displayName: layerName,
        id: model.layerId,
        kind: "layer",
        name: layerName,
        visible: true,
      });
      mediaAssets.push(model);
      return;
    }

    const layerId = asset.layerId ?? `default-media-layer-${index + 1}`;
    const layerName = asset.layerName ?? getDefaultLayerName(asset.fileName);

    layers.push({
      displayName: layerName,
      id: layerId,
      kind: "layer",
      name: layerName,
      visible: true,
    });
    mediaAssets.push({
      assetKind: asset.assetKind === "file" ? "file" : "image",
      dataUrl: asset.dataUrl,
      fileName: asset.fileName,
      id: asset.id ?? `default-media-${index + 1}`,
      layerId,
      mimeType: asset.mimeType ?? (asset.assetKind === "file" ? "application/octet-stream" : "image/*"),
      position: asset.position ?? { x: 0, y: 0 },
      ...(asset.size ? { size: asset.size } : {}),
      ...(asset.sourceTarget ? { sourceTarget: asset.sourceTarget } : {}),
      ...(asset.transform ? { transform: asset.transform } : {}),
    });
  });

  return {
    layers,
    mediaAssets,
    selectedLayerId: layers[0]?.id ?? null,
  };
}
