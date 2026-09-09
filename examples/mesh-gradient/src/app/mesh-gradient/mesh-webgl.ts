import type { ToolcraftState } from "@/toolcraft/runtime";

import {
  getMeshBasePointCount,
  isMeshEdgePoint,
  MESH_MAX_COLUMNS,
  type MeshGlResource,
  readColorHex,
  readMeshColors,
  readMeshPointLayout,
} from "./mesh-model";
import { createMeshGeometry, type MeshNode } from "./mesh-webgl-geometry";

const vertexShaderSource = `#version 300 es
precision highp float;

layout(location = 0) in vec2 aPosition;
layout(location = 1) in vec3 aColor;

out vec3 vColor;

void main() {
  vColor = aColor;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

in vec3 vColor;
out vec4 outColor;

uniform float uOpacity;
uniform float uGrain;
uniform float uExposure;
uniform float uContrast;
uniform float uHue;
uniform float uSaturation;
uniform float uLightness;
uniform float uSpread;
uniform float uRandomness;
uniform int uInterpolation;
uniform bool uIncludeBackground;
uniform vec3 uBackground;

float hash12(vec2 point) {
  vec3 p3 = fract(vec3(point.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 linearToSrgb(vec3 color) {
  color = max(color, vec3(0.0));
  vec3 low = color * 12.92;
  vec3 high = 1.055 * pow(color, vec3(1.0 / 2.4)) - 0.055;
  return mix(low, high, step(vec3(0.0031308), color));
}

vec3 oklabToLinear(vec3 color) {
  float l = color.x + 0.3963377774 * color.y + 0.2158037573 * color.z;
  float m = color.x - 0.1055613458 * color.y - 0.0638541728 * color.z;
  float s = color.x - 0.0894841775 * color.y - 1.2914855480 * color.z;
  l = l * l * l;
  m = m * m * m;
  s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

vec3 rgbToHsv(vec3 color) {
  vec4 k = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(color.bg, k.wz), vec4(color.gb, k.xy), step(color.b, color.g));
  vec4 q = mix(vec4(p.xyw, color.r), vec4(color.r, p.yzx), step(p.x, color.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsvToRgb(vec3 color) {
  vec3 p = abs(fract(color.xxx + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
  return color.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), color.y);
}

void main() {
  vec3 color = vColor;
  if (uInterpolation == 1) {
    color = linearToSrgb(color);
  } else if (uInterpolation == 2) {
    color = linearToSrgb(oklabToLinear(color));
  }

  color = (color - 0.5) * mix(0.35, 1.35, uSpread) + 0.5;
  color *= exp2(uExposure);
  color = (color - 0.5) * uContrast + 0.5;
  vec3 hsv = rgbToHsv(max(color, vec3(0.0)));
  hsv.x = fract(hsv.x + uHue);
  hsv.y = clamp(hsv.y * uSaturation, 0.0, 1.5);
  color = hsvToRgb(hsv) + uLightness;
  float noise = hash12(gl_FragCoord.xy + vec2(uRandomness * 137.0));
  color += (noise - 0.5) * uGrain;
  color = clamp(color, 0.0, 1.0);

  if (uIncludeBackground) {
    outColor = vec4(mix(uBackground, color, uOpacity), 1.0);
  } else {
    outColor = vec4(color, uOpacity);
  }
}
`;

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to allocate a WebGL shader.");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Unknown shader compilation error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext): WebGLProgram {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to allocate a WebGL program.");

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || "Unknown shader link error.";
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

const uniformNames = [
  "uOpacity",
  "uGrain",
  "uExposure",
  "uContrast",
  "uHue",
  "uSaturation",
  "uLightness",
  "uSpread",
  "uRandomness",
  "uInterpolation",
  "uIncludeBackground",
  "uBackground",
] as const;

function createBuffer(gl: WebGL2RenderingContext): WebGLBuffer {
  const buffer = gl.createBuffer();
  if (!buffer) throw new Error("Unable to allocate a WebGL buffer.");
  return buffer;
}

export function createMeshGlResource(canvas: HTMLCanvasElement): MeshGlResource {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    depth: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
    stencil: false,
  });
  if (!gl) throw new Error("Mesh Gradient requires WebGL2.");

  const program = createProgram(gl);
  const vertexArray = gl.createVertexArray();
  if (!vertexArray) {
    gl.deleteProgram(program);
    throw new Error("Unable to allocate a WebGL vertex array.");
  }
  const positionBuffer = createBuffer(gl);
  const colorBuffer = createBuffer(gl);
  const indexBuffer = createBuffer(gl);
  const uniforms = Object.fromEntries(
    uniformNames.map((name) => [name, gl.getUniformLocation(program, name)]),
  );

  gl.bindVertexArray(vertexArray);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bindVertexArray(null);

  return {
    canvas,
    colorBuffer,
    gl,
    indexBuffer,
    positionBuffer,
    program,
    uniforms,
    vertexArray,
  };
}

