import { transform } from "esbuild";
import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import type { ToolcraftState } from "@/toolcraft/runtime";

import {
  createSpiralGalleryCodeArchive,
  createSpiralGalleryCodeConfig,
} from "./spiral-gallery-code-export";

const fixtureSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="3"><rect width="4" height="3" fill="red"/></svg>';
const fixtureDataUrl = `data:image/svg+xml,${encodeURIComponent(fixtureSvg)}`;

function makeState(): ToolcraftState {
  return {
    canvas: {
      size: { height: 1080, width: 1920 },
    },
    mediaAssets: [
      {
        assetKind: "image",
        dataUrl: fixtureDataUrl,
        fileName: "Red Fixture.svg",
        id: "fixture-red",
        layerId: "fixture-red",
        mimeType: "image/svg+xml",
        position: { x: 0, y: 0 },
        sourceTarget: "source.images",
        transform: {
          flipHorizontal: true,
          flipVertical: false,
          rotationDeg: 90,
        },
      },
    ],
    values: {
      "appearance.background": "#304FFE",
      "canvas.renderScale": 2,
      "export.includeBackground": true,
      "layout.mode": "stack",
      "shadow.blur": 0.45,
      "shadow.color": { hex: "#FF6600", opacity: 65 },
      "shadow.offset": { x: "0.40", y: "-0.20" },
    },
  } as unknown as ToolcraftState;
}

describe("Image Gallery code export", () => {
  it("serializes current settings, layout, image order, and transforms", () => {
    const config = createSpiralGalleryCodeConfig(makeState());
    expect(config.canvas).toMatchObject({ height: 1080, renderScale: 2, width: 1920 });
    expect(config.values).toMatchObject({
      "appearance.background": "#304FFE",
      "export.includeBackground": true,
      "layout.mode": "stack",
      "shadow.blur": 0.45,
      "shadow.color": { hex: "#ff6600", opacity: 65 },
      "shadow.offset": { x: "0.40", y: "-0.20" },
    });
    expect(config.images).toEqual([
      expect.objectContaining({
        fileName: "Red Fixture.svg",
        src: "/image-gallery-assets/01-red-fixture.svg",
        transform: {
          flipHorizontal: true,
          flipVertical: false,
          rotationDeg: 90,
        },
      }),
    ]);
  });

  it("packages a syntax-valid portable React section and the physical renderer", async () => {
    const progress: number[] = [];
    const archive = await createSpiralGalleryCodeArchive(makeState(), {
      fetchAsset: async (url) => fetch(url),
      reportProgress: (value) => progress.push(value),
    });
    const files = unzipSync(archive);
    expect(Object.keys(files)).toEqual(
      expect.arrayContaining([
        "AGENT-INTEGRATION.md",
        "README.md",
        "gallery.config.json",
        "manifest.json",
        "public/image-gallery-assets/01-red-fixture.svg",
        "src/ImageGallerySection.tsx",
        "src/gallery.config.ts",
        "src/host-adapter.ts",
        "src/image-gallery-deck.ts",
        "src/image-gallery-engine.ts",
        "src/image-gallery-section.css",
        "src/image-gallery-settings-adapter.ts",
        "src/image-gallery-types.ts",
        "src/image-gallery-webgl.ts",
      ]),
    );

    for (const [path, bytes] of Object.entries(files)) {
      if (!path.endsWith(".ts") && !path.endsWith(".tsx")) continue;
      await expect(
        transform(strFromU8(bytes), {
          jsx: "automatic",
          loader: path.endsWith(".tsx") ? "tsx" : "ts",
        }),
      ).resolves.toMatchObject({ warnings: [] });
    }

    const guide = strFromU8(files["AGENT-INTEGRATION.md"]!);
    const component = strFromU8(files["src/ImageGallerySection.tsx"]!);
    const engine = strFromU8(files["src/image-gallery-engine.ts"]!);
    const webgl = strFromU8(files["src/image-gallery-webgl.ts"]!);
    expect(guide).toContain("Preserve both vertex-shader bends");
    expect(component).toContain("createImageGalleryResource");
    expect(engine).toContain('from "./host-adapter"');
    expect(engine).not.toContain("@/toolcraft/runtime");
    expect(webgl).toContain("float curveAngle = p.x / safeCurveRadius");
    expect(webgl).toContain("p.z -= arcDepth * sign(uEdgePull)");
    expect(progress.at(-1)).toBe(0.96);
    expect(archive.byteLength).toBeGreaterThan(1_000);
  });
});
