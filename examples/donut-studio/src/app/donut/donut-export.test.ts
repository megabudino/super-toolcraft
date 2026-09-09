import { describe, expect, it } from "vitest";

import {
  getDonutExportFileName,
  resolveDonutImageFormat,
} from "./donut-export";

describe("donut image export", () => {
  it("resolves PNG with alpha and JPEG with an opaque composite", () => {
    expect(resolveDonutImageFormat("png")).toEqual({
      extension: "png",
      mimeType: "image/png",
      requiresBackground: false,
    });
    expect(resolveDonutImageFormat("jpg")).toEqual({
      extension: "jpg",
      mimeType: "image/jpeg",
      requiresBackground: true,
    });
    expect(resolveDonutImageFormat("gif")).toEqual(
      resolveDonutImageFormat("png"),
    );
  });

  it("uses a stable product file name", () => {
    expect(getDonutExportFileName("png")).toBe("donut-studio.png");
    expect(getDonutExportFileName("jpg")).toBe("donut-studio.jpg");
  });
});
