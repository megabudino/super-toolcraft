import { stat } from "node:fs/promises";

import type { Download, Locator } from "@playwright/test";

import { dotsBrowserTestName } from "../src/app/dots/dots-acceptance";
import { expectToolcraftAcceptanceOutcome } from "./browser-acceptance-outcome-helpers";
import {
  createToolcraftBrowserProofSession,
  readToolcraftBrowserObservation,
} from "./browser-proof-session";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import {
  chooseOption,
  ensureTimelineVisible,
  expectSimpleControlChange,
  outputSelector,
  pausePlayback,
  selectFiniteCanvas,
  setSlider,
  type ProductPage,
  type ProofSession,
} from "./dots-acceptance-support";
import {
  expectToolcraftDiscreteSliderMarkers,
  expectToolcraftSegmentedControlCellsPreservePadding,
} from "./performance-control-layout-helpers";
import { expect, test } from "./toolcraft-product-test";

async function openProof(page: ProductPage): Promise<ProofSession> {
  page.setDefaultTimeout(12_000);
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await selectFiniteCanvas(page);
  await pausePlayback(page);
  await expect(page.locator(outputSelector)).toBeVisible();
  return createToolcraftBrowserProofSession(page);
}

async function proveTextInput(
  session: ProofSession,
  target: string,
  value: string,
): Promise<void> {
  await expectSimpleControlChange(session, target, async (control) => {
    const input = control.locator("input");
    await input.fill(value);
    await input.press("Enter");
  });
}

test.setTimeout(180_000);

test(dotsBrowserTestName("runtime.settingsTransfer"), async ({ page }) => {
  await openProof(page);
  const output = page.locator(outputSelector);
  let settingsBytes = 0;
  let settingsDownload: Download | undefined;
  await expectToolcraftAcceptanceOutcome(
    async () => settingsBytes,
    async () => {
      const pending = page.waitForEvent("download");
      await page.getByRole("button", { name: "Export Settings" }).click();
      settingsDownload = await pending;
      const path = await settingsDownload.path();
      settingsBytes = path ? (await stat(path)).size : 0;
    },
    {
      evidenceType: "command-side-effect",
      requirementId: "runtime.settingsTransfer",
      stabilityIntervalMs: 0,
    },
  );
  expect(settingsBytes).toBeGreaterThan(100);
  await page
    .locator('[data-toolcraft-control-target="text.content"] input')
    .fill("IMPORT");
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import Settings" }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles((await settingsDownload!.path())!);
  await expect(output).toHaveAttribute("data-dot-text", "Hi!");
});

test(dotsBrowserTestName("panels.timeline.extended"), async ({ page }) => {
  await openProof(page);
  await expectToolcraftAcceptanceOutcome(
    async () =>
      page.getByRole("slider", { name: "Playback position" }).count(),
    async () => ensureTimelineVisible(page),
    {
      evidenceType: "command-side-effect",
      requirementId: "panels.timeline.extended",
      stabilityIntervalMs: 0,
    },
  );
});

test(dotsBrowserTestName("canvas.aspectRatio"), async ({ page }) => {
  const session = await openProof(page);
  await expectSimpleControlChange(
    session,
    "canvas.aspectRatio",
    (control, currentPage) => chooseOption(currentPage, control, "16:9"),
  );
});

for (const [target, value] of [
  ["canvas.size.width", "960"],
  ["canvas.size.height", "1200"],
] as const) {
  test(dotsBrowserTestName(target), async ({ page }) => {
    const session = await openProof(page);
    await proveTextInput(session, target, value);
  });
}

test(dotsBrowserTestName("canvas.renderScale"), async ({ page }) => {
  const session = await openProof(page);
  await expectSimpleControlChange(session, "canvas.renderScale", (control) =>
    setSlider(control, 1.25),
  );
  await expectToolcraftDiscreteSliderMarkers(page, "canvas.renderScale");
});

test(dotsBrowserTestName("text.content"), async ({ page }) => {
  const session = await openProof(page);
  await expectSimpleControlChange(session, "text.content", (control) =>
    control.locator("input").fill("FLOW"),
  );
});

for (const [target, label, groupLabel] of [
  ["particles.distribution", "Fill", "Shape fill"],
  ["particles.launch", "Scatter", "Launch"],
] as const) {
  test(dotsBrowserTestName(target), async ({ page }) => {
    const session = await openProof(page);
    await expectSimpleControlChange(session, target, (control) =>
      control.getByRole("button", { name: label, exact: true }).click(),
    );
    await expectToolcraftSegmentedControlCellsPreservePadding(
      page,
      groupLabel,
      { requirementId: target, target },
    );
  });
}

