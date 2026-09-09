import { describe, expect, it } from "vitest";
import { heroPreviewDefaults, heroPreviewTargets } from "./hero-preview-controls";
import { createHeroPreviewSettings } from "./hero-preview-settings";
import { getHeroPreviewStyle } from "./hero-preview-style";

describe("hero preview settings", () => {
  it("serializes all canonical defaults into native website settings", () => {
    const message = createHeroPreviewSettings({});

    expect(message).toMatchObject({
      headingTypography: {
        family: "Figtree",
        ...heroPreviewDefaults.headingTypography,
      },
      layout: {
        copyToLogos: heroPreviewDefaults.copyToLogos,
        logosToMedia: heroPreviewDefaults.logosToMedia,
        topInset: heroPreviewDefaults.topInset,
      },
      right: {
        bodyTypography: {
          family: "Inter",
          ...heroPreviewDefaults.bodyTypography,
        },
        leadTypography: {
          family: "Inter",
          ...heroPreviewDefaults.leadTypography,
        },
        offsetY: heroPreviewDefaults.offsetY,
        paragraphGap: heroPreviewDefaults.paragraphGap,
      },
    });
    expect(message.headingTypography.stylesheetHref).toBeUndefined();
    expect(message.right.leadTypography.stylesheetHref).toBeUndefined();
  });

  it("resolves a selected catalog font and safely falls back invalid runtime values", () => {
    const message = createHeroPreviewSettings({
      [heroPreviewTargets.bodyTypography]: {
        ...heroPreviewDefaults.bodyTypography,
        fontId: "dm-sans",
        fontSize: 34,
        opacity: 72,
      },
      [heroPreviewTargets.copyToLogos]: Number.POSITIVE_INFINITY,
      [heroPreviewTargets.offsetY]: "invalid",
    });

    expect(message.right.bodyTypography).toMatchObject({
      family: "DM Sans",
      fontId: "dm-sans",
      fontSize: 34,
      opacity: 72,
    });
    expect(message.right.bodyTypography.stylesheetHref).toMatch(
      /^https:\/\/fonts\.googleapis\.com\/css2\?family=DM\+Sans:wght@/,
    );
    expect(message.layout.copyToLogos).toBe(heroPreviewDefaults.copyToLogos);
    expect(message.right.offsetY).toBe(heroPreviewDefaults.offsetY);
  });

  it("contains no Apply or source-writing command", () => {
    const serialized = JSON.stringify(createHeroPreviewSettings({}));

    expect(serialized).not.toContain("Apply");
    expect(serialized).not.toContain("postMessage.apply");
    expect(serialized).not.toContain("writeSource");
  });

  it("maps canonical settings to the actual source CSS variables", () => {
    const style = getHeroPreviewStyle(createHeroPreviewSettings({}));
    expect(style["--toolcraft-hero-heading-font-size"]).toBe("102px");
    expect(style["--toolcraft-hero-heading-font-family"]).toBe("var(--font-heading)");
    expect(style["--toolcraft-hero-top-inset"]).toBe("220px");
    expect(style["--toolcraft-hero-right-body-font-size"]).toBe("26px");
  });
});
