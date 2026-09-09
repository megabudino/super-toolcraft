import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

for (const base of ["/", "/demos/micrographics/"]) {
  test(`cover presets load under deployment base ${base}`, async () => {
    vi.stubEnv("BASE_URL", base);
    vi.resetModules();
    const { micrographCoverPresets, coverPresetSrc } = await import("./template-covers");
    expect(micrographCoverPresets).toHaveLength(8);
    for (const preset of micrographCoverPresets) {
      expect(preset.src.startsWith(`${base}covers/`)).toBe(true);
      expect(coverPresetSrc(preset.id)).toBe(preset.src);
    }
    expect(coverPresetSrc("unknown")).toBe(`${base}covers/runner-close-crop.jpg`);
  });
}
