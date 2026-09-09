import type { Locator, Page } from "@playwright/test";

import {
  createToolcraftBrowserProofSession,
  readToolcraftBrowserObservation,
  type ToolcraftBrowserObservation,
  type ToolcraftBrowserProofSession,
} from "./browser-proof-session";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { dragToolcraftSliderByTarget } from "./performance-slider-helpers";
import { expect, test } from "./toolcraft-product-test";
import { installNativeHeroFixture } from "./product-native-hero-fixture";

const heroPreviewFrameSelector = '[data-percents-native-section]';

const targets = {
  bodyTypography: "hero.body.typography",
  copyToLogos: "hero.layout.copyToLogos",
  headingTypography: "hero.heading.typography",
  leadTypography: "hero.lead.typography",
  logosToMedia: "hero.layout.logosToMedia",
  offsetY: "hero.rightLayout.offsetY",
  paragraphGap: "hero.rightLayout.paragraphGap",
  topInset: "hero.layout.topInset",
} as const;

type TextStyleObservation = {
  color: string;
  fontSize: number;
  fontWeight: string;
  letterSpacingEm: number;
  lineHeightRatio: number;
  opacity: number;
  textTransform: string;
  usesDmSans: boolean;
};

type HeroStyleObservation = {
  body: TextStyleObservation;
  heading: TextStyleObservation;
  lead: TextStyleObservation;
};

async function createHeroPreviewSession(page: Page) {
  await installNativeHeroFixture(page);
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  const pause = page.getByLabel("Pause playback", { exact: true });
  if ((await pause.count()) === 1 && (await pause.isVisible())) {
    await pause.click();
    await expect(page.getByLabel("Play playback", { exact: true })).toBeVisible();
  }
  await expect(
    page.locator(heroPreviewFrameSelector).locator("[data-toolcraft-hero-heading]"),
  ).toBeVisible();
  const previewVideo = page.locator(heroPreviewFrameSelector).locator("video");
  await previewVideo.evaluate(async (node) => {
    if (!(node instanceof HTMLVideoElement)) {
      throw new Error("The hero preview media must be a video element.");
    }
    if (node.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      await new Promise<void>((resolve) => {
        node.addEventListener("loadeddata", () => resolve(), { once: true });
      });
    }
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  });
  await expect(previewVideo).toHaveJSProperty("paused", true);

  const styles = session.observe<HeroStyleObservation>((root) => {
    const readText = (selector: string): TextStyleObservation => {
      const element = root.querySelector(selector);
      if (!(element instanceof HTMLElement)) throw new Error("Missing native hero text.");
      const computed = getComputedStyle(element);
      const fontSize = Number.parseFloat(computed.fontSize);
      const tracking = computed.letterSpacing === "normal" ? 0 : Number.parseFloat(computed.letterSpacing);
      return {
        color: computed.color, fontSize, fontWeight: computed.fontWeight,
        textTransform: computed.textTransform, opacity: Number(computed.opacity),
        letterSpacingEm: Number((tracking / fontSize).toFixed(3)),
        lineHeightRatio: Number((Number.parseFloat(computed.lineHeight) / fontSize).toFixed(3)),
        usesDmSans: computed.fontFamily.includes("DM Sans"),
      };
    };
    return {
      heading: readText("[data-toolcraft-hero-heading]"),
      lead: readText("[data-toolcraft-hero-right-lead]"),
      body: readText("[data-toolcraft-hero-right-body]"),
    };
  });

  return { session, styles };
}

async function selectStaticOption(control: Locator, page: Page, ariaLabel: string, option: string) {
  await control.getByLabel(ariaLabel).click();
  const items = page.locator('[data-slot="select-content"]:visible [data-slot="select-item"]');
  await expect(items.first()).toBeVisible();
  const labels = (await items.allTextContents()).map((label) => label.trim());
  const optionIndex = labels.indexOf(option);
  if (optionIndex < 0) {
    throw new Error(`Missing ${ariaLabel} option ${option}; found ${labels.join(", ")}.`);
  }
  await items.nth(optionIndex).click();
}

