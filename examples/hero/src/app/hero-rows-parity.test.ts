import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

interface RowsParityFixture {
  assembledFragmentSha256: string;
  mesh: {
    columns: number;
    floatLength: number;
    rows: number;
    sha256: string;
    sourceSha256: string;
  };
  sourceCommit: string;
}

const websiteSourceRoot = join(process.cwd(), '../../recraft-v4-styles/src/components/pages/home');
const fixture = JSON.parse(
  readFileSync(join(websiteSourceRoot, 'hero-card-dispersion-parity.fixture.json'), 'utf8'),
) as RowsParityFixture;

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('frozen Rows dispersion parity', () => {
  it('matches the pre-post-pass assembled shader and deterministic mesh fixture', () => {
    expect(fixture.sourceCommit).toBe('935c286c12467d5a9e4a12261fbc1039e8fd22e6');

    const rendererSource = readFileSync(
      join(websiteSourceRoot, 'hero-card-dispersion-webgl.ts'),
      'utf8',
    );
    const fragmentTemplate = rendererSource.match(
      /export const HERO_DISPERSION_FRAGMENT_SHADER = `([\s\S]*?)`;\n/,
    )?.[1];
    expect(fragmentTemplate).toBeDefined();

    const sharedShaderSource = readFileSync(
      join(websiteSourceRoot, 'hero-dispersion-shader.ts'),
      'utf8',
    );
    const commonSource = sharedShaderSource.match(
      /export const HERO_DISPERSION_GLSL_COMMON = `([\s\S]*?)`;\n/,
    )?.[1];
    expect(commonSource).toBeDefined();
    expect(rendererSource).toContain('${HERO_DISPERSION_GLSL_COMMON}');
    const fragmentSource = fragmentTemplate?.replace(
      '${HERO_DISPERSION_GLSL_COMMON}',
      commonSource ?? '',
    );
    expect(sha256(fragmentSource ?? '')).toBe(fixture.assembledFragmentSha256);

    const meshSource = sharedShaderSource.match(
      /export function createHeroRollerMesh\(columns = 48, rows = 8\): Float32Array \{[\s\S]*?\n\}/,
    )?.[0];
    expect(meshSource).toBeDefined();
    expect(sha256(meshSource ?? '')).toBe(fixture.mesh.sourceSha256);

    const vertices: number[] = [];
    for (let row = 0; row < fixture.mesh.rows; row += 1) {
      const top = row / fixture.mesh.rows;
      const bottom = (row + 1) / fixture.mesh.rows;
      for (let column = 0; column < fixture.mesh.columns; column += 1) {
        const left = column / fixture.mesh.columns;
        const right = (column + 1) / fixture.mesh.columns;
        vertices.push(left, top, right, top, left, bottom, left, bottom, right, top, right, bottom);
      }
    }
    const mesh = new Float32Array(vertices);
    expect(mesh.length).toBe(fixture.mesh.floatLength);
    expect(sha256(Array.from(mesh).join(','))).toBe(fixture.mesh.sha256);
  });
});