export function disposeMeshGlResource(resource: MeshGlResource): void {
  resource.gl.deleteBuffer(resource.colorBuffer);
  resource.gl.deleteBuffer(resource.indexBuffer);
  resource.gl.deleteBuffer(resource.positionBuffer);
  resource.gl.deleteVertexArray(resource.vertexArray);
  resource.gl.deleteProgram(resource.program);
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace(/^#/, "");
  const value = Number.parseInt(normalized, 16);
  if (!Number.isFinite(value) || normalized.length !== 6) return [0, 0, 0];
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

function fract(value: number): number {
  return value - Math.floor(value);
}

export function getMeshColorLoopOffset({
  basePhase,
  cycles,
  progress,
}: {
  basePhase: number;
  cycles: number;
  progress: number;
}): number {
  const colorBasePhase = basePhase * 0.5;
  const colorPhase = Math.PI * 2 * progress * cycles + colorBasePhase;
  return Math.sin(colorPhase) - Math.sin(colorBasePhase);
}

function hashPair(x: number, y: number): number {
  let px = fract(x * 0.1031);
  let py = fract(y * 0.1031);
  let pz = fract(x * 0.1031);
  const dot = px * (py + 33.33) + py * (pz + 33.33) + pz * (px + 33.33);
  px += dot;
  py += dot;
  pz += dot;
  return fract((px + py) * pz);
}

function srgbToLinearChannel(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function linearToOklab([red, green, blue]: readonly number[]): [number, number, number] {
  const l = 0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue;
  const m = 0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue;
  const s = 0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue;
  const lr = Math.cbrt(l);
  const mr = Math.cbrt(m);
  const sr = Math.cbrt(s);
  return [
    0.2104542553 * lr + 0.793617785 * mr - 0.0040720468 * sr,
    1.9779984951 * lr - 2.428592205 * mr + 0.4505937099 * sr,
    0.0259040371 * lr + 0.7827717662 * mr - 0.808675766 * sr,
  ];
}

function rgbToHsv([red, green, blue]: readonly number[]): [number, number, number] {
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  let hue = 0;
  if (delta > 1e-10) {
    if (maximum === red) hue = fract((green - blue) / delta / 6);
    else if (maximum === green) hue = (blue - red) / delta / 6 + 1 / 3;
    else hue = (red - green) / delta / 6 + 2 / 3;
  }
  return [fract(hue), maximum <= 1e-10 ? 0 : delta / maximum, maximum];
}

function hsvToRgb([hue, saturation, value]: readonly number[]): [number, number, number] {
  const scaled = fract(hue) * 6;
  const sector = Math.floor(scaled);
  const fraction = scaled - sector;
  const p = value * (1 - saturation);
  const q = value * (1 - fraction * saturation);
  const t = value * (1 - (1 - fraction) * saturation);
  switch (sector % 6) {
    case 0: return [value, t, p];
    case 1: return [q, value, p];
    case 2: return [p, value, t];
    case 3: return [p, q, value];
    case 4: return [t, p, value];
    default: return [value, p, q];
  }
}

function setFloat(gl: WebGL2RenderingContext, location: WebGLUniformLocation | null, value: number) {
  gl.uniform1f(location, value);
}

export function renderMeshGlFrame({
  height,
  includeBackground,
  progress,
  resource,
  state,
  tessellation = 32,
  width,
}: {
  height: number;
  includeBackground: boolean;
  progress: number;
  resource: MeshGlResource;
  state: ToolcraftState;
  tessellation?: number;
  width: number;
}): void {
  const { canvas, gl, program, uniforms, vertexArray } = resource;
  const safeWidth = Math.max(1, Math.round(width));
  const safeHeight = Math.max(1, Math.round(height));
  if (canvas.width !== safeWidth) canvas.width = safeWidth;
  if (canvas.height !== safeHeight) canvas.height = safeHeight;

  const values = state.values;
  const meshColors = readMeshColors(values["mesh.colors"]);
  const columns = Math.max(
    2,
    Math.min(MESH_MAX_COLUMNS, Math.round(asNumber(values["mesh.columns"], 3))),
  );
  const layout = readMeshPointLayout(values["mesh.points"], meshColors.length, columns);
  const basePointCount = getMeshBasePointCount(layout);
  const interpolation = String(values["mix.interpolation"] ?? "oklab");
  const cycles = Math.round(asNumber(values["motion.cycles"], 1));
  const randomness = asNumber(values["motion.randomness"], 42) / 100;
  const positionDrift = asNumber(values["motion.positionDrift"], 14) / 100 * 0.22;
  const colorDrift = asNumber(values["motion.colorDrift"], 12) / 360;
  const loopProgress = progress - Math.floor(progress);
  const nodes = layout.points.map((point, index): MeshNode => {
    const indexValue = index + 1;
    const randomPhase = hashPair(indexValue, randomness * 17);
    const basePhase = Math.PI * 2 * randomPhase * randomness + indexValue;
    const phase = Math.PI * 2 * loopProgress * cycles + basePhase;
    const directionX = Math.cos(indexValue * 2.17 + randomPhase);
    const directionY = Math.sin(indexValue * 1.73 + randomPhase);
    const directionLength = Math.hypot(directionX, directionY) || 1;
    const mobile =
      index >= basePointCount ||
      !isMeshEdgePoint(index, basePointCount, columns);
    const offset = mobile ? (Math.sin(phase) - Math.sin(basePhase)) * positionDrift : 0;
    const hsv = rgbToHsv(hexToRgb(meshColors[index] ?? "#000000"));
    hsv[0] = fract(
      hsv[0] +
        getMeshColorLoopOffset({ basePhase, cycles, progress: loopProgress }) * colorDrift,
    );
    let color: [number, number, number] = hsvToRgb(hsv);
    if (interpolation === "linear" || interpolation === "oklab") {
      color = color.map(srgbToLinearChannel) as [number, number, number];
    }
    if (interpolation === "oklab") color = linearToOklab(color);
    return {
      color,
      handles: layout.handles[index]!,
      position: {
        x: point.x + directionX / directionLength * offset,
        y: point.y + directionY / directionLength * offset,
      },
    };
  });
  const geometry = createMeshGeometry(
    nodes,
    layout,
    columns,
    Math.max(4, Math.min(64, Math.round(tessellation))),
    {
    cycles,
    motionScale: asNumber(values["motion.scale"], 100) / 100,
    progress: loopProgress,
    swirl: asNumber(values["mix.swirl"], 0) / 100 * 1.4,
    warp: asNumber(values["mix.warp"], 0) / 100 * 0.16,
    },
  );
  const background = hexToRgb(readColorHex(values["appearance.background"]));

  gl.viewport(0, 0, safeWidth, safeHeight);
  gl.clearColor(
    includeBackground ? background[0] : 0,
    includeBackground ? background[1] : 0,
    includeBackground ? background[2] : 0,
    includeBackground ? 1 : 0,
  );
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);
  gl.bindVertexArray(vertexArray);
  gl.bindBuffer(gl.ARRAY_BUFFER, resource.positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, resource.colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometry.colors, gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, resource.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.DYNAMIC_DRAW);
  setFloat(gl, uniforms.uSpread, asNumber(values["mix.spread"], 100) / 100);
  setFloat(gl, uniforms.uOpacity, asNumber(values["mix.opacity"], 100) / 100);
  setFloat(gl, uniforms.uGrain, asNumber(values["mix.grain"], 0) / 100);
  setFloat(gl, uniforms.uExposure, asNumber(values["color.exposure"], 0));
  setFloat(gl, uniforms.uContrast, asNumber(values["color.contrast"], 100) / 100);
  setFloat(gl, uniforms.uHue, asNumber(values["color.hue"], 0) / 360);
  setFloat(gl, uniforms.uSaturation, asNumber(values["color.saturation"], 100) / 100);
  setFloat(gl, uniforms.uLightness, asNumber(values["color.lightness"], 0) / 100);
  setFloat(gl, uniforms.uRandomness, randomness);
  gl.uniform1i(uniforms.uInterpolation, interpolation === "linear" ? 1 : interpolation === "oklab" ? 2 : 0);
  gl.uniform1i(uniforms.uIncludeBackground, includeBackground ? 1 : 0);
  gl.uniform3f(uniforms.uBackground, background[0], background[1], background[2]);
  gl.drawElements(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_INT, 0);
  gl.bindVertexArray(null);
}

export function createMeshFrameSignature(state: ToolcraftState, progress: number): string {
  const values = state.values;
  const colors = readMeshColors(values["mesh.colors"]);
  const columns = Math.max(
    2,
    Math.min(MESH_MAX_COLUMNS, Number(values["mesh.columns"] ?? 3)),
  );
  const pointLayout = readMeshPointLayout(values["mesh.points"], colors.length, columns);
  return [
    colors,
    Number(progress.toFixed(4)),
    state.canvas.size.height,
    state.canvas.size.width,
    values["canvas.renderScale"],
    pointLayout,
    values["mesh.pinEdges"],
    values["mix.interpolation"],
    values["mix.spread"],
    values["mix.warp"],
    values["mix.swirl"],
    values["mix.opacity"],
    values["mix.grain"],
    values["color.exposure"],
    values["color.contrast"],
    values["color.hue"],
    values["color.saturation"],
    values["color.lightness"],
    values["motion.positionDrift"],
    values["motion.colorDrift"],
    values["motion.scale"],
    values["motion.cycles"],
    values["motion.randomness"],
    values["export.includeBackground"],
    values["appearance.background"],
  ]
    .map((value) => (typeof value === "object" ? JSON.stringify(value) : String(value)))
    .join("|");
}
