import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { getGlobeLogoAsset } from "./globe-logo-assets";

describe("landing globe logo assets", () => {
  it.each([
    {
      id: "dxc" as const,
      label: "easyJet",
      width: 267,
      height: 60,
      pathCount: 7,
      pathDigest: "ab3927f789dc27f30f9a23ffa21570651388419816317a403d7f4933f0a09241",
    },
    {
      id: "meta" as const,
      label: "Novo Nordisk",
      width: 128,
      height: 90,
      pathCount: 15,
      pathDigest: "d70be976a9c4523d58c16329e7b522a0ca49edddcc188f60ab4360b0893e0118",
    },
    {
      id: "zillow" as const,
      label: "Ubisoft",
      width: 224,
      height: 60,
      pathCount: 2,
      pathDigest: "c7ed788a0c92cbb614e1b8ff08accce8a313f237c969742c30e13b42698a6e57",
    },
  ])("preserves supplied $label SVG geometry and proportions in its band slot", ({
    id, label, width, height, pathCount, pathDigest,
  }) => {
    const asset = getGlobeLogoAsset(id);

    expect(asset).toMatchObject({
      aspectRatio: width / height,
      height,
      id,
      label,
      width,
    });
    expect(asset?.paths).toHaveLength(pathCount);
    expect(createHash("sha256").update(asset!.paths.join("\n")).digest("hex"))
      .toBe(pathDigest);
  });
});