for (const [target, value] of [
  ["particles.count", 880],
  ["motion.activeDuration", 5],
  ["motion.calmDuration", 2],
  ["physics.mass", 1.4],
  ["physics.attraction", 1.05],
  ["physics.damping", 0.82],
  ["physics.turbulence", 0.7],
  ["appearance.trails", 0.42],
  ["appearance.sizeMotion", 1.12],
  ["appearance.glow", 0.62],
] as const) {
  test(dotsBrowserTestName(target), async ({ page }) => {
    const session = await openProof(page);
    await expectSimpleControlChange(session, target, (control) =>
      setSlider(control, value),
    );
  });
}

test(dotsBrowserTestName("particles.size"), async ({ page }) => {
  const session = await openProof(page);
  const observation = session.observe(
    (root) =>
      root.querySelector<HTMLElement>('[data-dots-renderer="true"]')?.dataset
        .dotSize ?? "",
  );
  await expectToolcraftCompoundControlPartOutcome(
    observation,
    session.controlAction("particles.size", (control) =>
      control.getByRole("slider").nth(0).fill("6"),
    ),
    "6:11",
    {
      requirementId: "particles.size",
      part: "rangeSlider.lower",
      stabilityIntervalMs: 40,
    },
  );
  await expectToolcraftCompoundControlPartOutcome(
    observation,
    session.controlAction("particles.size", (control) =>
      control.getByRole("slider").nth(1).fill("15"),
    ),
    "6:15",
    {
      requirementId: "particles.size",
      part: "rangeSlider.upper",
      stabilityIntervalMs: 40,
    },
  );
  await expectSimpleControlChange(session, "particles.size", (control) =>
    control.getByRole("slider").nth(0).fill("7"),
  );
});

test(dotsBrowserTestName("text.typography"), async ({ page }) => {
  const session = await openProof(page);
  const target = "text.typography";
  const observation = session.observe((root) => {
    const node = root.querySelector<HTMLElement>(
      '[data-dots-renderer="true"]',
    );
    return {
      color: node?.dataset.dotFontColor ?? "",
      family: node?.dataset.dotFontFamily ?? "",
      fontId: node?.dataset.dotFontId ?? "",
      fontSize: Number(node?.dataset.dotFontSize ?? 0),
      fontWeight: node?.dataset.dotFontWeight ?? "",
      letterSpacing: node?.dataset.dotLetterSpacing ?? "",
      lineHeight: node?.dataset.dotLineHeight ?? "",
      opacity: Number(node?.dataset.dotOpacity ?? 0),
      textCase: node?.dataset.dotTextCase ?? "",
    };
  });
  const expected = await readToolcraftBrowserObservation(observation);
  const prove = async (
    part: string,
    action: (control: Locator, page: ProductPage) => Promise<void>,
    patch: Partial<typeof expected>,
  ): Promise<void> => {
    await expectToolcraftCompoundControlPartOutcome(
      observation,
      session.controlAction(target, action),
      { ...expected, ...patch },
      { part, requirementId: target, stabilityIntervalMs: 80, timeoutMs: 20_000 },
    );
    Object.assign(expected, patch);
  };

  await prove(
    "fontPicker.fontId",
    async (control, currentPage) => {
      await control.getByRole("button", { name: "Select Typography" }).click();
      await currentPage.getByPlaceholder("Find font").fill("Roboto");
      await currentPage.getByText("Roboto", { exact: true }).last().click();
      await currentPage.keyboard.press("Escape");
    },
    { family: "Roboto", fontId: "roboto" },
  );
  await prove(
    "fontPicker.fontWeight",
    (control, currentPage) =>
      chooseOption(
        currentPage,
        control.locator('[data-slot="font-picker-weight-field"]'),
        "500",
      ),
    { fontWeight: "500" },
  );
  await prove(
    "fontPicker.fontSize",
    async (control) => {
      const input = control.getByRole("textbox", { name: "Font size" });
      await input.fill("620");
      await input.press("Enter");
    },
    { fontSize: 620 },
  );
  await prove(
    "fontPicker.textCase",
    (control, currentPage) =>
      chooseOption(
        currentPage,
        control.locator('[data-slot="font-picker-text-case-field"]'),
        "Lowercase",
      ),
    { textCase: "lowercase" },
  );
  await prove(
    "fontPicker.color",
    async (control) => {
      const input = control.getByRole("textbox", { name: "Color hex" });
      await input.fill("#66CCFF");
      await input.press("Enter");
    },
    { color: "#66CCFF" },
  );
  await prove(
    "fontPicker.opacity",
    async (control) => {
      const input = control.getByRole("textbox", { name: "Color opacity" });
      await input.fill("72");
      await input.press("Enter");
    },
    { opacity: 0.72 },
  );
  await prove(
    "fontPicker.letterSpacing",
    async (control, currentPage) => {
      const trigger = control.getByRole("button", { name: "Select Typography" });
      if ((await trigger.getAttribute("aria-expanded")) !== "true") {
        await trigger.click();
      }
      await currentPage
        .locator('input[aria-label="Letter spacing"]')
        .evaluate((node) => (node as HTMLElement).focus());
      await currentPage.keyboard.press("End");
      await currentPage.keyboard.press("Escape");
    },
    { letterSpacing: "widest" },
  );
  await prove(
    "fontPicker.lineHeight",
    async (control, currentPage) => {
      const trigger = control.getByRole("button", { name: "Select Typography" });
      if ((await trigger.getAttribute("aria-expanded")) !== "true") {
        await trigger.click();
      }
      await currentPage
        .locator('input[aria-label="Line height"]')
        .evaluate((node) => (node as HTMLElement).focus());
      await currentPage.keyboard.press("End");
      await currentPage.keyboard.press("Escape");
    },
    { lineHeight: "loose" },
  );
  await expectSimpleControlChange(session, target, async (control) => {
    const input = control.getByRole("textbox", { name: "Font size" });
    await input.fill("640");
    await input.press("Enter");
  });
});

