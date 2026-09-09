import { describe, expect, it } from "vitest";
import {
  createToolcraftState,
  isToolcraftRuntimeOwnedTarget,
} from "@/toolcraft/runtime";

import { appAcceptance, appControlSectionInventory } from "./app-acceptance-data";
import { appSchema } from "./app-schema";
import {
  createMeshFrameSignature,
  getMeshColorLoopOffset,
} from "./mesh-gradient/mesh-webgl";

describe("mesh gradient acceptance mapping", () => {
  it("keeps animated color continuous across the loop seam", () => {
    const basePhase = 1.37;

    for (const cycles of [1, 2, 3]) {
      const start = getMeshColorLoopOffset({ basePhase, cycles, progress: 0 });
      const end = getMeshColorLoopOffset({ basePhase, cycles, progress: 1 });

      expect(end).toBeCloseTo(start, 10);
    }

    expect(
      Math.abs(getMeshColorLoopOffset({ basePhase, cycles: 1, progress: 0.25 })),
    ).toBeGreaterThan(0.1);
  });

  it("app acceptance maps mesh editor state to renderer output", () => {
    const controls =
      appSchema.panels.controls?.sections.flatMap((section) =>
        Object.values(section.controls),
      ) ?? [];
    const productTargets = controls
      .map((control) => control.target)
      .filter((target) => !isToolcraftRuntimeOwnedTarget(target));
    const acceptedTargets = new Set(
      appAcceptance.flatMap((entry) => (entry.target ? [entry.target] : [])),
    );
    const inventoryTargets = new Set(
      appControlSectionInventory.flatMap((section) => section.targets),
    );

    for (const target of productTargets) {
      expect(acceptedTargets.has(target), `Missing acceptance for ${target}`).toBe(true);
      if (target !== "export.actions") {
        expect(inventoryTargets.has(target), `Missing section inventory for ${target}`).toBe(
          true,
        );
      }
    }

    const baseline = createToolcraftState(appSchema);
    const changed = {
      ...baseline,
      values: { ...baseline.values, "mix.spread": 82 },
    };
    expect(createMeshFrameSignature(changed, 0.25)).not.toBe(
      createMeshFrameSignature(baseline, 0.25),
    );
    expect(appAcceptance.some((entry) => entry.id === "mesh-timeline")).toBe(true);
    expect(appAcceptance.some((entry) => entry.id === "mesh-persistence")).toBe(true);
  });
});
