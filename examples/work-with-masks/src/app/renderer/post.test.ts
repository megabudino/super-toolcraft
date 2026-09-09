import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

import { createToolcraftState } from "@/toolcraft/runtime";

import { appSchema } from "../app-schema";
import { readHeroParams } from "../domain/hero-params";
import { createHazePass } from "./haze";
import { applyMaskParams, createMaskPass } from "./masks";
import { applyPostParams, getHeroGtaoInternalSize, type HeroPostPipeline } from "./post";

describe("hero post-processing", () => {
  it("uploads normalized circle opacity to the mask compositor", () => {
    const masks = createMaskPass();
    const params = readHeroParams(
      createToolcraftState(appSchema, {
        values: {
          "masks.items": [
            {
              enabled: true,
              feather: 20,
              opacity: 40,
              position: { x: 0, y: 0 },
              radius: 30,
              rotation: 0,
              stretch: 1,
            },
          ],
        },
      }),
    );

    applyMaskParams(masks, params, {
      fullHeight: 1080,
      fullWidth: 1920,
      height: 1080,
      tileX: 0,
      tileY: 0,
      width: 1920,
    });

    expect(masks.material.uniforms.uMaskOpacity?.value[0]).toBe(0.4);
    masks.dispose();
  });

  it("caps only the internal low-frequency GTAO buffers", () => {
    expect(getHeroGtaoInternalSize(1920, 1080)).toEqual({
      height: 1080,
      width: 1920,
    });
    expect(getHeroGtaoInternalSize(7680, 4320)).toEqual({
      height: 1152,
      width: 2048,
    });
  });

  it("updates GTAO frame uniforms without invalidating its shader", () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    const gtao = new GTAOPass(scene, camera, 1, 1);
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.22, 1, 0.95);
    const bokeh = new BokehPass(scene, camera, {
      aperture: 0.00008,
      focus: 20,
      maxblur: 0.005,
    });
    const haze = createHazePass();
    const masks = createMaskPass();
    const pipeline = {
      bloom,
      bokeh,
      gtao,
      haze,
      masks,
    } as unknown as HeroPostPipeline;
    const baseParams = readHeroParams(createToolcraftState(appSchema));
    const params = {
      ...baseParams,
      post: { ...baseParams.post, occlusionRadius: 1.75 },
    };
    const materialVersion = gtao.gtaoMaterial.version;

    applyPostParams(pipeline, params, {
      fullHeight: 1080,
      fullWidth: 1920,
      height: 1080,
      tileX: 0,
      tileY: 0,
      width: 1920,
    });

    expect(gtao.gtaoMaterial.uniforms.radius.value).toBe(1.75);
    expect(gtao.gtaoMaterial.version).toBe(materialVersion);

    // A cropped window keeps the authored blur radius in full-wave pixels.
    applyPostParams(pipeline, params, {
      fullHeight: 1080, fullWidth: 1920, height: 720, width: 960,
      tileX: 480, tileY: 180,
    });
    const bokehUniforms = bokeh.uniforms as Record<string, { value: number }>;
    expect(bokehUniforms.aspect.value).toBe(960 / 720);
    expect(bokehUniforms.aperture.value).toBe(params.post.aperture * 2);
    expect(bokehUniforms.maxblur.value).toBe(params.post.maxBlur * 2);
    expect(gtao.gtaoMaterial.version).toBe(materialVersion);

    gtao.dispose();
    bloom.dispose();
    bokeh.dispose();
    haze.dispose();
    masks.dispose();
  });
});
