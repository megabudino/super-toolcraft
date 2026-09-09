import { describe, expect, it } from "vitest";

import {
  createDonutShadowInvalidationKey,
  resolveDonutAntialias,
  resolveDonutPreserveDrawingBuffer,
  resolveDonutPreviewPixelRatio,
  shouldResizeDonutRenderer,
} from "./donut-scene";
import { readDonutSettings } from "./donut-values";

describe("donut scene render policy", () => {
  it("keeps a cached shadow map for material-only edits", () => {
    const settings = readDonutSettings({});
    const materialEdit = {
      ...settings,
      materials: {
        ...settings.materials,
        donut: {
          ...settings.materials.donut,
          roughness: 0.18,
        },
        icing: {
          ...settings.materials.icing,
          glaze: 0.92,
        },
      },
      studio: {
        ...settings.studio,
        environmentRotation: 127,
        shadowSoftness: 6,
      },
    };

    expect(createDonutShadowInvalidationKey(materialEdit)).toBe(
      createDonutShadowInvalidationKey(settings),
    );
  });

  it("invalidates cached shadows for every scene-shape owner", () => {
    const settings = readDonutSettings({});
    const initialKey = createDonutShadowInvalidationKey(settings);
    const changes = [
      {
        ...settings,
        donut: { ...settings.donut, thickness: 1.2 },
      },
      {
        ...settings,
        icing: { ...settings.icing, flow: 1.7 },
      },
      {
        ...settings,
        sprinkles: { ...settings.sprinkles, scale: 1.2 },
      },
      {
        ...settings,
        plateVisible: !settings.plateVisible,
      },
      {
        ...settings,
        studio: {
          ...settings.studio,
          shadowsEnabled: !settings.studio.shadowsEnabled,
        },
      },
    ];

    for (const changed of changes) {
      expect(createDonutShadowInvalidationKey(changed)).not.toBe(initialKey);
    }
  });

  it("preserves the static preview buffer unless a caller opts out", () => {
    expect(resolveDonutPreserveDrawingBuffer(undefined)).toBe(true);
    expect(resolveDonutPreserveDrawingBuffer(false)).toBe(false);
    expect(resolveDonutPreserveDrawingBuffer(true)).toBe(true);
  });

  it("avoids redundant MSAA only for supersampled live preview", () => {
    expect(resolveDonutAntialias(1)).toBe(true);
    expect(resolveDonutAntialias(2)).toBe(false);
  });

  it("includes runtime canvas zoom in the visible preview backing ratio", () => {
    expect(resolveDonutPreviewPixelRatio(2, 2, 170)).toBeCloseTo(6.8);
    expect(resolveDonutPreviewPixelRatio(2, 1, 100)).toBe(2);
  });

  it("resizes WebGL backing only when its effective configuration changes", () => {
    const current = { height: 1080, pixelRatio: 2, width: 1920 };

    expect(shouldResizeDonutRenderer(current, current)).toBe(false);
    expect(
      shouldResizeDonutRenderer(current, { ...current, width: 1280 }),
    ).toBe(true);
    expect(
      shouldResizeDonutRenderer(current, { ...current, pixelRatio: 1.5 }),
    ).toBe(true);
  });
});
