// @vitest-environment jsdom
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import HeroV4Styles from "@/section/components/pages/home/hero-v4-styles";
import { defaultHeroSceneSettings, type HeroGalleryImage } from "@/section/components/pages/home/hero-scene-settings";

const { renderers } = vi.hoisted(() => ({ renderers: [] as Array<{ canvas: HTMLCanvasElement; image: TexImageSource; dispose: ReturnType<typeof vi.fn>; setImage: ReturnType<typeof vi.fn> }> }));
vi.mock("@/section/components/pages/home/hero-card-dispersion-webgl", () => ({
  createHeroCardDispersionRenderer: (canvas: HTMLCanvasElement, image: TexImageSource) => {
    const renderer = { canvas, image, dispose: vi.fn(), render: vi.fn(), setLayout: vi.fn(), setSize: vi.fn(), setUniforms: vi.fn(), setImage: vi.fn((next: TexImageSource) => { renderer.image = next; }) };
    renderers.push(renderer);
    return renderer;
  },
}));
vi.mock("@/section/components/pages/home/hero-gallery-media-store", () => ({
  getHeroGalleryMediaSnapshot: () => 0,
  getHeroGalleryMediaServerSnapshot: () => 0,
  subscribeHeroGalleryMedia: () => () => undefined,
  markHeroGalleryMediaRefsUsed: () => undefined,
  getHeroGalleryMediaEntry: (ref: string) => ({ status: "ready", width: 72, height: 96, objectUrl: `https://fixture.invalid/${ref}.png` }),
}));

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); renderers.length = 0; });

it("retains each Rows canvas while replacing, reordering and transforming its source", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("IntersectionObserver", class {
    constructor(private callback: IntersectionObserverCallback) {}
    observe(target: Element) { this.callback([{ target, isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
    disconnect() {}
  });
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  const imageComplete = vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
  vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(72);
  vi.spyOn(HTMLImageElement.prototype, "naturalHeight", "get").mockReturnValue(96);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ translate: vi.fn(), scale: vi.fn(), rotate: vi.fn(), drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let images: HeroGalleryImage[] = Array.from({ length: 24 }, (_, index) => ({
    id: `image-${index}`, ref: `image-${index}`, width: 72, height: 96,
    transform: { rotationDeg: 0, flipHorizontal: false, flipVertical: false },
  }));
  const render = async () => {
    const settings = { ...defaultHeroSceneSettings, gallery: { ...defaultHeroSceneSettings.gallery, type: "rows" as const, images } };
    await act(async () => root.render(<HeroV4Styles settings={settings} viewportWidth={1920} />));
  };
  const canvases = () => Array.from(host.querySelectorAll<HTMLCanvasElement>("[data-hero-dispersion-canvas]"));
  try {
    await render();
    const slots = canvases();
    expect(slots).toHaveLength(16);
    expect(renderers).toHaveLength(16);
    await render();
    expect(renderers, "equivalent source objects must not recompile physical slots").toHaveLength(16);
    for (const renderer of renderers) expect(renderer.setImage).not.toHaveBeenCalled();
    for (const operation of ["remove", "reorder", "rotate", "flip"] as const) {
      const previousRenderers = renderers.slice(-16);
      const beforeCount = renderers.length;
      if (operation === "remove") images = images.slice(1);
      if (operation === "reorder") images = [images[1], images[0], ...images.slice(2)];
      if (operation === "rotate") images = images.map(image => ({ ...image, transform: { ...image.transform, rotationDeg: 90 } }));
      if (operation === "flip") images = images.map(image => ({ ...image, transform: { ...image.transform, flipHorizontal: true } }));
      await render();
      const current = canvases();
      for (let index = 0; index < slots.length; index += 1) expect(current[index], `${operation}: physical slot ${index}`).toBe(slots[index]);
      for (const renderer of previousRenderers) expect(renderer.dispose).not.toHaveBeenCalled();
      expect(renderers.length - beforeCount).toBe(0);
      expect(host.querySelector('[data-hero-gallery="rows"]')?.getAttribute("data-hero-gallery-order")).toContain(images[0].id);
      for (const renderer of renderers.slice(-16)) {
        expect(slots).toContain(renderer.canvas);
        if (operation === "rotate" || operation === "flip") {
          expect(renderer.image).toBeInstanceOf(HTMLCanvasElement);
          expect(renderer.image).toMatchObject({ width: 96, height: 72 });
        } else {
          expect(renderer.image).toBeInstanceOf(HTMLImageElement);
          expect(images.some(image => (renderer.image as HTMLImageElement).src.endsWith(`/${image.ref}.png`))).toBe(true);
        }
      }
    }
    // Retaining a slot must not render its previous texture as the next image.
    // Exercise the real component's waiting-for-image/onLoad transition.
    const pendingStart = renderers.length;
    imageComplete.mockReturnValue(false);
    images = images.map(image => ({ ...image, ref: `${image.ref}-replacement`, transform: { rotationDeg: 0, flipHorizontal: false, flipVertical: false } }));
    await render();
    expect(renderers).toHaveLength(pendingStart);
    expect(host.querySelectorAll('[data-dispersion-ready="true"]')).toHaveLength(0);
    for (const canvas of slots) expect(canvas.style.opacity).toBe("0");
    for (let index = 0; index < slots.length; index += 1) expect(canvases()[index]).toBe(slots[index]);
    imageComplete.mockReturnValue(true);
    await act(async () => {
      host.querySelectorAll("[data-hero-card-index] img").forEach(image => image.dispatchEvent(new Event("load")));
    });
    expect(renderers).toHaveLength(pendingStart);
    expect(host.querySelectorAll('[data-dispersion-ready="true"]')).toHaveLength(16);
    for (const canvas of slots) expect(canvas.style.opacity).toBe("1");
    for (const renderer of renderers.slice(-16)) expect((renderer.image as HTMLImageElement).src).toContain("-replacement.png");
    const first = renderers[0];
    await act(async () => first.canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true })));
    expect(host.querySelectorAll('[data-dispersion-ready="true"]')).toHaveLength(15);
    const imageUploadsBeforeLoss = first.setImage.mock.calls.length;
    images = images.map(image => ({ ...image, transform: { ...image.transform, flipVertical: true } }));
    await render();
    expect(first.setImage).toHaveBeenCalledTimes(imageUploadsBeforeLoss);
    expect(first.canvas.style.opacity).toBe("0");
    expect(host.querySelectorAll('[data-dispersion-ready="true"]')).toHaveLength(15);
    await act(async () => first.canvas.dispatchEvent(new Event("webglcontextrestored")));
    expect(first.dispose).toHaveBeenCalledOnce();
    expect(renderers).toHaveLength(pendingStart + 1);
    expect(host.querySelectorAll('[data-dispersion-ready="true"]')).toHaveLength(16);
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
  for (const renderer of renderers) expect(renderer.dispose).toHaveBeenCalledOnce();
});
