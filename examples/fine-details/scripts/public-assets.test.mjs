import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import test from 'node:test';

const images = new URL('../public/images/', import.meta.url);

test('Playground ships only its own image sections', () => {
  assert.deepEqual(readdirSync(images).sort(), ['home', 'recraft-fine-details']);
});

test('Playground retains carousel, style and trail resources', () => {
  for (const path of [
    'recraft-fine-details/carousel/carousel-01.jpeg',
    'recraft-fine-details/carousel/carousel-02.jpeg',
    'recraft-fine-details/carousel/carousel-03.jpeg',
    'recraft-fine-details/carousel/carousel-04.jpeg',
    'recraft-fine-details/grid.png',
    'recraft-fine-details/style-presets/',
    'home/fine-details-trail-v1/',
  ]) assert.ok(existsSync(new URL(path, images)), `Missing required artwork: ${path}`);
});
