import type { ToolcraftPanelActionContext } from "@/toolcraft/runtime/react";

import { grassDefaults } from "./grass-defaults";
import {
  advanceGrassWorldId,
  compileGrassWorldPatch,
  decodeGrassWorldId,
  GRASS_FORCED_VISIBLE_TARGETS,
  getGrassWorldScale,
  matchesCompiledGrassWorld,
  normalizeGrassWorldId,
  type GrassRandomizationPatch,
  type GrassWorldAxes,
} from "./grass-world-generator";
import {
  createGrassWorldScaleMarker,
  recoverGrassWorldScaleReference,
  type GrassWorldScaleMarker,
} from "./grass-world-scale";

type RandomizationOptions = Readonly<{
  currentValues: Readonly<Record<string, unknown>>;
  generatedScaleMarker?: GrassWorldScaleMarker | null;
}>;

type RandomizationContext = Readonly<{
  dispatch: ToolcraftPanelActionContext["dispatch"];
  state: Pick<ToolcraftPanelActionContext["state"], "mediaAssets" | "values">;
}>;

export type GrassSceneVariation = Readonly<{
  axes: GrassWorldAxes;
  generatedScaleMarker: GrassWorldScaleMarker;
  patch: GrassRandomizationPatch;
  worldId: number;
}>;

const generatedScaleMarkers = new WeakMap<
  RandomizationContext["dispatch"],
  GrassWorldScaleMarker
>();

export function createGrassSceneVariation({
  currentValues,
  generatedScaleMarker = null,
}: RandomizationOptions): GrassSceneVariation {
  const currentWorldId =
    currentValues["field.seed"] ?? grassDefaults["field.seed"];
  const worldId = advanceGrassWorldId(currentWorldId);
  const normalizedCurrentWorldId = normalizeGrassWorldId(currentWorldId);
  const isPreviousGeneratedWorld = matchesCompiledGrassWorld(
    currentValues,
    normalizedCurrentWorldId,
  );
  const scaleReference = recoverGrassWorldScaleReference(
    currentValues,
    getGrassWorldScale(currentWorldId),
    isPreviousGeneratedWorld,
    generatedScaleMarker,
  );
  const patch = compileGrassWorldPatch(worldId, scaleReference);
  return {
    axes: decodeGrassWorldId(worldId),
    generatedScaleMarker: createGrassWorldScaleMarker(scaleReference, patch),
    patch,
    worldId,
  };
}

export function applyGrassSceneRandomization(
  context: RandomizationContext,
): number {
  const variation = createGrassSceneVariation({
    currentValues: context.state.values,
    generatedScaleMarker:
      generatedScaleMarkers.get(context.dispatch) ?? null,
  });
  for (const [target, value] of Object.entries(variation.patch)) {
    context.dispatch({
      history: "skip",
      label: "Randomize scene",
      target,
      type: "controls.setValue",
      value,
    });
  }
  generatedScaleMarkers.set(
    context.dispatch,
    variation.generatedScaleMarker,
  );
  return variation.worldId;
}

export function applyGrassSceneScratch(context: RandomizationContext): void {
  for (const target of GRASS_FORCED_VISIBLE_TARGETS) {
    context.dispatch({
      history: "skip",
      label: "Start from scratch",
      target,
      type: "controls.setValue",
      value: target === "field.showGround",
    });
  }
}

export type { GrassRandomizationPatch } from "./grass-world-generator";
