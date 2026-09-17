import { expect, test } from 'vitest';
import { OrthographicCamera, Vector3 } from 'three';
import { configureIcebergCamera, getIcebergSceneRect } from './iceberg-camera';
import { orientationDefault, readIcebergSettings } from './iceberg-controls';
import type { IcebergPose } from './iceberg-render-types';

test('default iceberg retains its original frame and projection', () => {
  const settings = readIcebergSettings({});
  expect(getIcebergSceneRect(settings, orientationDefault)).toEqual({ x: -500, y: -700, width: 1000, height: 1400 });
  const camera = new OrthographicCamera(-2.5, 2.5, 3.5, -3.5, 0.01, 100);
  const worldPoint = new Vector3(0.3, 1, -0.2);
  const project = () => {
    const rect = getIcebergSceneRect(settings, orientationDefault);
    configureIcebergCamera(camera, settings, orientationDefault);
    const ndc = worldPoint.clone().project(camera);
    return [rect.x + (ndc.x + 1) * rect.width / 2, rect.y + (1 - ndc.y) * rect.height / 2];
  };
  const before = project();
  settings.depth = 2.5; settings.height = 4; settings.width = 3.6;
  const after = project();
  expect(after[0]).toBeCloseTo(before[0], 8);
  expect(after[1]).toBeCloseTo(before[1], 8);
});

test('reachable deep block and tall relief stay inside the camera at every sampled orbit', () => {
  const settings = readIcebergSettings({ 'iceberg.width': 3.6, 'iceberg.height': 4, 'iceberg.depth': 2.5, 'iceberg.plateGap': 0.6, 'iceberg.seamLevel': 0.6, 'iceberg.seamVariation': 0.85, 'iceberg.cliff': 0.8, 'iceberg.erosion': 0.6, 'iceberg.detail': 1 });
  const camera = new OrthographicCamera(-2.5, 2.5, 3.5, -3.5, 0.01, 100);
  const poses: IcebergPose[] = [orientationDefault, { position: [0, 12, 0], up: [0, 0, -1] }, { position: [0, -12, 0], up: [0, 0, 1] }];
  for (let azimuth = 0; azimuth < Math.PI * 2; azimuth += Math.PI / 6) {
    for (const elevation of [-0.9, 0, 0.9]) poses.push({ position: [Math.cos(azimuth), elevation, Math.sin(azimuth)], up: [0, 1, 0] });
  }
  for (const pose of poses) {
    configureIcebergCamera(camera, settings, pose);
    const rect = getIcebergSceneRect(settings, pose);
    expect(rect.width).toBeLessThan(2700); expect(rect.height).toBeLessThan(2700);
    for (const x of [-1.8, 1.8]) for (const y of [-4.9, 6.91]) for (const z of [-1.8, 1.8]) {
      const ndc = new Vector3(x, y, z).project(camera);
      expect(Math.abs(ndc.x)).toBeLessThan(1);
      expect(Math.abs(ndc.y)).toBeLessThan(1);
      expect(Math.abs(ndc.z)).toBeLessThan(1);
    }
  }
});