async function selectFont(control: Locator, page: Page, label: string) {
  await control.getByRole("button", { name: `Select ${label}` }).click();
  await page.getByPlaceholder("Find font").fill("DM Sans");
  await page
    .locator('[data-slot="font-picker-list"] button')
    .filter({ hasText: "DM Sans" })
    .click();
  await page.keyboard.press("Escape");
}

async function changeFontFooterSlider(
  control: Locator,
  page: Page,
  label: string,
  sliderName: string,
) {
  const trigger = control.getByRole("button", { name: `Select ${label}` });
  if ((await trigger.getAttribute("aria-expanded")) === "true") {
    await page.keyboard.press("Escape");
  }
  await trigger.click();
  const popover = page.locator('[data-slot="popover-content"]:visible');
  await expect(popover).toBeVisible();
  const sliders = popover.locator('[data-slot="font-picker-footer-slider"] [data-slot="slider"]');
  await expect(sliders).toHaveCount(2);
  const slider = sliders.nth(sliderName === "Letter spacing" ? 0 : 1);
  const thumb = slider.locator('[data-slot="slider-thumb"]');
  const box = await slider.boundingBox();
  if (!box) throw new Error(`Could not measure ${sliderName}.`);
  await slider.click({ position: { x: box.width - 1, y: box.height / 2 } });
  await expect(thumb).toBeVisible();
  await page.keyboard.press("Escape");
}

async function proveFontPicker(
  session: ToolcraftBrowserProofSession,
  styles: ToolcraftBrowserObservation<HeroStyleObservation>,
  target: string,
  requirementId: string,
  label: string,
  key: keyof HeroStyleObservation,
) {
  let current = await readToolcraftBrowserObservation(styles);

  const prove = async (
    part: string,
    nextStyle: Partial<TextStyleObservation>,
    run: (control: Locator, page: Page) => Promise<void>,
  ) => {
    const expected = {
      ...current,
      [key]: { ...current[key], ...nextStyle },
    };
    await expectToolcraftCompoundControlPartOutcome(
      styles,
      session.targetAction(target, page => run(
        page.locator(`[data-toolcraft-control-target="${target}"]`), page,
      )),
      expected,
      // These observations are synchronous CSS values, not animated pixels.
      // Keep the protected repeated stability assertions without idle intervals.
      { part, requirementId, stabilityIntervalMs: 0 },
    );
    current = expected;
  };

  await prove("fontPicker.fontId", { usesDmSans: true }, (control, page) =>
    selectFont(control, page, label),
  );
  await prove("fontPicker.fontWeight", { fontWeight: "700" }, (control, page) =>
    selectStaticOption(control, page, "Font weight", "700"),
  );
  await prove("fontPicker.fontSize", { fontSize: 118 }, async (control) => {
    const input = control.getByLabel("Font size");
    await input.fill("118");
    await input.press("Enter");
  });
  await prove("fontPicker.letterSpacing", { letterSpacingEm: 0.1 }, (control, page) =>
    changeFontFooterSlider(control, page, label, "Letter spacing"),
  );
  await prove("fontPicker.lineHeight", { lineHeightRatio: 2 }, (control, page) =>
    changeFontFooterSlider(control, page, label, "Line height"),
  );
  await prove("fontPicker.textCase", { textTransform: "capitalize" }, (control, page) =>
    selectStaticOption(control, page, "Text case", "Title Case"),
  );
  await prove("fontPicker.color", { color: "rgb(255, 0, 0)" }, async (control) => {
    const input = control.getByLabel("Color hex");
    await input.fill("#FF0000");
    await input.press("Enter");
  });
  await prove("fontPicker.opacity", { opacity: 0.55 }, async (control) => {
    const input = control.getByLabel("Color opacity");
    await input.fill("55");
    await input.press("Enter");
  });

  await expectToolcraftProductObservableToChange(
    session,
    session.targetAction(target, async (page) => {
      const control = page.locator(`[data-toolcraft-control-target="${target}"]`);
      const input = control.getByLabel("Font size");
      await input.fill("120");
      await input.press("Enter");
    }),
    {
      requirementId,
      selector: key === "heading" ? "[data-toolcraft-hero-heading]"
        : key === "lead" ? "[data-toolcraft-hero-right-lead]" : "[data-toolcraft-hero-right-body]",
    },
  );
}

