import { createToolcraftState } from "@/toolcraft/runtime";
import { describe, expect, it } from "vitest";

import { appSchema } from "./app-schema";
import {
  buildPosterScene,
  elementInk,
  generateTemplateContent,
  parseElements,
  serializeElements,
} from "./poster-model";
import { micrographTemplateIds } from "./template-catalog";
import {
  buildTemplatePrimitives,
  parseTemplateContent,
} from "./template-renderers";
import { createTemplatePlacement } from "./template-placement";

describe("micrographics generator", () => {
  it("micrographics schema controls have defaults and product output mappings", () => {
    const state = createToolcraftState(appSchema);
    const scene = buildPosterScene(state);

    expect(scene.elements).toHaveLength(8);
    expect(state.values["composition.seed"]).toBe(447);
    expect(state.values["composition.kit"]).toBe("minimal");
    expect(state.values["library.template"]).toBe("");
    expect(state.values["library.commands"]).toBeUndefined();
    expect(state.values["canvas.commands"]).toBeUndefined();
    expect(state.values["export.image.format"]).toBe("png");
    expect(scene.ink).toBe(state.values["ink.color"]);
    expect(serializeElements(scene.elements)).toHaveLength(8);
    for (const element of scene.elements) {
      expect(element.primitives.length).toBeGreaterThan(0);
      expect(element.width).toBeGreaterThan(0);
      expect(element.height).toBeGreaterThan(0);
    }
  });

  it("builds every distinct template grammar", () => {
    const signatures = micrographTemplateIds.map((template) =>
      JSON.stringify(
        buildTemplatePrimitives(template, {
          height: 220,
          lines: parseTemplateContent(generateTemplateContent(template, 137)),
          rng: () => 0.42,
          stroke: 1.6,
          typeScale: 1,
          width: 320,
        }),
      ),
    );

    expect(micrographTemplateIds).toHaveLength(104);
    expect(new Set(signatures).size).toBe(104);
  });

  it("keeps generated compositions deterministic and responsive to seed and count", () => {
    const state = createToolcraftState(appSchema, {
      values: {
        "composition.count": 12,
        "composition.layout": "[]",
        "composition.seed": 731,
      },
    });
    const first = buildPosterScene(state);
    const second = buildPosterScene(state);
    const changed = buildPosterScene({
      ...state,
      values: { ...state.values, "composition.seed": 732 },
    });

    expect(first).toEqual(second);
    expect(first.elements).toHaveLength(12);
    expect(first.elements.map((element) => `${element.template}:${element.x}`)).not.toEqual(
      changed.elements.map((element) => `${element.template}:${element.x}`),
    );
    expect(
      first.elements.reduce((total, element) => total + element.primitives.length, 0),
    ).toBeGreaterThan(100);
  });

  it("keeps pinned elements alongside live generated placement", () => {
    const state = createToolcraftState(appSchema, {
      values: {
        "composition.count": 3,
        "composition.layout": JSON.stringify([
          {
            color: "#10FF90",
            content: "42",
            height: 300,
            id: "element-1",
            opacity: 80,
            seed: 5,
            template: "big-number",
            typeScale: 100,
            width: 300,
            x: 111,
            y: 222,
          },
        ]),
      },
    });
    const scene = buildPosterScene(state);

    expect(scene.elements).toHaveLength(4);
    expect(scene.elements.at(-1)).toMatchObject({
      color: "#10FF90",
      template: "big-number",
      x: 111,
      y: 222,
    });
    expect(parseElements(state.values["composition.layout"])).toHaveLength(1);
  });

  it("normalizes edited Toolcraft color values into poster colors", () => {
    const state = createToolcraftState(appSchema, {
      values: {
        "appearance.background": { hex: "#10283A" },
        "ink.color": { hex: "#E6FF4A" },
      },
    });

    expect(buildPosterScene(state)).toMatchObject({
      background: "#10283A",
      ink: "#E6FF4A",
    });
  });

  it("keeps individual element colors when the global color changes", () => {
    const state = createToolcraftState(appSchema, {
      values: {
        "composition.count": 3,
        "composition.layout": JSON.stringify([
          {
            color: "#FF5C38",
            content: "7",
            height: 200,
            id: "element-1",
            opacity: 100,
            seed: 5,
            template: "big-number",
            typeScale: 100,
            width: 200,
            x: 40,
            y: 40,
          },
        ]),
        "ink.color": { hex: "#E6FF4A" },
      },
    });
    const scene = buildPosterScene(state);
    const authored = scene.elements.at(-1);
    const generated = scene.elements[0];

    expect(authored?.color).toBe("#FF5C38");
    expect(authored ? elementInk(scene, authored) : null).toBe("#FF5C38");
    expect(generated ? elementInk(scene, generated) : null).toBe("#E6FF4A");
  });

  it("migrates legacy two-tone layout entries into the color model", () => {
    const legacy = parseElements(
      JSON.stringify([
        {
          content: "A",
          height: 100,
          id: "legacy-dark",
          opacity: 100,
          seed: 1,
          template: "big-number",
          tone: "dark",
          typeScale: 100,
          width: 100,
          x: 0,
          y: 0,
        },
        {
          content: "B",
          height: 100,
          id: "legacy-light",
          opacity: 100,
          seed: 2,
          template: "big-number",
          tone: "light",
          typeScale: 100,
          width: 100,
          x: 120,
          y: 0,
        },
      ]),
    );

    expect(legacy[0]?.color).toBe("#0F0F0F");
    expect(legacy[1]?.color).toBeUndefined();
  });

  it("creates deterministic aspect-aware template placements around a point", () => {
    const input = {
      canvasHeight: 1350,
      canvasWidth: 1080,
      elementIndex: 8,
      point: { x: 540, y: 675 },
      seed: 137,
      template: "radar" as const,
    };
    const first = createTemplatePlacement(input);
    const second = createTemplatePlacement(input);

    expect(first).toMatchObject({
      height: 297,
      opacity: 100,
      template: "radar",
      typeScale: 100,
      width: 297,
      x: 392,
      y: 527,
    });
    expect(first.color).toBeUndefined();
    expect(first.content).toBe(second.content);
    expect(first.seed).toBe(second.seed);
  });

  it("clamps a dropped template inside the poster bounds", () => {
    const placed = createTemplatePlacement({
      canvasHeight: 1350,
      canvasWidth: 1080,
      elementIndex: 8,
      point: { x: 1076, y: 1346 },
      seed: 137,
      template: "radar",
    });

    expect(placed.x).toBeGreaterThanOrEqual(0);
    expect(placed.y).toBeGreaterThanOrEqual(0);
    expect(placed.x + placed.width).toBeLessThanOrEqual(1080);
    expect(placed.y + placed.height).toBeLessThanOrEqual(1350);
  });
});
