import { afterEach, describe, expect, it, vi } from "vitest";

import { DISPERSION_CAROUSEL_DEFAULTS as defaults } from "./dispersion-carousel-values";
import { createDispersionRailRenderer } from "./dispersion-carousel-webgl";

function createRendererFixture() {
  const calls = new Map<string, ReturnType<typeof vi.fn>>();
  const gl = new Proxy({}, {
    get(_target, key: string) {
      if (key === key.toUpperCase()) return key;
      if (!calls.has(key)) {
        calls.set(key, vi.fn((...args: unknown[]) => {
          if (key === "getShaderParameter" || key === "getProgramParameter") return true;
          if (key === "getUniformLocation") return args[1];
          if (key.startsWith("create")) return {};
          return undefined;
        }));
      }
      return calls.get(key);
    },
  }) as WebGLRenderingContext;
  const canvas = Object.assign(new EventTarget(), {
    width: 300,
    height: 150,
    getContext: () => gl,
  }) as unknown as HTMLCanvasElement;
  const settings = {
    ...defaults,
    samples: defaults.count,
    fade: defaults.edgeFade,
    edgeWidth: defaults.edgeWidth / 100,
    gateOffset: defaults.gateOffset / 100,
    warpOffset: defaults.warpOffset / 100,
  };
  const renderer = createDispersionRailRenderer(canvas, {
    image: {} as TexImageSource,
    text: {} as TexImageSource,
    textRowRange: [0.6, 0.98],
  }, { padY: 64, stripHeight: 560, stripWidth: 2320 });
  renderer.setUniforms(settings);
  renderer.setSize(1920, 688, 2);
  renderer.render(1856, 24);
  const clearCalls = () => calls.forEach((call) => call.mockClear());
  clearCalls();
  return { renderer, canvas, calls, clearCalls, settings };
}

afterEach(() => vi.unstubAllGlobals());

describe("retained dispersion frames", () => {
  it("reuses identical frames and uploads only moving uniforms during scroll", () => {
    const { renderer, calls, settings } = createRendererFixture();
    renderer.render(1856, 24);
    renderer.setSize(1920, 688, 2);
    renderer.setUniforms({ ...settings });
    expect(calls.get("drawArrays")).not.toHaveBeenCalled();
    renderer.render(1860, 24);
    expect(calls.get("drawArrays")).toHaveBeenCalledTimes(1);
    expect(calls.get("uniform1f")?.mock.calls).toEqual([
      ["uScroll", 1860], ["uVelocity", 24],
    ]);
    expect(calls.get("texImage2D")).not.toHaveBeenCalled();
    renderer.dispose();
  });

  it("invalidates retained pixels on settings, backing size, and context restoration", () => {
    const { renderer, canvas, calls, clearCalls, settings } = createRendererFixture();
    renderer.setUniforms({ ...settings, amount: 123 });
    expect(calls.get("uniform1f")).toHaveBeenCalledWith("uAmount", 123);
    expect(calls.get("drawArrays")).toHaveBeenCalledTimes(1);
    clearCalls();
    renderer.setSize(1920, 688, 4);
    expect([canvas.width, canvas.height]).toEqual([7680, 2752]);
    expect(calls.get("drawArrays")).toHaveBeenCalledTimes(1);
    expect(calls.get("texImage2D")).not.toHaveBeenCalled();
    clearCalls();
    canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
    renderer.render(1870, 30);
    expect(calls.get("drawArrays")).not.toHaveBeenCalled();
    canvas.dispatchEvent(new Event("webglcontextrestored"));
    expect(calls.get("drawArrays")).toHaveBeenCalledTimes(1);
    expect(calls.get("uniform1f")).toHaveBeenCalledWith("uAmount", 123);
    expect(calls.get("uniform2f")).toHaveBeenCalledWith("uTextRowRange", 0.6, 0.98);
    renderer.dispose();
  });

  it("restores the selected backing and moving preview after a still snapshot", async () => {
    const { renderer, canvas, calls } = createRendererFixture();
    const bitmap = { close: vi.fn() } as unknown as ImageBitmap;
    vi.stubGlobal("createImageBitmap", vi.fn(async () => {
      expect([canvas.width, canvas.height]).toEqual([7680, 2752]);
      return bitmap;
    }));
    expect(await renderer.snapshot(1900, 4)).toBe(bitmap);
    expect([canvas.width, canvas.height]).toEqual([3840, 1376]);
    expect(calls.get("uniform1f")?.mock.calls).toEqual([
      ["uScroll", 1900], ["uVelocity", 0],
      ["uScroll", 1856], ["uVelocity", 24],
    ]);
    expect(calls.get("drawArrays")).toHaveBeenCalledTimes(2);
    renderer.dispose();
    calls.get("drawArrays")?.mockClear();
    renderer.render(2000, 30);
    expect(calls.get("drawArrays")).not.toHaveBeenCalled();
  });
});
