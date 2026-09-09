import * as React from "react";

import type { ToolcraftCustomControlRendererProps } from "@/toolcraft/runtime/react";
import { useToolcraftPipeline } from "@/toolcraft/runtime/react";
import {
  Button,
  ControlFieldLabel,
  Field,
  createControlHistoryGroupId,
} from "@/toolcraft/ui";

import { grassPipelinePasses } from "../app-renderer-pipeline";
import { grassGroundBlendNoiseGlsl } from "./grass-ground-blend-noise";
import { readGrassSettings, type GrassSettings } from "./grass-values";
import styles from "./terrain-noise-preview.module.css";

type GrassNoisePreviewKind = "clover" | "lawn" | "tall" | "terrain";

const vertexShader = `#version 300 es
  layout(location = 0) in vec2 position;
  out vec2 uv;
  void main() {
    uv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShader = `#version 300 es
  precision highp float;
  precision highp int;

  in vec2 uv;
  out vec4 color;

  uniform int uDetail;
  uniform float uFieldEdgeIrregularity;
  uniform vec2 uFieldSize;
  uniform float uFieldShapeRoundness;
  uniform int uFieldShapeSeed;
  uniform int uKind;
  uniform vec2 uLevels;
  uniform vec2 uNoiseOffset;
  uniform float uNoiseScale;
  uniform float uRoughness;
  uniform int uSeed;

  ${grassGroundBlendNoiseGlsl}

  uint hashCell(ivec2 cell, int seed, int channel) {
    uint value = uint(cell.x) * 521288629u +
      uint(cell.y) * 1597334805u +
      uint(seed + channel * 1013) * 1820416117u;
    value = (value ^ (value >> 13u)) * 668265261u;
    value ^= value >> 15u;
    return value;
  }

  float randomCell(ivec2 cell, int seed, int channel) {
    return float(hashCell(cell, seed, channel)) / 4294967295.0;
  }

  float valueNoise(vec2 point, int seed) {
    ivec2 cell = ivec2(floor(point));
    vec2 fraction = fract(point);
    fraction = fraction * fraction * (3.0 - 2.0 * fraction);
    float nearValue = mix(
      randomCell(cell, seed, 0),
      randomCell(cell + ivec2(1, 0), seed, 0),
      fraction.x
    );
    float farValue = mix(
      randomCell(cell + ivec2(0, 1), seed, 0),
      randomCell(cell + ivec2(1, 1), seed, 0),
      fraction.x
    );
    return mix(nearValue, farValue, fraction.y);
  }

  float voronoiNoise(vec2 point, int seed) {
    ivec2 cell = ivec2(floor(point));
    float nearestDistanceSquared = 1e8;
    for (int offsetY = -1; offsetY <= 1; offsetY++) {
      for (int offsetX = -1; offsetX <= 1; offsetX++) {
        ivec2 neighbor = cell + ivec2(offsetX, offsetY);
        vec2 feature = vec2(neighbor) + vec2(
          randomCell(neighbor, seed, 0),
          randomCell(neighbor, seed, 1)
        );
        vec2 delta = feature - point;
        nearestDistanceSquared = min(
          nearestDistanceSquared,
          dot(delta, delta)
        );
      }
    }
    return 1.0 - clamp(sqrt(nearestDistanceSquared) / 0.9, 0.0, 1.0);
  }

  float fieldRelativeDistance(vec2 world) {
    vec2 normalized = world / max(vec2(0.001), uFieldSize * 0.5);
    float exponent = 2.0 + (1.0 - clamp(uFieldShapeRoundness, 0.0, 1.0)) * 10.0;
    float angle = atan(normalized.y, normalized.x);
    float phase = float(uFieldShapeSeed) * 0.173;
    float wave = sin(angle * 3.0 + phase) * 0.67 +
      sin(angle * 7.0 - phase * 1.7) * 0.33;
    float edgeScale = 1.0 - uFieldEdgeIrregularity * 0.5 +
      wave * uFieldEdgeIrregularity * 0.5;
    float superellipseDistance = pow(
      pow(abs(normalized.x), exponent) +
        pow(abs(normalized.y), exponent),
      1.0 / exponent
    );
    return superellipseDistance / max(0.001, edgeScale);
  }

  float terrainPerimeterEnvelope(vec2 world) {
    return 1.0 - smoothstep(0.76, 1.0, fieldRelativeDistance(world));
  }

  void main() {
    vec2 world = (uv - 0.5) * uFieldSize;
    if (uKind == 2) {
      float cloverShade = grassCloverEvaluateMask(
        world,
        uNoiseOffset,
        uNoiseScale,
        float(uSeed),
        uRoughness,
        uDetail,
        uLevels
      );
      color = vec4(vec3(cloverShade), 1.0);
      return;
    }
    vec2 base = (world + uNoiseOffset) * uNoiseScale;
    float amplitude = 1.0;
    float frequency = 1.0;
    float normalization = 0.0;
    float noiseValue = 0.0;
    for (int octave = 0; octave < 6; octave++) {
      if (octave >= uDetail) break;
      float octaveValue = uKind == 0
        ? valueNoise(
            base * frequency + vec2(float(octave) * 13.37, -float(octave) * 7.91),
            uSeed + octave * 19
          )
        : voronoiNoise(
            base * frequency + vec2(float(octave) * 11.17, -float(octave) * 5.73),
            uSeed + octave * 29
          );
      noiseValue += octaveValue * amplitude;
      normalization += amplitude;
      amplitude *= uRoughness;
      frequency *= 2.0;
    }
    float shade = clamp(noiseValue / max(0.0001, normalization), 0.0, 1.0);
    if (uKind == 0) {
      float remapped = clamp(
        (shade - uLevels.x) / max(0.0001, uLevels.y - uLevels.x),
        0.0,
        1.0
      );
      shade = remapped * remapped * (3.0 - 2.0 * remapped) *
        terrainPerimeterEnvelope(world);
    } else if (uLevels.y <= 0.0001) {
      shade = 1.0;
    } else if (uLevels.x >= 0.9999) {
      shade = 0.0;
    } else {
      shade = smoothstep(uLevels.x, uLevels.y, shade);
    }
    color = vec4(vec3(shade), 1.0);
  }
