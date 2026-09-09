import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const images = new URL('../public/images/', import.meta.url);

test('Hero ships only its own website image section', () => {
  assert.deepEqual(readdirSync(images).sort(), ['recraft-hero']);
  assert.equal(existsSync(new URL('recraft-hero/card-stack/', images)), false,
    'The unused website card stack must not duplicate native gallery media.');
});

test('Hero retains mobile and WebGL fallback artwork', () => {
  for (const path of [
    'recraft-hero/hero-mobile.jpg',
    'recraft-hero/fallback/hero-gallery-desktop.jpg',
    'recraft-hero/fallback/hero-gallery-mobile.jpg',
    'recraft-hero/ticker-lines-left.svg',
  ]) {
    const file = new URL(path, images);
    assert.ok(existsSync(file), `Missing required artwork: ${fileURLToPath(file)}`);
  }
});
