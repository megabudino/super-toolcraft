// @vitest-environment jsdom

import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ToolcraftImageAsset } from "@/toolcraft/runtime";

import { heroGalleryTargets } from "./hero-gallery-values";
import { HeroNativePreview } from "./hero-native-preview";

const { rowFiveAsset, runtimeState } = vi.hoisted(() => {
  const rowFiveAsset: ToolcraftImageAsset = {
    assetKind: "image",
    fileName: "row-five.png",
    id: "media-1",
    layerId: "layer-media-1",
    lifecycle: "ready",
    mimeType: "image/png",
    position: { x: 0, y: 0 },
    resourceRef: "media://row-five",
    sourceTarget: "sphere.rowImages.4",
  };
  return {
    rowFiveAsset,
    runtimeState: {
      canvas: { mode: "finite", offset: { x: 0, y: 0 }, zoom: 100 },
      mediaAssets: [rowFiveAsset] as ToolcraftImageAsset[],
      values: {} as Record<string, unknown>,
    },
  };
});

vi.mock("@/toolcraft/runtime/react", () => ({
  useToolcraftDispatch: () => vi.fn(),
  useToolcraftProductSceneFrame: () => ({
    mode: "finite", rect: { width: 1920, height: 1080 },
  }),
  useToolcraftMediaPresentationUrls: (assets: readonly ToolcraftImageAsset[]) =>
    new Map(assets.map((asset) => [asset.id, `blob:${asset.id}`])),
  useToolcraftSelector: (selector: (state: typeof runtimeState) => unknown) =>
    selector(runtimeState),
}));

vi.mock("@/section/components/pages/home/hero-gallery-media-store", () => ({
  ingestHeroGalleryMedia: vi.fn(),
  releaseHeroGalleryMedia: vi.fn(),
}));
vi.mock("@/section/reference/reference-surface", () => ({
  ReferenceSurface: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock("@/section/components/pages/home/hero-v4-styles", () => ({ default: () => null }));
vi.mock("@/section/components/header", () => ({ default: () => null }));

vi.mock("./hero-gallery-row-activation", () => ({
  useHeroGalleryRowActivation: () => undefined,
}));

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
};

function sphereRows(length: number) {
  return Array.from({ length }, () => ({ images: [], offset: 0, speed: 3 }));
}

describe("Hero preview active media sync", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    runtimeState.mediaAssets = [rowFiveAsset];
    runtimeState.values = {
      [heroGalleryTargets.sphereRows]: sphereRows(5),
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        blob: () => Promise.resolve(new Blob(["image"], { type: "image/png" })),
        ok: true,
      }),
    );
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = false;
    vi.unstubAllGlobals();
  });

  it("syncs retained row media when its row becomes active again", async () => {
    runtimeState.values = {
      [heroGalleryTargets.sphereRows]: sphereRows(4),
    };

    await act(async () => {
      root.render(<HeroNativePreview />);
      await Promise.resolve();
    });
    expect(fetch).not.toHaveBeenCalled();

    runtimeState.values = {
      [heroGalleryTargets.sphereRows]: sphereRows(5),
    };
    await act(async () => {
      root.render(<HeroNativePreview />);
      await Promise.resolve();
    });
    expect(fetch).toHaveBeenCalledTimes(1);

    runtimeState.values = {
      [heroGalleryTargets.sphereRows]: sphereRows(4),
    };
    await act(async () => {
      root.render(<HeroNativePreview />);
      await Promise.resolve();
    });

    runtimeState.values = {
      [heroGalleryTargets.sphereRows]: sphereRows(5),
    };
    await act(async () => {
      root.render(<HeroNativePreview />);
      await Promise.resolve();
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("syncs only media active in the current gallery mode", async () => {
    const legacyAsset: ToolcraftImageAsset = {
      ...rowFiveAsset,
      fileName: "legacy.png",
      id: "legacy-1",
      layerId: "layer-legacy-1",
      resourceRef: "media://legacy",
      sourceTarget: heroGalleryTargets.images,
    };
    runtimeState.mediaAssets = [rowFiveAsset, legacyAsset];
    runtimeState.values = {
      [heroGalleryTargets.sphereRows]: sphereRows(5),
      [heroGalleryTargets.type]: "sphere",
    };

    await act(async () => {
      root.render(<HeroNativePreview />);
      await Promise.resolve();
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "blob:media-1",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    runtimeState.values = {
      [heroGalleryTargets.sphereRows]: sphereRows(5),
      [heroGalleryTargets.type]: "rows",
    };
    await act(async () => {
      root.render(<HeroNativePreview />);
      await Promise.resolve();
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "blob:legacy-1",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    runtimeState.values = {
      [heroGalleryTargets.sphereRows]: sphereRows(5),
      [heroGalleryTargets.type]: "sphere",
    };
    await act(async () => {
      root.render(<HeroNativePreview />);
      await Promise.resolve();
    });
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      "blob:media-1",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});
