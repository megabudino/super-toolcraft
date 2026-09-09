import type { ToolcraftKernelBenchmarkHarnessRegistry } from "./kernel-benchmark-contract";

export const appKernelBenchmarks = {
  "poster-scene": {
    svg: {
      iterations: 24,
      run: async ({ page, workload }) =>
        page.evaluate(
          ({ elementCount, tierWeight }) => {
            const parts: string[] = [];

            for (let element = 0; element < elementCount; element += 1) {
              parts.push(`<g data-element="${element}">`);
              for (let mark = 0; mark < tierWeight * 24; mark += 1) {
                const x = (mark * 17 + element * 29) % 100;
                const y = (mark * 31 + element * 13) % 100;
                parts.push(
                  `<line x1="${x}" y1="${y}" x2="${(x + 11) % 100}" y2="${(y + 7) % 100}"/>`,
                );
              }
              parts.push("</g>");
            }

            return parts.join("");
          },
          {
            elementCount: workload["element-count"] ?? 3,
            tierWeight: workload["template-tier-weight"] ?? 2,
          },
        ),
    },
  },
} satisfies ToolcraftKernelBenchmarkHarnessRegistry;
