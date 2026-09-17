import { expect, type Page } from '@playwright/test';
import { icebergSidePatternsGLSL } from '../src/app/iceberg-side-patterns';
import { icebergSelector, setIcebergTimelineFrame, setNumber } from './iceberg-test-helpers';

type PlateSnapshot = {
  edgePixels: number;
  hash: string;
  height: number;
  runs: Array<{ end: number; height: number; start: number }>;
  width: number;
};

async function observePlateComponents(page: Page): Promise<PlateSnapshot> {
  return page.locator(icebergSelector).evaluate((canvas: HTMLCanvasElement) => {
    const size = 512;
    const scratch = document.createElement('canvas');
    scratch.width = size; scratch.height = size;
    const context = scratch.getContext('2d', { willReadFrequently: true })!;
    context.imageSmoothingEnabled = false;
    context.drawImage(canvas, 0, 0, size, size);
    const pixels = context.getImageData(0, 0, size, size).data;
    let hash = 2166136261;
    let edgePixels = 0;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const alpha = pixels[(y * size + x) * 4 + 3];
        hash = Math.imul(hash ^ alpha, 16777619);
        if (alpha > 80 && (x === 0 || y === 0 || x === size - 1 || y === size - 1)) edgePixels++;
      }
    }
    let runs: PlateSnapshot['runs'] = [];
    // Parts can overlap in their overall projected bounding boxes. Inspect the
    // strongest vertical cross-section instead of treating that overlap as a
    // physical connection between separate meshes.
    for (let x = 0; x < size; x++) {
      const column: PlateSnapshot['runs'] = [];
      for (let y = 0; y < size; y++) if (pixels[(y * size + x) * 4 + 3] > 80) {
        const start = y;
        while (y + 1 < size && pixels[((y + 1) * size + x) * 4 + 3] > 80) y++;
        if (y - start + 1 >= 2) column.push({ start, end: y, height: y - start + 1 });
      }
      if (column.length > runs.length) runs = column;
    }
    return { edgePixels, hash: (hash >>> 0).toString(16), height: canvas.height, runs, width: canvas.width };
  });
}

async function observeBlockEdgeInk(page: Page): Promise<Array<{ bottom: number; slice: number; top: number | null }>> {
  return page.evaluate(source => {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const gl = canvas.getContext('webgl2')!;
    if (!gl) throw new Error('Plate outline regression requires WebGL2.');
    const shader = (type: number, body: string) => {
      const result = gl.createShader(type)!;
      gl.shaderSource(result, body); gl.compileShader(result);
      if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result)!);
      return result;
    };
    const vertex = shader(gl.VERTEX_SHADER, `#version 300 es
      void main() {
        vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));
        gl_Position=vec4(p*2.0-1.0,0.0,1.0);
      }`);
    const fragment = shader(gl.FRAGMENT_SHADER, `#version 300 es
      precision highp float;
      uniform float uWidth, uDepth, uPlateGap, uPlateThickness, uSlice, uBottom, uTop;
      out vec4 color;
      ${source}
      void main() {
        float x=(gl_FragCoord.x-0.5)/63.0*uWidth-uWidth*0.5;
        float y=mix(uBottom,uTop,(gl_FragCoord.y-0.5)/63.0);
        float ink=cubePatternInk(vec3(x,y,uWidth*0.5),1.0,0.0,uSlice,uPlateGap,uPlateThickness);
        color=vec4(vec3(ink),1.0);
      }`);
    const program = gl.createProgram()!;
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program)!);
    gl.useProgram(program);
    const set = (name: string, value: number) => gl.uniform1f(gl.getUniformLocation(program, name), value);
    const width = 2.18, depth = 1.36, thickness = 0.23;
    for (const [name, value] of Object.entries({
      uWidth: width, uDepth: depth, uPlateGap: 0.11, uPlateThickness: thickness,
      uFrontColumns: 7, uRightColumns: 7, uBackColumns: 7, uLeftColumns: 7,
      uGridThickness: 10, uGridStrength: 1,
    })) set(name, value);
    gl.uniform3f(gl.getUniformLocation(program, 'uViewDirection'), 0, 0.3, 1);
    const pixels = new Uint8Array(size * size * 4);
    const averageRow = (row: number) => {
      let total = 0;
      for (let x = 0; x < size; x++) total += pixels[(row * size + x) * 4];
      return total / size;
    };
    const result: Array<{ bottom: number; slice: number; top: number | null }> = [];
    try {
      for (let slice = 0; slice <= 4; slice++) {
        const bottom = -depth + slice * thickness;
        set('uSlice', slice); set('uBottom', bottom); set('uTop', bottom + thickness);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.readPixels(0, 0, size, size, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        result.push({ bottom: averageRow(0), slice, top: slice < 4 ? averageRow(size - 1) : null });
      }
    } finally {
      gl.deleteProgram(program); gl.deleteShader(vertex); gl.deleteShader(fragment);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    return result;
  }, icebergSidePatternsGLSL);
}

export async function verifyFourEqualBasePlates(page: Page) {
  await setIcebergTimelineFrame(page, 'end');
  await setNumber(page, 'iceberg.plateGap', 0);
  const closed = await observePlateComponents(page);

  await setNumber(page, 'iceberg.plateGap', 0.25);
  await expect.poll(async () => (await observePlateComponents(page)).runs.length).toBe(5);
  const split = await observePlateComponents(page);
  const plates = split.runs.slice(1);
  expect(plates).toHaveLength(4);
  expect(Math.max(...plates.map(run => run.height)) - Math.min(...plates.map(run => run.height))).toBeLessThanOrEqual(2);
  const gaps = split.runs.slice(0, -1).map((run, index) => split.runs[index + 1].start - run.end - 1);
  expect(Math.min(...gaps)).toBeGreaterThan(2);
  expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThanOrEqual(2);
  expect(split.edgePixels).toBe(0);
  const edgeInk = await observeBlockEdgeInk(page);
  for (const sample of edgeInk) {
    expect(sample.bottom, `slice ${sample.slice} bottom edge keeps a continuous outline`).toBeGreaterThan(150);
    if (sample.top !== null) expect(sample.top, `slice ${sample.slice} top edge keeps a continuous outline`).toBeGreaterThan(150);
  }

  await setNumber(page, 'iceberg.plateGap', 0);
  await expect.poll(async () => (await observePlateComponents(page)).hash).toBe(closed.hash);
  const restored = await observePlateComponents(page);
  expect(restored).toEqual(closed);
}
