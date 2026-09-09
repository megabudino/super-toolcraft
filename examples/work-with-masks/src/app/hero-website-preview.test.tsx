import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { appComposition } from "./app-composition";
import { HeroWebsitePreviewFrame } from "./hero-website-preview";

describe("HeroWebsitePreview", () => {
  it("renders local header and hero components without an iframe or source server", () => {
    const markup = renderToStaticMarkup(<HeroWebsitePreviewFrame />);
    expect(markup).toContain('data-toolcraft-product-output="percents-hero-preview"');
    expect(markup).toContain('data-percents-native-section=""');
    expect(markup).toContain("Get Noticed.");
    expect(markup).toContain("Keep Growing.");
    expect(markup).toContain("See the story");
    expect(markup).toContain('aria-label="Fold Studio"');
    expect(markup).toContain('fold-studio-logo.svg');
    expect(markup).toContain("/images/home/hero/online-shopping.jpg");
    expect(markup).not.toContain("<video");
    expect(markup).not.toContain("hero-dev-9");
    expect(markup).not.toContain("Be Chosen.");
    expect(markup).not.toContain("meetpercents");
    expect(markup).not.toContain("<iframe");
    expect(markup).not.toContain("localhost:3000");
    expect(markup).not.toContain("postMessage");
  });

  it("layers the original background, wave, and existing hero foreground", () => {
    const markup = renderToStaticMarkup(
      <HeroWebsitePreviewFrame
        waveLayer={<div data-testid="ribbed-wave-layer" />}
      />,
    );
    const baseIndex = markup.indexOf('data-testid="hero-base-layer"');
    const waveIndex = markup.indexOf('data-testid="ribbed-wave-layer"');
    const frameIndex = markup.indexOf('data-testid="hero-native-foreground"');

    expect(baseIndex).toBeGreaterThan(-1);
    expect(waveIndex).toBeGreaterThan(baseIndex);
    expect(frameIndex).toBeGreaterThan(waveIndex);
  });

  it("uses one website preview for the fixed 2400 by 1200 canvas", () => {
    expect(appComposition.canvasContent).toBeDefined();
    expect(appComposition.infiniteCanvasContent).toBeUndefined();
    expect(appComposition.schema.canvas.size).toEqual({
      height: 1200,
      unit: "px",
      width: 2400,
    });
    expect(appComposition.schema.persistence).toMatchObject({
      key: "toolcraft:work-with-masks-hero:state:v2",
      storage: "localStorage",
    });
  });
});
