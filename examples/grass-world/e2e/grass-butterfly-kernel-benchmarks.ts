import type { ToolcraftKernelBenchmarkHarnessRegistry } from "./kernel-benchmark-contract";

export const grassButterflyKernelBenchmarks = {
  "grass-butterfly-layout-build": {
    webgl: {
      iterations: 2,
      async run({ page, workload }) {
        return page.evaluate((currentWorkload) => {
          const count = Math.max(
            0,
            Math.min(
              64,
              Math.trunc(currentWorkload["butterfly-count"] ?? 0),
            ),
          );
          const detail = Math.max(
            1,
            Math.min(
              6,
              Math.trunc(currentWorkload["terrain-octaves"] ?? 1),
            ),
          );
          const attributes = new Float32Array(count * 8);
          const divisor = Math.max(1, count);

          for (let index = 0; index < count; index += 1) {
            const angle = index * 2.399963229728653;
            const radius = Math.sqrt((index + 0.5) / divisor) * 3.4;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius * 0.64;
            let amplitude = 1;
            let frequency = 1;
            let normalization = 0;
            let height = 0;

            for (let octave = 0; octave < detail; octave += 1) {
              height +=
                Math.sin((x * 0.37 + z * 0.21) * frequency + octave) *
                amplitude;
              normalization += amplitude;
              amplitude *= 0.52;
              frequency *= 2;
            }

            const offset = index * 8;
            attributes[offset] = x;
            attributes[offset + 1] = height / normalization;
            attributes[offset + 2] = z;
            attributes[offset + 3] = (index * 0.6180339887498948) % 1;
            attributes[offset + 4] = (index * 29) % 8;
            attributes[offset + 5] = angle;
            attributes[offset + 6] = 0.025 + ((index * 17) % 56) / 1_000;
            attributes[offset + 7] = ((index * 37) % 101) / 100;
          }

          const canvas = document.createElement("canvas");
          const gl = canvas.getContext("webgl2");
          if (!gl) throw new Error("WebGL 2 benchmark context is unavailable.");
          const buffer = gl.createBuffer();
          if (!buffer)
            throw new Error("Unable to allocate butterfly layout buffer.");
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.bufferData(gl.ARRAY_BUFFER, attributes, gl.STATIC_DRAW);
          gl.deleteBuffer(buffer);

          return JSON.stringify({
            count,
            detail,
            field: "terrain-aware-butterfly-layout",
          });
        }, workload);
      },
    },
  },
} satisfies ToolcraftKernelBenchmarkHarnessRegistry;
