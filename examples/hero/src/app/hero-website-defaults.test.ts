import { describe, expect, it } from "vitest";

import { createToolcraftState } from "@/toolcraft/runtime/state/create-template-state";
import websiteDefaults from "@/section/components/pages/home/hero-applied-settings.json";
import { normalizeHeroSceneSettings } from "@/section/components/pages/home/hero-scene-settings";

import { appSchema } from "./app-schema";
import {
  createHeroPreviewSettingsFromValues,
  HERO_PREVIEW_DEFAULTS,
} from "./hero-preview-protocol";
import { HERO_WEBSITE_DEFAULTS } from "./hero-website-defaults";

describe("Hero website default parity", () => {
  it("matches the website snapshot through resolved Toolcraft defaults", () => {
    const state = createToolcraftState(appSchema);

    // The native schema omits legacy edgeBlur and the optional zero pan-turn count.
    // Compare the renderer's resolved values so their fallback behavior stays covered.
    expect(resolveRendererDefaults(HERO_WEBSITE_DEFAULTS)).toEqual(
      resolveRendererDefaults(websiteDefaults),
    );
    expect(HERO_PREVIEW_DEFAULTS).toEqual(HERO_WEBSITE_DEFAULTS);
    expect(createHeroPreviewSettingsFromValues({})).toEqual(
      HERO_WEBSITE_DEFAULTS,
    );
    expect(createHeroPreviewSettingsFromValues(state.defaults)).toEqual(
      HERO_WEBSITE_DEFAULTS,
    );
    expect(appSchema.persistence).toMatchObject({
      key: "toolcraft:recraft-hero:state:v1",
      storage: "localStorage",
      version: 1,
    });
  });
});

function resolveRendererDefaults(value: unknown) {
  const settings = normalizeHeroSceneSettings(value);
  if (!settings) throw new Error("Expected valid authored Hero settings.");
  settings.gallery.sphere.pan.turns ??= 0;
  return settings;
}
