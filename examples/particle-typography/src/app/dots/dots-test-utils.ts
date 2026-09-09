import { vi } from "vitest";

export function installOpaqueMaskDocument(): void {
  vi.stubGlobal("document", {
    createElement: () => {
      const canvas = {
        height: 0,
        width: 0,
        getContext: () => ({
          fillStyle: "#FFFFFF",
          font: "",
          textAlign: "left",
          textBaseline: "middle",
          fillText: () => undefined,
          getImageData: () => {
            const data = new Uint8ClampedArray(
              canvas.width * canvas.height * 4,
            );
            for (let y = 20; y < canvas.height - 20; y += 1) {
              for (let x = 20; x < canvas.width - 20; x += 1) {
                data[(y * canvas.width + x) * 4 + 3] = 255;
              }
            }
            return { data };
          },
          measureText: () => ({ width: 96 }),
          restore: () => undefined,
          save: () => undefined,
          scale: () => undefined,
          translate: () => undefined,
        }),
      };
      return canvas;
    },
  });
}