test(dotsBrowserTestName("appearance.palette"), async ({ page }) => {
  const session = await openProof(page);
  const target = "appearance.palette";
  const observation = session.observe((root) => {
    const encoded =
      root.querySelector<HTMLElement>('[data-dots-renderer="true"]')?.dataset
        .dotGradient ?? "{}";
    const value = JSON.parse(encoded) as {
      angle: number;
      gradientType: string;
      stops: Array<{ color: string; opacity: number; position: number }>;
    };
    return {
      angle: value.angle,
      color: value.stops[0]?.color ?? "",
      gradientType: value.gradientType,
      opacity: value.stops[0]?.opacity ?? 0,
      position: value.stops[0]?.position ?? 0,
    };
  });
  const expected = await readToolcraftBrowserObservation(observation);
  const prove = async (
    part: string,
    action: (control: Locator, page: ProductPage) => Promise<void>,
    patch: Partial<typeof expected>,
  ): Promise<void> => {
    await expectToolcraftCompoundControlPartOutcome(
      observation,
      session.controlAction(target, action),
      { ...expected, ...patch },
      { part, requirementId: target, stabilityIntervalMs: 60 },
    );
    Object.assign(expected, patch);
  };

  await prove(
    "gradient.gradientType",
    (control, currentPage) => chooseOption(currentPage, control, "Linear"),
    { gradientType: "linear" },
  );
  await prove(
    "gradient.angle",
    async (control) => {
      const input = control.getByRole("textbox", { name: "Gradient angle" });
      await input.fill("45");
      await input.press("Enter");
    },
    { angle: 45 },
  );
  await prove(
    "gradient.stops.position",
    async (control) => {
      const input = control.getByRole("textbox", { name: "Stop 1 position" });
      await input.fill("5");
      await input.press("Enter");
    },
    { position: 0.05 },
  );
  await prove(
    "gradient.stops.color",
    async (control) => {
      const input = control.getByRole("textbox", { name: "Stop 1 hex" });
      await input.fill("#11AAFF");
      await input.press("Enter");
    },
    { color: "#11AAFF" },
  );
  await prove(
    "gradient.stops.opacity",
    async (control) => {
      const input = control.getByRole("textbox", { name: "Stop 1 opacity" });
      await input.fill("80");
      await input.press("Enter");
    },
    { opacity: 0.8 },
  );
  await expectSimpleControlChange(session, target, async (control) => {
    const input = control.getByRole("textbox", { name: "Gradient angle" });
    await input.fill("62");
    await input.press("Enter");
  });
});

for (const [target, label] of [
  ["export.image.format", "JPG"],
  ["export.image.resolution", "2K"],
  ["export.video.format", "WebM"],
  ["export.video.resolution", "4K"],
] as const) {
  test(dotsBrowserTestName(target), async ({ page }) => {
    const session = await openProof(page);
    await expectSimpleControlChange(
      session,
      target,
      (control, currentPage) => chooseOption(currentPage, control, label),
    );
  });
}

test(dotsBrowserTestName("appearance.background"), async ({ page }) => {
  const session = await openProof(page);
  await expectSimpleControlChange(session, "appearance.background", async (control) => {
    const input = control.getByRole("textbox", {
      name: "Background color hex",
    });
    await input.fill("#101820");
    await input.press("Enter");
  });
});
