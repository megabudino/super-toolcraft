import { describe, expect, it } from "vitest";

import { appSchema } from "./app-schema";
import {
  createHeroGalleryImagesFromMediaAssets,
  createHeroGallerySettingsFromValues,
  createHeroSphereRowImagesFromMediaAssets,
  HERO_SPHERE_ROWS_DEFAULT,
  heroGalleryTargets,
} from "./hero-gallery-values";
import type { ToolcraftMediaAsset, ToolcraftImageAsset } from "@/toolcraft/runtime";
import {
  isHeroPreviewReadyMessage,
  isHeroPreviewStateMessage,
} from "./hero-preview-protocol";

const galleryStatePayload = {
  galleryType: "sphere",
  imageOrder: ["one"],
  imageSignature: "one",
  pan: { turns: 2, x: -0.75, y: 0.5 },
  readyImageIds: ["one"],
  renderer: "webgl",
  rowSignature: "0:3",
  rows: 1,
} as const;

function imageAsset(
  id: string,
  sourceTarget: string,
): ToolcraftImageAsset {
  return {
    assetKind: "image",
    fileName: `${id}.png`,
    id,
    layerId: `layer-${id}`,
    lifecycle: "ready",
    mimeType: "image/png",
    position: { x: 0, y: 0 },
    resourceRef: `media://${id}`,
    sourceTarget,
  };
}

