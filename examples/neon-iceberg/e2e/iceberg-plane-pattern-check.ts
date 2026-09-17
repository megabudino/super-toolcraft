import { expect, type Page } from '@playwright/test';
import { icebergFieldGLSL } from '../src/app/iceberg-shaders';
import { icebergPlanePatternGLSL } from '../src/app/iceberg-plane-pattern';
import { setNumber } from './iceberg-test-helpers';

type LineObservation = {
  coverage: number;
  hash: string;
  horizontalTransitions: number;
  transitions: number;
  verticalTransitions: number;
};

type PrintObservation = {
  hash: string;
  mean: number;
  p10: number;
  p90: number;
};

async function observePlaneLines(page: Page) {
  return page.evaluate(({ fieldSource, patternSource }) => {
    const size = 192;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const gl = canvas.getContext('webgl2')!;
    if (!gl) throw new Error('Plane line regression requires WebGL2.');
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
      uniform float uRegion, uSlice, uMode, uLitShade, uGrainSample;
      out vec4 color;
      ${fieldSource}
      ${patternSource}
      void main() {
        vec2 uv=(gl_FragCoord.xy-0.5)/${size - 1}.0;
        vec2 xz=(uv-0.5)*uWidth;
        float ink=platePlaneLineInk(vec3(xz.x,0.0,xz.y),uRegion,uSlice);
        float value=uMode<0.5
          ? ink
          : platePlanePrintShade(uLitShade,ink,uGrainSample,uRegion,uSlice);
        color=vec4(vec3(value),1.0);
      }`);
    const program = gl.createProgram()!;
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program)!);
    gl.useProgram(program);
    const set = (name: string, value: number) => gl.uniform1f(gl.getUniformLocation(program, name), value);
    set('uWidth', 2.18); set('uSeed', 97); set('uMode', 0); set('uLitShade', 0.5); set('uGrainSample', 0);
    const pixels = new Uint8Array(size * size * 4);
    const sample = ({
      density = 42,
      direction = 15,
      region = 3,
      slice = 0,
      thickness = 38,
    } = {}): LineObservation => {
      set('uMode', 0); set('uRegion', region); set('uSlice', slice);
      set('uPlaneLineThickness', thickness); set('uPlaneLineDensity', density); set('uPlaneLineDirection', direction);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.readPixels(0, 0, size, size, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      let coverage = 0, horizontalTransitions = 0, verticalTransitions = 0, hash = 2166136261;
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const value = pixels[(y * size + x) * 4];
        if (value > 128) coverage++;
        hash = Math.imul(hash ^ value, 16777619);
        if (x && (value > 128) !== (pixels[(y * size + x - 1) * 4] > 128)) horizontalTransitions++;
        if (y && (value > 128) !== (pixels[((y - 1) * size + x) * 4] > 128)) verticalTransitions++;
      }
      return {
        coverage: coverage / (size * size),
        hash: (hash >>> 0).toString(16),
        horizontalTransitions,
        transitions: horizontalTransitions + verticalTransitions,
        verticalTransitions,
      };
    };
    const samplePrint = (litShade: number, grain: number): PrintObservation => {
      set('uMode', 1); set('uRegion', 3); set('uSlice', 0);
      set('uPlaneLineThickness', 38); set('uPlaneLineDensity', 42); set('uPlaneLineDirection', 15);
      set('uLitShade', litShade); set('uGrainSample', grain);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.readPixels(0, 0, size, size, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      const values: number[] = [];
      let hash = 2166136261, sum = 0;
      for (let i = 0; i < size * size; i++) {
        const value = pixels[i * 4];
        values.push(value); sum += value;
        hash = Math.imul(hash ^ value, 16777619);
      }
      values.sort((a, b) => a - b);
      return {
        hash: (hash >>> 0).toString(16),
        mean: sum / values.length / 255,
        p10: values[Math.floor(values.length * 0.1)] / 255,
        p90: values[Math.floor(values.length * 0.9)] / 255,
      };
    };
    const base = sample();
    const thin = sample({ thickness: 5 }), thick = sample({ thickness: 90 });
    const sparse = sample({ density: 8 }), dense = sample({ density: 72 });
    const direction0 = sample({ density: 28, direction: 0 });
    const direction90 = sample({ density: 28, direction: 90 });
    const denseDirection0 = sample({ density: 72, direction: 0 });
    const side = sample({ region: 1 }), upper = sample({ slice: 4 }), secondPlate = sample({ slice: 1 });
    const dimPlane = samplePrint(0.2, 0), brightPlane = samplePrint(0.9, 0);
    const darkGrainPlane = samplePrint(0.55, -0.325), lightGrainPlane = samplePrint(0.55, 0.325);
    set('uRegion', 1); set('uLitShade', 0.2); set('uGrainSample', 0); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.readPixels(0, 0, size, size, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    const dimSide = pixels[0] / 255;
    set('uLitShade', 0.9); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.readPixels(0, 0, size, size, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    const brightSide = pixels[0] / 255;
    gl.deleteProgram(program); gl.deleteShader(vertex); gl.deleteShader(fragment);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return {
      base, brightPlane, brightSide, darkGrainPlane, dense, denseDirection0, dimPlane, dimSide,
      direction0, direction90, lightGrainPlane, secondPlate, side, sparse, thick, thin, upper,
    };
  }, { fieldSource: icebergFieldGLSL, patternSource: icebergPlanePatternGLSL });
}

async function preparePlaneLines(page: Page) {
  await setNumber(page, 'iceberg.plateGap', 0.25);
  return observePlaneLines(page);
}

export async function verifyPlaneLineThickness(page: Page) {
  const observed = await preparePlaneLines(page);
  expect(observed.thin.coverage, 'Thin lines retain visible ink').toBeGreaterThan(0.02);
  expect(observed.thick.coverage, 'Thick lines retain visible paper gaps').toBeLessThan(0.96);
  expect(observed.thick.coverage, 'Line width increases ink coverage').toBeGreaterThan(observed.thin.coverage + 0.35);
  expect(observed.secondPlate.hash, 'Each plate receives a distinct deterministic line phase').not.toBe(observed.base.hash);
  expect(observed.side.coverage, 'Vertical grid faces keep their existing material').toBe(0);
  expect(observed.upper.coverage, 'The upper mountain block is not painted as a lower plate plane').toBe(0);
  expect(observed.dimPlane.hash, 'Plane print tone is independent of directional face lighting').toBe(observed.brightPlane.hash);
  expect(observed.darkGrainPlane.p10, 'Line ink stays nearly black under dark grain').toBeLessThan(0.04);
  expect(observed.lightGrainPlane.p10, 'Line ink stays dark under light grain').toBeLessThan(0.07);
  expect(observed.darkGrainPlane.p90, 'Paper stays light under dark grain').toBeGreaterThan(0.94);
  expect(observed.lightGrainPlane.p90, 'Paper stays nearly white under light grain').toBeGreaterThan(0.98);
  expect(observed.dimSide, 'Vertical faces retain their own lighting response').toBeCloseTo(0.2, 2);
  expect(observed.brightSide, 'Vertical faces retain their own lighting response').toBeCloseTo(0.9, 2);
}

export async function verifyPlaneLineDensity(page: Page) {
  const observed = await preparePlaneLines(page);
  expect(observed.sparse.coverage).toBeGreaterThan(0.1);
  expect(observed.sparse.coverage).toBeLessThan(0.8);
  expect(observed.dense.coverage).toBeGreaterThan(0.1);
  expect(observed.dense.coverage).toBeLessThan(0.8);
  expect(observed.dense.transitions, 'Higher density produces more line crossings').toBeGreaterThan(observed.sparse.transitions * 3);
  expect(observed.dense.hash).not.toBe(observed.sparse.hash);
}

export async function verifyPlaneLineDirection(page: Page) {
  const observed = await preparePlaneLines(page);
  expect(observed.direction0.verticalTransitions, 'Zero degrees keeps model X as the average flow axis').toBeGreaterThan(observed.direction0.horizontalTransitions * 1.35);
  expect(observed.direction0.horizontalTransitions, 'Zero-degree lines retain visible curvature').toBeGreaterThan(observed.direction0.verticalTransitions * 0.12);
  expect(observed.direction90.horizontalTransitions, 'Ninety degrees rotates the average flow toward model Z').toBeGreaterThan(observed.direction90.verticalTransitions * 1.35);
  expect(observed.direction90.verticalTransitions, 'Ninety-degree lines retain visible curvature').toBeGreaterThan(observed.direction90.horizontalTransitions * 0.12);
  expect(observed.denseDirection0.verticalTransitions, 'High density retains the requested average direction').toBeGreaterThan(observed.denseDirection0.horizontalTransitions * 1.2);
  expect(observed.denseDirection0.horizontalTransitions, 'High density does not straighten the line flow').toBeGreaterThan(observed.denseDirection0.verticalTransitions * 0.1);
  expect(observed.direction90.hash).not.toBe(observed.direction0.hash);
}
