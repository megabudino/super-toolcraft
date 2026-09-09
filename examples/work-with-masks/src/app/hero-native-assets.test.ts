import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from '../../docs/reference/native-hero-manifest.json';

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

describe('native hero asset closure', () => {
  it('ships only the 24 real-brand logos, first-frame preview and two fonts', () => {
    const assets = manifest.files.filter(file => file.local.startsWith('public/'));
    expect(assets).toHaveLength(27);
    expect(listFiles('public').sort()).toEqual(assets.map(file => file.local).sort());
    for (const asset of assets) {
      const bytes = readFileSync(resolve(asset.local));
      expect(bytes.length).toBe(asset.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
    }
  });
});
