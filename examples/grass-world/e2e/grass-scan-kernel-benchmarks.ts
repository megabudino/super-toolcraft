import type {
  ToolcraftKernelBenchmarkHarnessRegistry,
  ToolcraftKernelCandidateHarness,
} from "./kernel-benchmark-contract";

function createScanLayoutHarness(
  countDimension: string,
  field: string,
): ToolcraftKernelCandidateHarness {
  return {
    iterations: 2,
    async run({ page, workload }) {
      return page.evaluate(
        ({ countDimension: dimension, field: layer, workload: currentWorkload }) => {
          const count = Math.max(
            0,
            Math.min(1000, Math.trunc(currentWorkload[dimension] ?? 0)),
          );
          const detail = Math.max(
            1,
            Math.min(
              6,
              Math.trunc(currentWorkload["terrain-octaves"] ?? 1),
            ),
          );
          const transforms = new Float32Array(count * 4);
          const divisor = Math.max(1, count);
          for (let index = 0; index < count; index += 1) {
            const angle = index * 2.399963229728653;
            const radius = Math.sqrt((index + 0.5) / divisor) * 4.8;
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
            transforms[index * 4] = x;
            transforms[index * 4 + 1] = height / normalization;
            transforms[index * 4 + 2] = z;
            transforms[index * 4 + 3] = 0.82 + ((index * 29) % 37) / 100;
          }
          const canvas = document.createElement("canvas");
          const gl = canvas.getContext("webgl2");
          if (!gl) throw new Error("WebGL 2 benchmark context is unavailable.");
          const buffer = gl.createBuffer();
          if (!buffer) throw new Error("Unable to allocate scan layout buffer.");
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.bufferData(gl.ARRAY_BUFFER, transforms, gl.STATIC_DRAW);
          gl.deleteBuffer(buffer);
          return JSON.stringify({ count, detail, field: layer });
        },
        { countDimension, field, workload },
      );
    },
  };
}

export const grassScanKernelBenchmarks = {
  "grass-rock-layout-build": {
    webgl: createScanLayoutHarness("rock-scan-count", "exact-rock-layout"),
  },
  "grass-tufted-layout-build": {
    webgl: createScanLayoutHarness("tufted-scan-count", "exact-tufted-layout"),
  },
  "grass-white-layout-build": {
    webgl: createScanLayoutHarness("white-flower-count", "exact-white-layout"),
  },
  "grass-wild-layout-build": {
    webgl: createScanLayoutHarness("wild-scan-count", "exact-wild-layout"),
  },
  "grass-yellow-layout-build": {
    webgl: createScanLayoutHarness("yellow-flower-count", "exact-yellow-layout"),
  },
} satisfies ToolcraftKernelBenchmarkHarnessRegistry;