describe("hero gallery values", () => {
  it("uses the approved six signed row speeds as canonical defaults", () => {
    expect(HERO_SPHERE_ROWS_DEFAULT).toEqual([
      { images: [], offset: -101, speed: -4 },
      { images: [], offset: -9, speed: 4 },
      { images: [], offset: -8, speed: -4 },
      { images: [], offset: 0, speed: 4 },
      { images: [], offset: 0, speed: -4 },
      { images: [], offset: 0, speed: 4 },
    ]);
    expect(createHeroGallerySettingsFromValues({}).sphere.rows).toEqual(
      HERO_SPHERE_ROWS_DEFAULT,
    );
    expect(
      appSchema.panels.controls?.sections
        .flatMap((section) => Object.values(section.controls))
        .find((control) => control.target === heroGalleryTargets.sphereRows)
        ?.defaultValue,
    ).toEqual(HERO_SPHERE_ROWS_DEFAULT);
  });

  it("defaults and normalizes Sphere auto scroll settings", () => {
    const defaults = createHeroGallerySettingsFromValues({});
    const normalized = createHeroGallerySettingsFromValues({
      [heroGalleryTargets.autoScrollDuration]: 0,
      [heroGalleryTargets.autoScrollEnabled]: "yes",
      [heroGalleryTargets.autoScrollInterval]: 90,
    });
    const invalidNumbers = createHeroGallerySettingsFromValues({
      [heroGalleryTargets.autoScrollDuration]: Number.NaN,
      [heroGalleryTargets.autoScrollInterval]: Number.NaN,
    });

    expect(defaults.sphere.autoScroll).toEqual({
      duration: 0.3,
      enabled: true,
      interval: 4,
    });
    expect(normalized.sphere.autoScroll).toEqual({
      duration: 0.15,
      enabled: true,
      interval: 60,
    });
    expect(invalidNumbers.sphere.autoScroll).toEqual(
      defaults.sphere.autoScroll,
    );
  });

  it("moves persisted gallery placement to the centered position target", () => {
    expect(heroGalleryTargets.position).toBe("gallery.position.v2");
    expect(createHeroGallerySettingsFromValues({}).position).toEqual({
      x: 0,
      y: 0.02,
    });
    expect(
      createHeroGallerySettingsFromValues({
        "gallery.position": { x: -0.1, y: 0.02 },
      }).position,
    ).toEqual({ x: 0, y: 0.02 });
    expect(
      createHeroGallerySettingsFromValues({
        [heroGalleryTargets.position]: { x: 0.25, y: -0.4 },
      }).position,
    ).toEqual({ x: 0.25, y: -0.4 });
  });

  it("normalizes shared card height, lens depth, pan and row-only motion", () => {
    const settings = createHeroGallerySettingsFromValues({
      [heroGalleryTargets.cardHeight]: 420,
      [heroGalleryTargets.cardRadius]: 48,
      [heroGalleryTargets.pan]: { x: 0.25, y: -0.5 },
      [heroGalleryTargets.sphereDepth]: 1400,
      [heroGalleryTargets.sphereRows]: [
        { height: 800, offset: 30, speed: -6 },
      ],
    });

    expect(settings.cardHeight).toBe(420);
    expect(settings.cardRadius).toBe(48);
    expect(settings.sphere.depth).toBe(1400);
    expect(settings.sphere.pan).toEqual({ x: 0.25, y: -0.5 });
    expect(settings.sphere.rows).toEqual([
      { images: [], offset: 30, speed: -6 },
    ]);
  });

  it("maps signed bend percentages, clamps them and keeps website defaults", () => {
    const defaults = createHeroGallerySettingsFromValues({});
    const signed = createHeroGallerySettingsFromValues({
      [heroGalleryTargets.sphereBendX]: -140,
      [heroGalleryTargets.sphereBendY]: 125,
    });

    expect(defaults.sphere.bendX).toBe(0.5);
    expect(defaults.sphere.bendY).toBe(0.99);
    expect(signed.sphere.bendX).toBe(-1);
    expect(signed.sphere.bendY).toBe(1);
  });

  it("assigns each sphere row only the images from its matching row target", () => {
    const rowTargets = [
      heroGalleryTargets.rowImages0,
      heroGalleryTargets.rowImages1,
      heroGalleryTargets.rowImages2,
      heroGalleryTargets.rowImages3,
      heroGalleryTargets.rowImages4,
      heroGalleryTargets.rowImages5,
    ];
    const rowImages = rowTargets.map((target, index) =>
      createHeroGalleryImagesFromMediaAssets(
        [imageAsset(`row-${index + 1}`, target)],
        target,
      ),
    );
    const settings = createHeroGallerySettingsFromValues(
      {
        [heroGalleryTargets.sphereRows]: Array.from(
          { length: 6 },
          () => ({ offset: 0, speed: 3 }),
        ),
      },
      [],
      rowImages,
    );

    expect(settings.sphere.rows.map((row) => row.images.map((image) => image.id))).toEqual([
      ["row-1"],
      ["row-2"],
      ["row-3"],
      ["row-4"],
      ["row-5"],
      ["row-6"],
    ]);
  });

  it("uses legacy gallery images round-robin only while every row target is empty", () => {
    const legacyImages = createHeroGalleryImagesFromMediaAssets([
      imageAsset("legacy-1", heroGalleryTargets.images),
      imageAsset("legacy-2", heroGalleryTargets.images),
      imageAsset("legacy-3", heroGalleryTargets.images),
      imageAsset("legacy-4", heroGalleryTargets.images),
      imageAsset("legacy-5", heroGalleryTargets.images),
    ]);
    const values = {
      [heroGalleryTargets.sphereRows]: [
        { offset: 0, speed: 3 },
        { offset: 30, speed: 6 },
        { offset: -30, speed: -6 },
      ],
    };

    expect(
      createHeroGallerySettingsFromValues(values, legacyImages).sphere.rows.map(
        (row) => row.images.map((image) => image.id),
      ),
    ).toEqual([["legacy-1", "legacy-4"], ["legacy-2", "legacy-5"], ["legacy-3"]]);
    expect(
      createHeroGallerySettingsFromValues(values, legacyImages, [
        [legacyImages[0]!],
        [],
        [],
        [],
        [],
        [],
      ]).sphere.rows.map((row) => row.images.map((image) => image.id)),
    ).toEqual([["legacy-1"], [], []]);
  });

  it("maps raw row media into matching settings rows and disables legacy images", () => {
    const assets: readonly ToolcraftMediaAsset[] = [
      imageAsset("legacy", heroGalleryTargets.images),
      imageAsset("row-1-first", heroGalleryTargets.rowImages0),
      {
        ...imageAsset("row-1-unavailable", heroGalleryTargets.rowImages0),
        error: { code: "missing-resource", message: "Unavailable test asset" },
        lifecycle: "unavailable",
      },
      imageAsset("row-3", heroGalleryTargets.rowImages2),
      {
        ...imageAsset("row-3-file", heroGalleryTargets.rowImages2),
        assetKind: "file",
      },
      imageAsset("row-1-last", heroGalleryTargets.rowImages0),
      imageAsset("row-6", heroGalleryTargets.rowImages5),
      imageAsset("other", "media.other"),
    ];
    const rowImages = createHeroSphereRowImagesFromMediaAssets(assets);
    const settings = createHeroGallerySettingsFromValues(
      {
        [heroGalleryTargets.sphereRows]: Array.from(
          { length: 6 },
          () => ({ offset: 0, speed: 3 }),
        ),
      },
      createHeroGalleryImagesFromMediaAssets(assets),
      rowImages,
    );

    expect(rowImages.map((images) => images.map((image) => image.id))).toEqual([
      ["row-1-first", "row-1-last"],
      [],
      ["row-3"],
      [],
      [],
      ["row-6"],
    ]);
    expect(settings.sphere.rows.map((row) => row.images.map((image) => image.id))).toEqual([
      ["row-1-first", "row-1-last"],
      [],
      ["row-3"],
      [],
      [],
      ["row-6"],
    ]);
  });

  it("filters unavailable and non-image media while preserving media order", () => {
    const assets: readonly ToolcraftMediaAsset[] = [
      imageAsset("first", heroGalleryTargets.rowImages2),
      {
        ...imageAsset("unavailable", heroGalleryTargets.rowImages2),
        error: { code: "missing-resource", message: "Unavailable test asset" },
        lifecycle: "unavailable",
      },
      {
        ...imageAsset("file", heroGalleryTargets.rowImages2),
        assetKind: "file",
      },
      imageAsset("last", heroGalleryTargets.rowImages2),
      imageAsset("other-row", heroGalleryTargets.rowImages3),
    ];

    expect(
      createHeroGalleryImagesFromMediaAssets(
        assets,
        heroGalleryTargets.rowImages2,
      ).map((image) => image.id),
    ).toEqual(["first", "last"]);
  });

  it("accepts protocol v23 gallery state with persisted turns", () => {
    expect(
      isHeroPreviewStateMessage({
        channel: "recraft.hero-scene",
        payload: galleryStatePayload,
        type: "state",
        version: 23,
      }),
    ).toBe(true);
  });

  it("rejects protocol v22 messages across the v23 validators", () => {
    expect(
      isHeroPreviewReadyMessage({
        channel: "recraft.hero-scene",
        type: "ready",
        version: 22,
      }),
    ).toBe(false);
    expect(
      isHeroPreviewStateMessage({
        channel: "recraft.hero-scene",
        payload: galleryStatePayload,
        type: "state",
        version: 22,
      }),
    ).toBe(false);
  });
});
