import type { ToolcraftKernelBenchmarkHarnessRegistry } from "./kernel-benchmark-contract";
import { grassButterflyKernelBenchmarks } from "./grass-butterfly-kernel-benchmarks";
import { grassScanKernelBenchmarks } from "./grass-scan-kernel-benchmarks";

const appKernelBenchmarksBase = {
  ...grassButterflyKernelBenchmarks,
  ...grassScanKernelBenchmarks,
  "grass-noise-preview": {
    "canvas-2d": {
      iterations: 2,
      async run({ page, workload }) {
        return page.evaluate((currentWorkload) => {
          const detail = Math.max(
            1,
            Math.min(
              6,
              Math.max(
                Math.trunc(currentWorkload["terrain-octaves"] ?? 1),
                Math.trunc(currentWorkload["tall-mask-octaves"] ?? 1),
                Math.trunc(currentWorkload["lawn-mask-octaves"] ?? 1),
              ),
            ),
          );
          const width = 160;
          const height = 96;
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d");
          if (!context)
            throw new Error("Canvas 2D benchmark context is unavailable.");
          const image = context.createImageData(width, height);
          let checksum = 0;
          for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
              let amplitude = 1;
              let frequency = 1;
              let normalization = 0;
              let value = 0;
              for (let octave = 0; octave < detail; octave += 1) {
                value +=
                  Math.sin((x * 0.037 + y * 0.021) * frequency + octave) *
                  amplitude;
                normalization += amplitude;
                amplitude *= 0.52;
                frequency *= 2;
              }
              const shade = Math.round(
                Math.max(0, Math.min(1, (value / normalization) * 0.5 + 0.5)) *
                  255,
              );
              const offset = (y * width + x) * 4;
              image.data[offset] = shade;
              image.data[offset + 1] = shade;
              image.data[offset + 2] = shade;
              image.data[offset + 3] = 255;
              checksum = (checksum + shade * (((x + y) % 17) + 1)) >>> 0;
            }
          }
          context.putImageData(image, 0, 0);
          return JSON.stringify({
            detail,
            field: "deterministic-procedural-noise-preview",
            height,
            width,
          });
        }, workload);
      },
    },
    webgl: {
      iterations: 2,
      async run({ page, workload }) {
        return page.evaluate((currentWorkload) => {
          const detail = Math.max(
            1,
            Math.min(
              6,
              Math.max(
                Math.trunc(currentWorkload["terrain-octaves"] ?? 1),
                Math.trunc(currentWorkload["tall-mask-octaves"] ?? 1),
                Math.trunc(currentWorkload["lawn-mask-octaves"] ?? 1),
              ),
            ),
          );
          const width = 160;
          const height = 96;
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const gl = canvas.getContext("webgl2", {
            antialias: false,
            preserveDrawingBuffer: true,
          });
          if (!gl) throw new Error("WebGL 2 benchmark context is unavailable.");
          const compile = (type: number, source: string) => {
            const shader = gl.createShader(type);
            if (!shader)
              throw new Error("Unable to allocate benchmark shader.");
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
              throw new Error(
                gl.getShaderInfoLog(shader) ?? "Benchmark shader failed.",
              );
            }
            return shader;
          };
          const program = gl.createProgram();
          if (!program)
            throw new Error("Unable to allocate benchmark program.");
          gl.attachShader(
            program,
            compile(
              gl.VERTEX_SHADER,
              `#version 300 es
              layout(location = 0) in vec2 position;
              void main() { gl_Position = vec4(position, 0.0, 1.0); }`,
            ),
          );
          gl.attachShader(
            program,
            compile(
              gl.FRAGMENT_SHADER,
              `#version 300 es
              precision highp float;
              uniform int detail;
              out vec4 color;
              void main() {
                float amplitude = 1.0;
                float frequency = 1.0;
                float normalization = 0.0;
                float value = 0.0;
                for (int octave = 0; octave < 6; octave++) {
                  if (octave >= detail) break;
                  value += sin((gl_FragCoord.x * 0.037 + gl_FragCoord.y * 0.021) * frequency + float(octave)) * amplitude;
                  normalization += amplitude;
                  amplitude *= 0.52;
                  frequency *= 2.0;
                }
                float shade = clamp(value / normalization * 0.5 + 0.5, 0.0, 1.0);
                color = vec4(vec3(shade), 1.0);
              }`,
            ),
          );
          gl.linkProgram(program);
          if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(
              gl.getProgramInfoLog(program) ?? "Benchmark program failed.",
            );
          }
          const buffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 3, -1, -1, 3]),
            gl.STATIC_DRAW,
          );
          gl.useProgram(program);
          gl.enableVertexAttribArray(0);
          gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
          gl.uniform1i(gl.getUniformLocation(program, "detail"), detail);
          gl.viewport(0, 0, width, height);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          const pixels = new Uint8Array(width * height * 4);
          gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
          gl.deleteBuffer(buffer);
          gl.deleteProgram(program);
          return JSON.stringify({
            detail,
            field: "deterministic-procedural-noise-preview",
            height,
            width,
          });
        }, workload);
      },
    },
  },
  "grass-layout-build": {
    webgl: {
      iterations: 2,
      async run({ page, workload }) {
        return page.evaluate((currentWorkload) => {
          const bladeCount = Math.trunc(currentWorkload["blade-count"] ?? 0);
          const detail = Math.max(
            1,
            Math.min(6, Math.trunc(currentWorkload["terrain-octaves"] ?? 1)),
          );
          const maskDetail = Math.max(
            1,
            Math.min(
              6,
              Math.trunc(currentWorkload["tall-mask-octaves"] ?? 1),
            ),
          );
          const offsets = new Float32Array(bladeCount * 3);
          for (let index = 0; index < bladeCount; index += 1) {
            const x = (((index * 0.7548776662466927) % 1) - 0.5) * 11;
            const z = (((index * 0.5698402909980532) % 1) - 0.5) * 7;
            let amplitude = 1;
            let frequency = 1;
            let normalization = 0;
            let height = 0;
            let mask = 0;
            for (let octave = 0; octave < detail; octave += 1) {
              height +=
                Math.sin((x * 0.37 + z * 0.21) * frequency + octave) *
                amplitude;
              normalization += amplitude;
              amplitude *= 0.52;
              frequency *= 2;
            }
            for (let octave = 0; octave < maskDetail; octave += 1) {
              mask += Math.abs(
                Math.sin(x * (octave + 1) * 0.31 + z * 0.27 - octave),
              );
            }
            offsets[index * 3] = x;
            offsets[index * 3 + 1] =
              (height / normalization) * (0.75 + mask / maskDetail / 4);
            offsets[index * 3 + 2] = z;
          }
          const canvas = document.createElement("canvas");
          const gl = canvas.getContext("webgl2");
          if (!gl) throw new Error("WebGL 2 benchmark context is unavailable.");
          const buffer = gl.createBuffer();
          if (!buffer)
            throw new Error("Unable to allocate layout benchmark buffer.");
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.bufferData(gl.ARRAY_BUFFER, offsets, gl.STATIC_DRAW);
          gl.deleteBuffer(buffer);
          return JSON.stringify({
            bladeCount,
            detail,
            field: "terrain-and-voronoi-aware-instance-layout",
            maskDetail,
          });
        }, workload);
      },
    },
  },
  "grass-lawn-layout-build": {
    webgl: {
      iterations: 2,
      async run({ page, workload }) {
        return page.evaluate((currentWorkload) => {
          const bladeCount = Math.trunc(
            currentWorkload["lawn-blade-count"] ?? 0,
          );
          const detail = Math.max(
            1,
            Math.min(6, Math.trunc(currentWorkload["terrain-octaves"] ?? 1)),
          );
          const maskDetail = Math.max(
            1,
            Math.min(
              6,
              Math.trunc(currentWorkload["lawn-mask-octaves"] ?? 1),
            ),
          );
          const offsets = new Float32Array(bladeCount * 3);
          for (let index = 0; index < bladeCount; index += 1) {
            const x = (((index * 0.6180339887498948) % 1) - 0.5) * 11;
            const z = (((index * 0.414213562373095) % 1) - 0.5) * 7;
            let amplitude = 1;
            let frequency = 1;
            let normalization = 0;
            let height = 0;
            let mask = 0;
            for (let octave = 0; octave < detail; octave += 1) {
              height +=
                Math.sin((x * 0.37 + z * 0.21) * frequency + octave) *
                amplitude;
              normalization += amplitude;
              amplitude *= 0.52;
              frequency *= 2;
            }
            for (let octave = 0; octave < maskDetail; octave += 1) {
              mask += Math.abs(
                Math.sin(x * (octave + 1) * 0.29 + z * 0.23 - octave),
              );
            }
            offsets[index * 3] = x;
            offsets[index * 3 + 1] =
              (height / normalization) * (0.82 + mask / maskDetail / 6);
            offsets[index * 3 + 2] = z;
          }
          const canvas = document.createElement("canvas");
          const gl = canvas.getContext("webgl2");
          if (!gl) throw new Error("WebGL 2 benchmark context is unavailable.");
          const buffer = gl.createBuffer();
          if (!buffer)
            throw new Error("Unable to allocate lawn benchmark buffer.");
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.bufferData(gl.ARRAY_BUFFER, offsets, gl.STATIC_DRAW);
          gl.deleteBuffer(buffer);
          return JSON.stringify({
            bladeCount,
            detail,
            field: "terrain-aware-lawn-layout",
            maskDetail,
          });
        }, workload);
      },
    },
  },
  "grass-scene-render": {
    webgl: {
      iterations: 2,
      async run({ page, workload }) {
        return page.evaluate((currentWorkload) => {
          const bladeCount =
            Math.trunc(currentWorkload["blade-count"] ?? 0) +
            Math.trunc(currentWorkload["lawn-blade-count"] ?? 0);
          const renderScale = currentWorkload["preview-render-scale"] ?? 1;
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(256 * renderScale);
          canvas.height = Math.round(144 * renderScale);
          const gl = canvas.getContext("webgl2", {
            alpha: true,
            antialias: false,
            preserveDrawingBuffer: true,
          });
          if (!gl) throw new Error("WebGL 2 benchmark context is unavailable.");

          const compile = (type: number, source: string) => {
            const shader = gl.createShader(type);
            if (!shader)
              throw new Error("Unable to allocate benchmark shader.");
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
              throw new Error(
                gl.getShaderInfoLog(shader) ?? "Benchmark shader failed.",
              );
            }
            return shader;
          };
          const program = gl.createProgram();
          if (!program)
            throw new Error("Unable to allocate benchmark program.");
          gl.attachShader(
            program,
            compile(
              gl.VERTEX_SHADER,
              `#version 300 es
              precision highp float;
              layout(location = 0) in vec2 blade;
              uniform float progress;
              void main() {
                int column = gl_InstanceID % 200;
                int row = gl_InstanceID / 200;
                vec2 base = vec2(float(column) / 100.0 - 1.0, float(row) / 100.0 - 0.8);
                float phase = progress * 6.2831853 + float(gl_InstanceID % 173) * 0.071;
                float bend = sin(phase) * blade.y * blade.y * 0.018;
                gl_Position = vec4(base.x + blade.x * 0.003 + bend, base.y + blade.y * 0.025, 0.0, 1.0);
              }`,
            ),
          );
          gl.attachShader(
            program,
            compile(
              gl.FRAGMENT_SHADER,
              `#version 300 es
              precision highp float;
              out vec4 color;
              void main() { color = vec4(0.27, 0.76, 0.29, 1.0); }`,
            ),
          );
          gl.linkProgram(program);
          if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(
              gl.getProgramInfoLog(program) ?? "Benchmark program failed.",
            );
          }
          gl.useProgram(program);
          gl.uniform1f(gl.getUniformLocation(program, "progress"), 0.375);

          const resolution = 8;
          const vertices: number[] = [];
          for (let segment = 0; segment < resolution; segment += 1) {
            const bottom = segment / resolution;
            const top = (segment + 1) / resolution;
            const bottomWidth = (1 - bottom) * 0.5;
            const topWidth = (1 - top) * 0.5;
            vertices.push(
              -bottomWidth,
              bottom,
              bottomWidth,
              bottom,
              -topWidth,
              top,
              -topWidth,
              top,
              bottomWidth,
              bottom,
              topWidth,
              top,
            );
          }
          const buffer = gl.createBuffer();
          if (!buffer) throw new Error("Unable to allocate benchmark buffer.");
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(vertices),
            gl.STATIC_DRAW,
          );
          gl.enableVertexAttribArray(0);
          gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
          gl.viewport(0, 0, canvas.width, canvas.height);
          gl.clearColor(0.02, 0.05, 0.03, 1);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          gl.drawArraysInstanced(
            gl.TRIANGLES,
            0,
            vertices.length / 2,
            bladeCount,
          );
          const pixels = new Uint8Array(canvas.width * canvas.height * 4);
          gl.readPixels(
            0,
            0,
            canvas.width,
            canvas.height,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            pixels,
          );
          gl.deleteBuffer(buffer);
          gl.deleteProgram(program);
          return JSON.stringify({
            bladeCount,
            field: "instanced-seamless-wind",
            renderScale,
            resolution,
          });
        }, workload);
      },
    },
  },
} satisfies ToolcraftKernelBenchmarkHarnessRegistry;

export const appKernelBenchmarks =
  appKernelBenchmarksBase satisfies ToolcraftKernelBenchmarkHarnessRegistry;
