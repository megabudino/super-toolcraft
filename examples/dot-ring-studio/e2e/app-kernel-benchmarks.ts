import type { ToolcraftKernelBenchmarkHarnessRegistry } from "./kernel-benchmark-contract";

function semanticOutput(workload: Readonly<Record<string, number>>): string {
  const density = Math.max(1, Math.round(workload["ring-density"] ?? 160));
  const rows = Math.max(1, Math.round(workload["ring-rows"] ?? 1));
  return `dot-ring:beads:${density * rows}:canvas:512`;
}

export const appKernelBenchmarks = {
  "dot-ring.preview-frame": {
    "canvas-2d": {
      iterations: 12,
      run: async ({ page, workload }) => {
        await page.evaluate(
          ({ density, rows }) => {
            const canvas = document.createElement("canvas");
            canvas.width = 512;
            canvas.height = 512;
            const context = canvas.getContext("2d");
            if (!context) {
              throw new Error(
                "Canvas 2D is unavailable for the dot-ring benchmark.",
              );
            }

            context.fillStyle = "#dfff1a";
            context.shadowBlur = 4;
            context.shadowColor = "#dfff1a";
            for (let row = 0; row < rows; row += 1) {
              const radius = 150 + row * 3;
              for (let index = 0; index < density; index += 1) {
                const angle = (index / density) * Math.PI * 2;
                const displacement =
                  Math.sin(angle * 12 + row * 0.31) * 24 +
                  Math.cos(angle * 26) * 8;
                const x = 256 + Math.cos(angle) * (radius + displacement);
                const y = 256 + Math.sin(angle) * (radius + displacement);
                context.beginPath();
                context.arc(x, y, 2.4, 0, Math.PI * 2);
                context.fill();
              }
            }
            context.getImageData(0, 0, 1, 1);
          },
          {
            density: Math.max(
              1,
              Math.round(workload["ring-density"] ?? 160),
            ),
            rows: Math.max(1, Math.round(workload["ring-rows"] ?? 1)),
          },
        );
        return semanticOutput(workload);
      },
    },
  },
} satisfies ToolcraftKernelBenchmarkHarnessRegistry;