async function proveSlider(
  page: Page,
  session: ToolcraftBrowserProofSession,
  target: string,
  requirementId: string,
  targetRatio: number,
) {
  await expectToolcraftProductObservableToChange(
    session,
    session.targetAction(target, async (currentPage) => {
      const control = currentPage.locator(`[data-toolcraft-control-target="${target}"]`);
      await control.scrollIntoViewIfNeeded();
      await dragToolcraftSliderByTarget(currentPage, target, targetRatio);
    }),
    {
      requirementId,
      selector: '[data-toolcraft-product-output="percents-hero-preview"]',
    },
  );
  await expect(page.locator(`[data-toolcraft-control-target="${target}"]`)).toBeVisible();
}

test("browser hero preview: heading typography updates the native preview", async ({ page }) => {
  const { session, styles } = await createHeroPreviewSession(page);
  await proveFontPicker(
    session,
    styles,
    targets.headingTypography,
    "hero.heading.typography",
    "Heading type",
    "heading",
  );
});

test("browser hero preview: top inset updates the native preview", async ({ page }) => {
  const { session } = await createHeroPreviewSession(page);
  await proveSlider(page, session, targets.topInset, "hero.layout.top-inset", 0.78);
});

test("browser hero preview: copy to logos spacing updates the native preview", async ({ page }) => {
  const { session } = await createHeroPreviewSession(page);
  await proveSlider(page, session, targets.copyToLogos, "hero.layout.copy-to-logos", 0.82);
});

test("browser hero preview: logos to media spacing updates the native preview", async ({ page }) => {
  const { session } = await createHeroPreviewSession(page);
  await proveSlider(page, session, targets.logosToMedia, "hero.layout.logos-to-media", 0.76);
});

test("browser hero preview: right lead typography updates the native preview", async ({ page }) => {
  const { session, styles } = await createHeroPreviewSession(page);
  await proveFontPicker(
    session,
    styles,
    targets.leadTypography,
    "hero.right.lead-typography",
    "Lead type",
    "lead",
  );
});

test("browser hero preview: right body typography updates the native preview", async ({ page }) => {
  const { session, styles } = await createHeroPreviewSession(page);
  await proveFontPicker(
    session,
    styles,
    targets.bodyTypography,
    "hero.right.body-typography",
    "Body type",
    "body",
  );
});

test("browser hero preview: right block offset updates the native preview", async ({ page }) => {
  const { session } = await createHeroPreviewSession(page);
  await proveSlider(page, session, targets.offsetY, "hero.right.offset-y", 0.72);
});

test("browser hero preview: right paragraph gap updates the native preview", async ({ page }) => {
  const { session } = await createHeroPreviewSession(page);
  await proveSlider(page, session, targets.paragraphGap, "hero.right.paragraph-gap", 0.74);
});

test("browser hero preview: fixed canvas preserves its output size", async ({ page }) => {
  const { session } = await createHeroPreviewSession(page);
  const foreground = page.locator(heroPreviewFrameSelector);
  await expect(foreground).toBeVisible();
  const canvas = page.locator("[data-toolcraft-editable-canvas]");
  await expect(canvas).toHaveCSS("width", "2400px");
  await expect(canvas).toHaveCSS("height", "1200px");

  await expectToolcraftProductObservableToChange(
    session,
    session.targetAction("canvas.fixed-output", async (currentPage) => {
      await currentPage.getByLabel("Zoom in").click();
    }),
    {
      requirementId: "hero.canvas.fixed-size",
      selector: '[data-toolcraft-product-output="percents-hero-preview"]',
    },
  );

  await expect(canvas).toHaveCSS("width", "2400px");
  await expect(canvas).toHaveCSS("height", "1200px");
});
