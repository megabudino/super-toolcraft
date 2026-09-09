// @vitest-environment jsdom

import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  HERO_SPHERE_ROW_DEFAULT,
  heroGalleryTargets,
  type HeroGalleryImage,
} from "./hero-gallery-values";
import { useHeroGalleryRowActivation } from "./hero-gallery-row-activation";

const { dispatch } = vi.hoisted(() => ({ dispatch: vi.fn() }));
const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
};

vi.mock("@/toolcraft/runtime/react", () => ({
  useToolcraftDispatch: () => dispatch,
}));

const emptyRowImages = Array.from(
  { length: 6 },
  () => [],
) as readonly (readonly HeroGalleryImage[])[];
const image = {
  height: 100,
  id: "row-five-image",
  ref: "media://row-five-image",
  transform: {
    flipHorizontal: false,
    flipVertical: false,
    rotationDeg: 0,
  },
  width: 100,
} satisfies HeroGalleryImage;

function rows(length: number) {
  return Array.from({ length }, (_, index) => ({
    images: [],
    offset: index * 10,
    speed: index + 1,
  }));
}

function HookProbe({
  rowImages,
  rowsValue,
}: {
  rowImages: readonly (readonly HeroGalleryImage[])[];
  rowsValue: unknown;
}) {
  useHeroGalleryRowActivation({ rowImages, rowsValue });
  return null;
}

describe("useHeroGalleryRowActivation", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    dispatch.mockReset();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("activates Row 5 once and does not reactivate it after Remove Row", () => {
    const initialRows = rows(3);

    act(() => {
      root.render(
        <HookProbe rowImages={emptyRowImages} rowsValue={initialRows} />,
      );
    });
    expect(dispatch).not.toHaveBeenCalled();

    const rowFiveImages = emptyRowImages.map((images, index) =>
      index === 4 ? [image] : images,
    );

    act(() => {
      root.render(
        <HookProbe rowImages={rowFiveImages} rowsValue={initialRows} />,
      );
    });

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({
      label: "Activate Row 5",
      target: heroGalleryTargets.sphereRows,
      type: "controls.setValue",
      value: [...initialRows, HERO_SPHERE_ROW_DEFAULT, HERO_SPHERE_ROW_DEFAULT],
    });

    const activatedRows = dispatch.mock.calls[0]?.[0]?.value;
    dispatch.mockClear();

    act(() => {
      root.render(
        <HookProbe rowImages={rowFiveImages} rowsValue={activatedRows} />,
      );
    });
    expect(dispatch).not.toHaveBeenCalled();

    act(() => {
      root.render(<HookProbe rowImages={rowFiveImages} rowsValue={rows(4)} />);
    });
    expect(dispatch).not.toHaveBeenCalled();
  });
});
