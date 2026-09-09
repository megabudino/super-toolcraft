import { describe, expect, it } from "vitest";

import {
  DONUT_DEFAULTS,
  linearRgbToHex,
  readDonutSettings,
} from "./donut-values";

describe("donut settings boundary", () => {
  it("uses the supplied settings snapshot as the complete app default", () => {
    expect(DONUT_DEFAULTS).toEqual({
      background: { color: "#C8B1BD", include: true },
      donut: {
        height: 1,
        majorRadius: 1,
        organic: 1,
        thickness: 1,
      },
      icing: {
        clearMode: "none",
        color: "#F26D9C",
        coverage: 1.05,
        detail: 1,
        dripAmount: 1,
        dripFrequency: 1,
        enabled: true,
        flow: 1,
        thickness: 1,
      },
      image: { format: "png", resolution: "4k" },
      materials: {
        donut: {
          bake: 0.65,
          coat: 0.12,
          color: "#9C6235",
          moisture: 0.22,
          pores: 0.65,
          roughness: 0.58,
          sheen: 0.15,
          softness: 0.08,
          subsurface: 0.28,
          variation: 0.55,
        },
        icing: {
          coat: 0.3,
          glaze: 0.55,
          roughness: 0.5,
          sheen: 0.15,
          subsurface: 0.35,
          texture: 0.4,
        },
        plate: {
          coat: 0.34,
          color: "#F1EEE7",
          roughness: 0.19454545,
        },
        sprinkle: {
          coat: 0.16,
          roughness: 0.31,
        },
      },
      plateVisible: true,
      renderScale: 2,
      sprinkles: {
        clear: false,
        coverage: 1,
        flow: 1.25,
        metallic: 0,
        palette: 4,
        rotation: 1,
        scale: 0.5,
        seed: 87,
        shape: 3,
        sizeVariation: 1.09,
        solidColor: "#F6E7C8",
        surfaceOffset: 0,
      },
      studio: {
        cool: {
          color: "#B7D2F2",
          power: 0,
          size: 4.70047,
        },
        environmentBackdrop: false,
        environmentBlur: 0.35,
        environmentRotation: 330,
        environmentStrength: 0.45,
        key: {
          color: "#FFFFFF",
          power: 1680,
          size: 4.131158,
        },
        shadowSoftness: 2,
        shadowStrength: 0.8,
        shadowsEnabled: true,
        warm: {
          color: "#FFDCAE",
          power: 230,
          size: 0.25,
        },
      },
    });
  });

  it("converts Blender linear colors into CSS sRGB", () => {
    expect(linearRgbToHex([0.86699069, 0.62104517, 0])).toBe("#EFCF00");
    expect(linearRgbToHex([0.02099699, 0.87032992, 0.41709954])).toBe(
      "#28F0AD",
    );
  });

  it("reads and clamps every reachable render setting", () => {
    const settings = readDonutSettings({
      "appearance.background": { hex: "#102030" },
      "canvas.renderScale": 8,
      "donut.height": 9,
      "donut.majorRadius": -9,
      "donut.organic": 8,
      "donut.thickness": 9,
      "export.image.format": "gif",
      "export.image.resolution": "12k",
      "export.includeBackground": false,
      "icing.clearMode": "detail",
      "icing.color": { hex: "#123abc" },
      "icing.coverage": 9,
      "icing.detail": -2,
      "icing.dripAmount": 9,
      "icing.dripFrequency": 0,
      "icing.enabled": false,
      "icing.flow": 9,
      "icing.thickness": 9,
      "material.donut.color": { hex: "#aabbcc" },
      "material.donut.bake": 9,
      "material.donut.moisture": -1,
      "material.donut.pores": 9,
      "material.donut.roughness": 9,
      "material.donut.variation": -1,
      "material.icing.glaze": 9,
      "material.icing.texture": -1,
      "material.plate.coat": -1,
      "scene.plateVisible": false,
      "sprinkles.clear": true,
      "sprinkles.coverage": -1,
      "sprinkles.flow": 99,
      "sprinkles.metallic": -4,
      "sprinkles.palette": 99,
      "sprinkles.rotation": 9,
      "sprinkles.scale": 0.01,
      "sprinkles.seed": 123.7,
      "sprinkles.shape": "pellet",
      "sprinkles.sizeVariation": 9,
      "sprinkles.solidColor": { hex: "#abcdef" },
      "sprinkles.surfaceOffset": 9,
      "studio.cool.power": 9999,
      "studio.environmentRotation": 999,
      "studio.environmentStrength": -1,
    });

    expect(settings).toMatchObject({
      background: { color: "#102030", include: false },
      donut: {
        height: 1.35,
        majorRadius: 0.78,
        organic: 2,
        thickness: 1.35,
      },
      icing: {
        clearMode: "detail",
        color: "#123ABC",
        coverage: 1.25,
        detail: 0,
        dripAmount: 2,
        dripFrequency: 0.5,
        enabled: false,
        flow: 2,
        thickness: 1.45,
      },
      image: { format: "png", resolution: "4k" },
      materials: {
        donut: {
          bake: 1,
          color: "#AABBCC",
          moisture: 0,
          pores: 1,
          roughness: 1,
          variation: 0,
        },
        icing: { glaze: 1, texture: 0 },
        plate: { coat: 0 },
      },
      plateVisible: false,
      renderScale: 2,
      sprinkles: {
        clear: true,
        coverage: 0.25,
        flow: 2,
        metallic: 0,
        palette: 4,
        rotation: 2,
        scale: 0.2,
        seed: 124,
        shape: 1,
        sizeVariation: 2,
        solidColor: "#ABCDEF",
        surfaceOffset: 0.15,
      },
      studio: {
        cool: { power: 2000 },
        environmentRotation: 360,
        environmentStrength: 0,
      },
    });
  });

  it("falls back safely for malformed state", () => {
    expect(
      readDonutSettings({
        "icing.clearMode": "erase-everything",
        "sprinkles.flow": Number.NaN,
        "sprinkles.metallic": undefined,
        "sprinkles.palette": "solid",
        "sprinkles.scale": Infinity,
        "sprinkles.shape": "unknown",
      }),
    ).toEqual(DONUT_DEFAULTS);
  });

  it("retains and symmetrically clamps signed sprinkle surface offsets", () => {
    expect(
      readDonutSettings({ "sprinkles.surfaceOffset": -0.08 }).sprinkles
        .surfaceOffset,
    ).toBe(-0.08);
    expect(
      readDonutSettings({ "sprinkles.surfaceOffset": -9 }).sprinkles
        .surfaceOffset,
    ).toBe(-0.15);
    expect(
      readDonutSettings({ "sprinkles.surfaceOffset": 9 }).sprinkles
        .surfaceOffset,
    ).toBe(0.15);
  });
});