`;

class GrassNoisePreviewRenderer {
  private readonly buffer: WebGLBuffer;
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;

  constructor(private readonly canvas: HTMLCanvasElement) {
    canvas.width = 512;
    canvas.height = 264;
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    if (!gl) throw new Error("WebGL 2 is required for noise previews.");
    this.gl = gl;
    this.program = this.createProgram();
    const buffer = gl.createBuffer();
    if (!buffer) throw new Error("Unable to allocate noise preview geometry.");
    this.buffer = buffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
  }

  private compile(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type);
    if (!shader) throw new Error("Unable to allocate noise preview shader.");
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const message =
        this.gl.getShaderInfoLog(shader) ?? "Noise preview shader failed.";
      this.gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  }

  private createProgram(): WebGLProgram {
    const program = this.gl.createProgram();
    if (!program) throw new Error("Unable to allocate noise preview program.");
    const vertex = this.compile(this.gl.VERTEX_SHADER, vertexShader);
    const fragment = this.compile(this.gl.FRAGMENT_SHADER, fragmentShader);
    this.gl.attachShader(program, vertex);
    this.gl.attachShader(program, fragment);
    this.gl.linkProgram(program);
    this.gl.deleteShader(vertex);
    this.gl.deleteShader(fragment);
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      throw new Error(
        this.gl.getProgramInfoLog(program) ?? "Noise preview program failed.",
      );
    }
    return program;
  }

  render(settings: GrassSettings, kind: GrassNoisePreviewKind): void {
    const noise =
      kind === "terrain"
        ? {
            detail: settings.terrain.detail,
            levels: settings.terrain.heightLevels,
            offset: settings.terrain.noiseOffset,
            roughness: settings.terrain.roughness,
            scale: settings.terrain.noiseScale,
            seed: settings.terrain.seed,
          }
        : kind === "clover"
          ? settings.surface.cloverMask
          : kind === "lawn"
            ? settings.lawn.distribution
            : settings.field.distribution;
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(gl.getUniformLocation(this.program, "uDetail"), noise.detail);
    gl.uniform1f(
      gl.getUniformLocation(this.program, "uFieldEdgeIrregularity"),
      settings.field.edgeIrregularity,
    );
    gl.uniform2f(
      gl.getUniformLocation(this.program, "uFieldSize"),
      settings.field.width,
      settings.field.depth,
    );
    gl.uniform1f(
      gl.getUniformLocation(this.program, "uFieldShapeRoundness"),
      settings.field.shapeRoundness,
    );
    gl.uniform1i(
      gl.getUniformLocation(this.program, "uFieldShapeSeed"),
      settings.terrain.seed,
    );
    gl.uniform1i(
      gl.getUniformLocation(this.program, "uKind"),
      kind === "terrain" ? 0 : kind === "clover" ? 2 : 1,
    );
    gl.uniform2f(
      gl.getUniformLocation(this.program, "uLevels"),
      noise.levels[0],
      noise.levels[1],
    );
    gl.uniform2f(
      gl.getUniformLocation(this.program, "uNoiseOffset"),
      noise.offset[0],
      noise.offset[1],
    );
    gl.uniform1f(
      gl.getUniformLocation(this.program, "uNoiseScale"),
      noise.scale,
    );
    gl.uniform1f(
      gl.getUniformLocation(this.program, "uRoughness"),
      noise.roughness,
    );
    gl.uniform1i(gl.getUniformLocation(this.program, "uSeed"), noise.seed);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose(): void {
    this.gl.deleteBuffer(this.buffer);
    this.gl.deleteProgram(this.program);
  }
}

type DragState = {
  historyGroup: string;
  moved: boolean;
  offset: readonly [number, number];
  pointerId: number;
  startX: number;
  startY: number;
};

function getPreviewKind(target: string): GrassNoisePreviewKind {
  if (target === "terrain.noiseOffset") return "terrain";
  if (target === "field.distributionOffset") return "tall";
  if (target === "lawn.distributionOffset") return "lawn";
  if (target === "surface.cloverMaskOffset") return "clover";
  throw new Error(`Unsupported noise preview target: ${target}`);
}

function getPreviewOffset(
  settings: GrassSettings,
  kind: GrassNoisePreviewKind,
): readonly [number, number] {
  if (kind === "terrain") return settings.terrain.noiseOffset;
  if (kind === "clover") return settings.surface.cloverMask.offset;
  if (kind === "lawn") return settings.lawn.distribution.offset;
  return settings.field.distribution.offset;
}

function getPreviewSignature(
  settings: GrassSettings,
  kind: GrassNoisePreviewKind,
): string {
  const noise =
    kind === "terrain"
      ? {
          detail: settings.terrain.detail,
          heightLevels: settings.terrain.heightLevels,
          noiseOffset: settings.terrain.noiseOffset,
          noiseScale: settings.terrain.noiseScale,
          roughness: settings.terrain.roughness,
          seed: settings.terrain.seed,
        }
      : kind === "clover"
        ? settings.surface.cloverMask
        : kind === "lawn"
          ? settings.lawn.distribution
          : settings.field.distribution;
  return JSON.stringify({
    depth: settings.field.depth,
    edgeIrregularity: settings.field.edgeIrregularity,
    kind,
    noise,
    shapeRoundness: settings.field.shapeRoundness,
    shapeSeed: settings.terrain.seed,
    width: settings.field.width,
  });
}

export function GrassNoisePreviewControl({
  control,
  name,
  setValue,
  state,
}: ToolcraftCustomControlRendererProps): React.JSX.Element {
  const kind = getPreviewKind(control.target);
  const pipeline = useToolcraftPipeline();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const rendererRef = React.useRef<GrassNoisePreviewRenderer | null>(null);
  const dragRef = React.useRef<DragState | null>(null);
  const settings = React.useMemo(() => readGrassSettings(state), [state]);
  const signature = getPreviewSignature(settings, kind);
  const renderSettingsRef = React.useRef(settings);
  const renderSignatureRef = React.useRef(signature);
  if (renderSignatureRef.current !== signature) {
    renderSignatureRef.current = signature;
    renderSettingsRef.current = settings;
  }

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    rendererRef.current ??= new GrassNoisePreviewRenderer(canvas);
    const renderer = rendererRef.current;
    const renderSettings = renderSettingsRef.current;
    const execute = () => {
      renderer.render(renderSettings, kind);
      return signature;
    };
    if (pipeline) {
      void pipeline.runPass(
        grassPipelinePasses.noisePreview,
        {
          "field.depth": renderSettings.field.depth,
          "field.edgeIrregularity":
            renderSettings.field.edgeIrregularity,
          "field.distributionDetail": renderSettings.field.distribution.detail,
          "field.distributionLevels":
            renderSettings.field.distribution.levels.join(":"),
          "field.distributionOffset":
            renderSettings.field.distribution.offset.join(":"),
          "field.distributionRoughness":
            renderSettings.field.distribution.roughness,
          "field.distributionScale": renderSettings.field.distribution.scale,
          "field.distributionSeed": renderSettings.field.distribution.seed,
          "field.width": renderSettings.field.width,
          "lawn.distributionDetail": renderSettings.lawn.distribution.detail,
          "lawn.distributionLevels":
            renderSettings.lawn.distribution.levels.join(":"),
          "lawn.distributionOffset":
            renderSettings.lawn.distribution.offset.join(":"),
          "lawn.distributionRoughness":
            renderSettings.lawn.distribution.roughness,
          "lawn.distributionScale": renderSettings.lawn.distribution.scale,
          "lawn.distributionSeed": renderSettings.lawn.distribution.seed,
          "field.shapeRoundness": renderSettings.field.shapeRoundness,
          "renderer.noisePreviewKind": kind,
          "surface.cloverMaskDetail": renderSettings.surface.cloverMask.detail,
          "surface.cloverMaskLevels":
            renderSettings.surface.cloverMask.levels.join(":"),
          "surface.cloverMaskOffset":
            renderSettings.surface.cloverMask.offset.join(":"),
          "surface.cloverMaskRoughness":
            renderSettings.surface.cloverMask.roughness,
          "surface.cloverMaskScale": renderSettings.surface.cloverMask.scale,
          "surface.cloverMaskSeed": renderSettings.surface.cloverMask.seed,
          "terrain.detail": renderSettings.terrain.detail,
          "terrain.heightLevels":
            renderSettings.terrain.heightLevels.join(":"),
          "terrain.noiseOffset": renderSettings.terrain.noiseOffset.join(":"),
          "terrain.noiseScale": renderSettings.terrain.noiseScale,
          "terrain.roughness": renderSettings.terrain.roughness,
          "terrain.seed": renderSettings.terrain.seed,
        },
        execute,
      );
    } else {
      execute();
    }
  }, [kind, pipeline, signature]);

  React.useEffect(
    () => () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
    },
    [],
  );

  const offset = getPreviewOffset(settings, kind);

  function setOffset(
    nextOffset: readonly [number, number],
    historyGroup: string,
  ): void {
    setValue(
      [
        Math.max(-24, Math.min(24, nextOffset[0])),
        Math.max(-24, Math.min(24, nextOffset[1])),
      ],
      { history: "merge", historyGroup },
    );
  }

  function handlePointerDown(
    event: React.PointerEvent<HTMLButtonElement>,
  ): void {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      historyGroup: createControlHistoryGroupId(`${kind}-noise-offset`),
      moved: false,
      offset,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
  }

  function handlePointerMove(
    event: React.PointerEvent<HTMLButtonElement>,
  ): void {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    drag.moved ||= Math.abs(deltaX) + Math.abs(deltaY) > 2;
    setOffset(
      [
        drag.offset[0] - (deltaX / bounds.width) * settings.field.width,
        drag.offset[1] + (deltaY / bounds.height) * settings.field.depth,
      ],
      drag.historyGroup,
    );
  }

  function finishPointer(event: React.PointerEvent<HTMLButtonElement>): void {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved) {
      const bounds = event.currentTarget.getBoundingClientRect();
      setOffset(
        [
          drag.offset[0] +
            ((event.clientX - bounds.left) / bounds.width - 0.5) *
              settings.field.width,
          drag.offset[1] +
            ((event.clientY - bounds.top) / bounds.height - 0.5) *
              settings.field.depth,
        ],
        drag.historyGroup,
      );
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  }

  const isTerrain = kind === "terrain";
  const isClover = kind === "clover";
  const isLawn = kind === "lawn";
  return (
    <Field className={styles.field}>
      <ControlFieldLabel>{name}</ControlFieldLabel>
      <Button
        aria-label={
          isTerrain
            ? "Move terrain height map"
            : isClover
              ? "Move Clover blend map"
              : isLawn
                ? "Move Lawn distribution map"
                : "Move Tall Grass distribution map"
        }
        className={styles.preview}
        data-noise-signature={signature}
        data-slot={
          isTerrain
            ? "terrain-noise-preview"
            : isClover
              ? "grass-clover-blend-preview"
              : isLawn
                ? "grass-lawn-distribution-preview"
                : "grass-distribution-preview"
        }
        onPointerCancel={finishPointer}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointer}
        radius="lg"
        type="button"
        variant="outline"
      >
        <canvas className={styles.canvas} ref={canvasRef} />
        <span aria-hidden="true" className={styles.crosshair} />
      </Button>
    </Field>
  );
}
