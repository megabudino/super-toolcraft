import { HERO_DESKTOP_MIN_WIDTH_PX } from './hero-responsive-settings';
import type { HeroSceneSettings } from './hero-scene-settings';

const MAX_BACKING_DIMENSION = 4096;
const MAX_BACKING_PIXELS = 5_000_000;

export const HERO_MAX_MOTION_OFFSET_PX = 140;
export const HERO_DESKTOP_RENDER_MARGIN_PX = 256;
export const HERO_CRT_TRACKING_JITTER_PX = 1.5;
export const HERO_SCENE_SAMPLING_GUARD_PX = 2;

export function getHeroRenderMargin(settings: HeroSceneSettings, sceneWidth: number) {
  if (sceneWidth >= HERO_DESKTOP_MIN_WIDTH_PX) return HERO_DESKTOP_RENDER_MARGIN_PX;
  return Math.ceil(
    HERO_MAX_MOTION_OFFSET_PX +
      settings.effects.crt.chroma +
      HERO_CRT_TRACKING_JITTER_PX +
      HERO_SCENE_SAMPLING_GUARD_PX,
  );
}

export const HERO_DISPERSION_GLSL_COMMON = `
vec3 spectralWeight(float t) {
  float h = uHue + t * 4.188790;
  vec3 rainbow = 0.5 + 0.5 * cos(h + vec3(0.0, -2.094395, -4.188790));
  rainbow = pow(rainbow, vec3(1.25)) * 1.8;
  return max(mix(vec3(1.0), rainbow, uSpectrum), 0.0);
}

float ditherPhase(vec2 seed) {
  return fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
}

float valueHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float valueNoise(vec2 p) {
  vec2 cell = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(valueHash(cell), valueHash(cell + vec2(1.0, 0.0)), u.x),
    mix(
      valueHash(cell + vec2(0.0, 1.0)),
      valueHash(cell + vec2(1.0, 1.0)),
      u.x
    ),
    u.y
  );
}

float fbm(vec2 p) {
  return valueNoise(p) * 0.65 + valueNoise(p * 2.13 + 7.7) * 0.35;
}

float waveHeight(vec2 p, float midY, float waveLen) {
  float q = (p.y - midY) / max(waveLen, 8.0);
  float px = p.x / max(uViewSize.x, 1.0);
  float p1 = q * 6.283185 + px * 2.6;
  float p2 = q * 13.63 + px * -3.4 + 1.27;
  float p3 = q * 22.05 + px * 1.8 + 2.41;
  float organic = fbm(vec2(px * 3.4, q * 1.85)) * 2.0 - 1.0;
  return 0.50 * sin(p1) + 0.26 * sin(p2) + 0.12 * sin(p3) + 0.22 * organic;
}
`;

export function compileHeroShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to allocate the hero dispersion shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? 'unknown error';
    gl.deleteShader(shader);
    throw new Error(`Hero dispersion shader compilation failed: ${info}`);
  }
  return shader;
}

export function createHeroProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string,
) {
  const vertex = compileHeroShader(gl, gl.VERTEX_SHADER, vertexSource);
  let fragment: WebGLShader | null = null;
  let program: WebGLProgram | null = null;
  try {
    fragment = compileHeroShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    program = gl.createProgram();
    if (!program) throw new Error('Unable to allocate the hero WebGL program.');
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program) ?? 'unknown error';
      throw new Error(`Hero WebGL program linking failed: ${info}`);
    }
    return program;
  } catch (error) {
    if (program) gl.deleteProgram(program);
    throw error;
  } finally {
    gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
  }
}

export function clampHeroBacking(
  cssWidth: number,
  cssHeight: number,
  pixelRatio: number,
): { height: number; width: number } {
  let ratio = Math.max(0.5, Math.min(2, pixelRatio));
  ratio = Math.min(ratio, MAX_BACKING_DIMENSION / Math.max(1, Math.max(cssWidth, cssHeight)));
  const pixels = cssWidth * cssHeight * ratio * ratio;
  if (pixels > MAX_BACKING_PIXELS) ratio *= Math.sqrt(MAX_BACKING_PIXELS / pixels);
  return {
    height: Math.max(1, Math.round(cssHeight * ratio)),
    width: Math.max(1, Math.round(cssWidth * ratio)),
  };
}

export function createHeroRollerMesh(columns = 48, rows = 8): Float32Array {
  const vertices: number[] = [];
  for (let row = 0; row < rows; row += 1) {
    const top = row / rows;
    const bottom = (row + 1) / rows;
    for (let column = 0; column < columns; column += 1) {
      const left = column / columns;
      const right = (column + 1) / columns;
      vertices.push(left, top, right, top, left, bottom, left, bottom, right, top, right, bottom);
    }
  }
  return new Float32Array(vertices);
}
