import { describe, expect, it } from "vitest";
import { createToolcraftState } from "@/toolcraft/runtime";

import { appSchema } from "../app-schema";
import { readHeroParams } from "./hero-params";
import { maskItemDefaults, readHeroMasks } from "./masks";

describe("circle masks", () => {
  it("reads circle masks into renderer parameters and keeps preview editor-only", () => {
    const records = [
      {
        enabled: true,
        feather: 25,
        opacity: 65,
        position: { x: -0.25, y: 0.5 },
        radius: 40,
        rotation: 30,
        stretch: 1.5,
      },
      { enabled: false },
      { radius: 151 },
    ];

    expect(
      readHeroMasks({
        "masks.enabled": true,
        "masks.items": records,
        "masks.preview": true,
      }),
    ).toEqual({
      items: [
        {
          enabled: true,
          feather: 0.25,
          opacity: 0.65,
          position: { x: -0.25, y: 0.5 },
          radius: 0.4,
          rotation: 30,
          stretch: 1.5,
        },
        {
          enabled: false,
          feather: maskItemDefaults.feather / 100,
          opacity: maskItemDefaults.opacity / 100,
          position: maskItemDefaults.position,
          radius: maskItemDefaults.radius / 100,
          rotation: maskItemDefaults.rotation,
          stretch: maskItemDefaults.stretch,
        },
      ],
      mode: "apply",
    });
    expect(
      readHeroMasks(
        {
          "masks.enabled": true,
          "masks.items": records,
          "masks.preview": true,
        },
        { preview: true },
      ).mode,
    ).toBe("preview");
    expect(readHeroMasks({ "masks.enabled": false, "masks.preview": true }).mode).toBe("off");

    const state = createToolcraftState(appSchema, {
      values: {
        "masks.enabled": true,
        "masks.items": [records[0]],
        "masks.preview": true,
      },
    });
    expect(readHeroParams(state).masks.mode).toBe("apply");
    expect(readHeroParams(state, { preview: true }).masks.mode).toBe("preview");
  });
});
