import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { assessToolcraftRenderPlan, createToolcraftState } from '@/toolcraft/runtime';
import { appSchema } from '../app-schema';
import { appPerformance } from '../app-performance';
import { readHeroParams } from '../domain/hero-params';
import { applyCamera } from './hero-camera';
import { getHeroPreviewFrame, getHeroVisibleWindow } from './hero-preview-frame';

const logicalFrame = { width: 2826, height: 1080, devicePixelRatio: 2, renderScale: 2 };

describe('wave preview zoom', () => {
  it('changes backing pixels without changing the logical wave aspect', () => {
    const before = getHeroPreviewFrame({ ...logicalFrame, zoom: 30 });
    const after = getHeroPreviewFrame({ ...logicalFrame, zoom: 40 });
    expect([before.width, before.height]).toEqual([3391, 1296]);
    expect([after.width, after.height]).toEqual([4522, 1728]);
    expect(after.projectionAspect).toBe(before.projectionAspect);
    expect(after.projectionAspect).toBe(2826 / 1080);
  });

  it('preserves camera projection and wave framing across zoom and pixel density', () => {
    const params = readHeroParams(createToolcraftState(appSchema));
    const camera = new THREE.PerspectiveCamera();
    applyCamera(camera, params, getHeroPreviewFrame({ ...logicalFrame, zoom: 100 }));
    const projection = camera.projectionMatrix.toArray();
    const pose = camera.matrixWorld.toArray();
    for (const zoom of [10, 30, 40, 75, 100, 200]) {
      for (const devicePixelRatio of [1, 2]) {
        for (const renderScale of [1, 2]) {
          const frame = getHeroPreviewFrame({ ...logicalFrame, zoom, devicePixelRatio, renderScale });
          applyCamera(camera, params, frame);
          expect(camera.projectionMatrix.toArray()).toEqual(projection);
          expect(camera.matrixWorld.toArray()).toEqual(pose);
          expect(frame.width).toBe(Math.round(logicalFrame.width * zoom / 100 * devicePixelRatio * renderScale));
        }
      }
    }
  });

  it('preserves pixel-frame projection for existing full-frame and tiled exports', () => {
    const params = readHeroParams(createToolcraftState(appSchema));
    const camera = new THREE.PerspectiveCamera();
    const frame = { fullWidth: 3840, fullHeight: 2160, width: 1920, height: 1080, tileX: 1920, tileY: 1080 };
    applyCamera(camera, params, frame);
    expect(camera.aspect).toBe(3840 / 2160);
    expect(camera.view).toMatchObject({ enabled: true, offsetX: 1920, offsetY: 1080 });
    applyCamera(camera, params, { ...frame, width: 3840, height: 2160, tileX: 0, tileY: 0 });
    expect(camera.view?.enabled).toBe(false);
  });

  it('bounds editable wave GPU work to the visible window while preserving full-frame landmarks', () => {
    const params = readHeroParams(createToolcraftState(appSchema));
    const camera = new THREE.PerspectiveCamera();
    const full = getHeroPreviewFrame({ ...logicalFrame, zoom: 100 });
    applyCamera(camera, params, full);
    const point = new THREE.Vector3(0, 0, 0);
    const reference = point.clone().project(camera);
    for (const zoom of [40, 80, 100, 200, 400]) {
      const frame = getHeroPreviewFrame({ ...logicalFrame, zoom,
        visibleWindow: getHeroVisibleWindow({ left: -logicalFrame.width * zoom / 200 + 640,
          top: -logicalFrame.height * zoom / 200 + 360, zoom, viewportWidth: 1280, viewportHeight: 720 }) });
      expect(frame.width).toBeLessThanOrEqual((1280 + 192) * 4 + 1);
      expect(frame.height).toBeLessThanOrEqual((720 + 192) * 4 + 1);
      expect(frame.css.width * zoom / 100 * 4).toBeCloseTo(frame.width, 8);
      applyCamera(camera, params, frame);
      const projected = point.clone().project(camera);
      const fullX = (frame.tileX + (projected.x + 1) * frame.width / 2) / frame.fullWidth * 2 - 1;
      const fullY = 1 - (frame.tileY + (1 - projected.y) * frame.height / 2) / frame.fullHeight * 2;
      expect(fullX).toBeCloseTo(reference.x, 10);
      expect(fullY).toBeCloseTo(reference.y, 10);
    }
  });

  it('keeps zoom rerasterization structurally valid without requesting performance measurement', () => {
    expect(assessToolcraftRenderPlan(appSchema, {
      ...appPerformance,
      kernelBenchmarkDecisions: undefined,
    }).errors).toEqual([]);
  });
});
