// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { createHeroCardDispersionRenderer } from "@/section/components/pages/home/hero-card-dispersion-webgl";
import { defaultHeroSceneSettings } from "@/section/components/pages/home/hero-scene-settings";

vi.mock("@/section/components/pages/home/hero-dispersion-shader", () => ({
  compileHeroShader: () => ({}),
  createHeroRollerMesh: () => new Float32Array([0, 0, 1, 0, 1, 1]),
  clampHeroBacking: (width: number, height: number, ratio: number) => ({ width: width * ratio, height: height * ratio }),
  HERO_DISPERSION_GLSL_COMMON: "",
}));

afterEach(() => vi.restoreAllMocks());

it("updates source pixels and dimensions without reallocating the Rows GPU pipeline", () => {
  const gl = {
    createProgram: vi.fn(() => ({})), createBuffer: vi.fn(() => ({})), createTexture: vi.fn(() => ({})),
    getProgramParameter: () => true, getUniformLocation: (_: unknown, name: string) => name, getAttribLocation: () => 0,
    attachShader: vi.fn(), linkProgram: vi.fn(), deleteShader: vi.fn(), useProgram: vi.fn(), bindBuffer: vi.fn(),
    bufferData: vi.fn(), enableVertexAttribArray: vi.fn(), vertexAttribPointer: vi.fn(), activeTexture: vi.fn(),
    bindTexture: vi.fn(), pixelStorei: vi.fn(), texImage2D: vi.fn(), texParameteri: vi.fn(), uniform1i: vi.fn(),
    uniform1f: vi.fn(), uniform2f: vi.fn(), disable: vi.fn(), clearColor: vi.fn(), clear: vi.fn(), drawArrays: vi.fn(),
    deleteTexture: vi.fn(), deleteBuffer: vi.fn(), deleteProgram: vi.fn(), viewport: vi.fn(),
  };
  const canvas = document.createElement("canvas");
  vi.spyOn(canvas, "getContext").mockReturnValue(gl as unknown as WebGLRenderingContext);
  const source = document.createElement("canvas");
  source.width = 72; source.height = 96;
  const renderer = createHeroCardDispersionRenderer(canvas, source, "left");
  const replacement = document.createElement("canvas");
  replacement.width = 128; replacement.height = 96;
  try {
    renderer.setUniforms(defaultHeroSceneSettings.dispersion);
    renderer.setImage(replacement);
    renderer.render(0);
    expect(gl.texImage2D).toHaveBeenCalledTimes(2);
    expect(gl.texImage2D.mock.calls.at(-1)?.at(-1)).toBe(replacement);
    expect(gl.uniform2f).toHaveBeenCalledWith("uTextureSize", 128, 96);
    expect(gl.createProgram).toHaveBeenCalledOnce();
    expect(gl.createBuffer).toHaveBeenCalledOnce();
    expect(gl.createTexture).toHaveBeenCalledOnce();
    expect(gl.deleteTexture).not.toHaveBeenCalled();
  } finally {
    renderer.dispose();
  }
  renderer.setImage(source);
  expect(gl.texImage2D).toHaveBeenCalledTimes(2);
  expect(gl.deleteTexture).toHaveBeenCalledOnce();
  expect(gl.deleteBuffer).toHaveBeenCalledOnce();
  expect(gl.deleteProgram).toHaveBeenCalledOnce();
});
