import { stat } from "node:fs/promises";

import type { Download, Locator, Page } from "@playwright/test";

import { expectToolcraftAcceptanceOutcome } from "./browser-acceptance-outcome-helpers";
import {
  createToolcraftBrowserProofSession,
  readToolcraftBrowserObservation,
  type ToolcraftBrowserProofSession,
} from "./browser-proof-session";
import { expectToolcraftMediaLifecycle } from "./browser-state-evidence-helpers";
import {
  expectToolcraftDiscreteSliderMarkers,
} from "./performance-control-layout-helpers";
import { waitForToolcraftAnimationFrames } from "./performance-interaction-measurement";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const outputSelector = "[data-dot-ring-renderer]";

async function pausePlayback(page: Page): Promise<void> {
  const pause = page.getByRole("button", { name: "Pause playback" });
  if ((await pause.count()) > 0) {
    await pause.click();
    await waitForToolcraftAnimationFrames(page, 2);
  }
}

async function openProofSession(
  page: Page,
): Promise<ToolcraftBrowserProofSession> {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator(outputSelector)).toBeVisible();
  await pausePlayback(page);
  const infinity = page
    .locator('[data-toolcraft-control-target="canvas.infinity"]')
    .getByRole("switch");
  if ((await infinity.getAttribute("aria-checked")) === "true") {
    await infinity.click();
  }
  await expect(page.locator(outputSelector)).toHaveAttribute(
    "data-canvas-mode",
    "finite",
  );
  const session = await createToolcraftBrowserProofSession(page);
  return session;
}

async function chooseOption(
  page: Page,
  control: Locator,
  label: string,
): Promise<void> {
  const combobox = control.getByRole("combobox");
  await combobox.scrollIntoViewIfNeeded();
  if ((await combobox.getAttribute("aria-expanded")) !== "true") {
    await combobox.click();
  }
  const option = page.locator('[role="option"]').filter({ hasText: label }).last();
  await expect(option).toBeVisible();
  await option.click();
}

async function setSlider(control: Locator, value: number): Promise<void> {
  const edit = control.getByRole("button", { name: /^Edit .+ value$/u });
  if ((await edit.count()) > 0) {
    await edit.click();
    const input = control.getByRole("textbox");
    await input.fill(String(value));
    await input.press("Enter");
    return;
  }
  await control.getByRole("slider").fill(String(value));
}

async function setColor(control: Locator, value: string): Promise<void> {
  const input = control.getByRole("textbox").first();
  await input.fill(value);
  await input.press("Enter");
}

async function downloadSettings(page: Page): Promise<Download> {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Settings" }).click();
  return pending;
}

test("browser: Dot Ring Studio updates product output", async ({ page }) => {
  await openProofSession(page);
  let settingsBytes = 0;
  let download: Download | undefined;

  await expectToolcraftAcceptanceOutcome(
    async () => settingsBytes,
    async () => {
      download = await downloadSettings(page);
      const file = await download.path();
      settingsBytes = file ? (await stat(file)).size : 0;
    },
    {
      evidenceType: "command-side-effect",
      requirementId: "runtime.settingsTransfer",
      stabilityIntervalMs: 0,
    },
  );
  expect(settingsBytes).toBeGreaterThan(100);

  const radius = page.locator('[data-toolcraft-control-target="ring.radius"]');
  await setSlider(radius, 370);
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import Settings" }).click();
  await (await chooser).setFiles((await download!.path())!);
  await expect(radius.getByRole("slider")).toHaveAttribute(
    "aria-valuenow",
    "372",
  );
});

test("browser: timeline panel toggle reveals extended transport", async ({
  page,
}) => {
  await openProofSession(page);
  const slider = page.getByRole("slider", { name: "Playback position" });

  await expectToolcraftAcceptanceOutcome(
    async () => slider.count(),
    async () => {
      await page
        .locator(
          '[data-toolcraft-control-target="panels.timeline.extended"]',
        )
        .getByRole("switch")
        .click();
    },
    {
      evidenceType: "command-side-effect",
      requirementId: "panels.timeline.extended",
      stabilityIntervalMs: 0,
    },
  );
  await expect(slider).toBeVisible();
});

test("browser: source audio drives rendered waveform", async ({ page }) => {
  const session = await openProofSession(page);
  const observeAudio = session.observe((root) => {
    const output = root.querySelector<HTMLElement>(
      "[data-dot-ring-renderer]",
    );
    const sourceName =
      root
        .querySelector<HTMLElement>(
          '[data-toolcraft-control-target="audio.source"] [data-slot="file-upload-file-item"] span[title]',
        )
        ?.getAttribute("title")
        ?.trim() ?? "";
    return {
      itemIds:
        sourceName && sourceName !== "Minimal Electro Bass Pulse"
          ? [sourceName]
          : [],
      outputSignature: output?.dataset.frameSignature ?? "",
    };
  });
  const control = page.locator('[data-toolcraft-control-target="audio.source"]');

  await control
    .locator('input[type="file"]')
    .setInputFiles("e2e/fixtures/audio-pulse.wav");
  await expect(page.locator(outputSelector)).toHaveAttribute(
    "data-audio-source",
    "audio-pulse.wav",
    { timeout: 20_000 },
  );
  const expected = await readToolcraftBrowserObservation(observeAudio);
  await control
    .getByRole("button", { name: "Remove audio-pulse.wav" })
    .click();
  await expect(page.locator(outputSelector)).toHaveAttribute(
    "data-audio-source",
    "Minimal Electro Bass Pulse",
  );

  await expectToolcraftMediaLifecycle(
    observeAudio,
    session.controlAction("audio.source", async (field) => {
      await field
        .locator('input[type="file"]')
        .setInputFiles("e2e/fixtures/audio-pulse.wav");
    }),
    expected,
    {
      requirementId: "audio.source",
      stabilityIntervalMs: 80,
      timeoutMs: 20_000,
    },
  );

  await page
    .getByRole("button", { name: "Reset Source Audio section" })
    .click();
  await expect(control.getByTitle("audio-pulse.wav")).toHaveCount(0);
  await expect(page.locator(outputSelector)).toHaveAttribute(
    "data-audio-source",
    "Minimal Electro Bass Pulse",
  );
});

type SimpleControlCase = Readonly<{
  action: (control: Locator, page: Page) => Promise<void>;
  layout?: "discrete";
  target: string;
  title: string;
}>;

const simpleControlCases: readonly SimpleControlCase[] = [
  {
    action: (control, page) => chooseOption(page, control, "16:9"),
    target: "canvas.aspectRatio",
    title: "browser: aspect ratio changes finite output frame",
  },
  {
    action: async (control) => {
      const input = control.locator("input");
      await input.fill("900");
      await input.press("Enter");
    },
    target: "canvas.size.width",
    title: "browser: canvas width changes output dimensions",
  },
  {
    action: async (control) => {
      const input = control.locator("input");
      await input.fill("840");
      await input.press("Enter");
    },
    target: "canvas.size.height",
    title: "browser: canvas height changes output dimensions",
  },
  {
    action: (control) => setSlider(control, 1.5),
    layout: "discrete",
    target: "canvas.renderScale",
    title: "browser: resolution scale changes preview backing dimensions",
  },
  {
    action: async (control) => {
      await expect(control.getByRole("textbox").first()).toHaveValue("#0C1A32");
      await setColor(control, "#332244");
    },
    target: "appearance.background",
    title: "browser: background color changes rendered output",
  },
  {
    action: (control) => setSlider(control, 370),
    target: "ring.radius",
    title: "browser: ring radius changes rendered output",
  },
  {
    action: (control) => setSlider(control, 220),
    target: "ring.density",
    title: "browser: ring density changes rendered output",
  },
  {
    action: (control) => setSlider(control, 7),
    layout: "discrete",
    target: "ring.rows",
    title: "browser: ring rows changes rendered output",
  },
  ...[
    ["ring.color1", "#ff4ee1"],
    ["ring.color2", "#38c7ff"],
    ["ring.color3", "#ff9f38"],
    ["ring.color4", "#55ffe7"],
    ["ring.color5", "#ffffff"],
  ].map(
    ([target, value], index): SimpleControlCase => ({
      action: (control) => setColor(control, value!),
      target: target!,
      title: `browser: ring color ${index + 1} changes rendered output`,
    }),
  ),
  {
    action: (control) => setSlider(control, 76),
    target: "ring.colorSpread",
    title: "browser: ring color spread changes rendered output",
  },
  {
    action: (control, page) => chooseOption(page, control, "Around ring"),
    target: "ring.colorMode",
    title: "browser: ring color mode changes rendered output",
  },
  {
    action: (control) => setSlider(control, 1.4),
    target: "ring.dotSize",
    title: "browser: ring dot size changes rendered output",
  },
  {
    action: (control) => setSlider(control, 80),
    target: "ring.sizeResponse",
    title: "browser: ring size response changes rendered output",
  },
  {
    action: (control) => setSlider(control, 60),
    target: "ring.glow",
    title: "browser: ring glow changes rendered output",
  },
  {
    action: (control, page) => chooseOption(page, control, "Complex"),
    target: "wave.formula",
    title: "browser: wave formula changes rendered output",
  },
  ...[
    ["wave.speed", 1.4, "browser: wave speed changes rendered output"],
    ["wave.rotationSpeed", 2.35, "browser: wave rotation changes rendered output"],
    [
      "wave.globalRotationSpeed",
      0.24,
      "browser: wave global rotation changes rendered output",
    ],
    [
      "wave.affectedAmplitude",
      110,
      "browser: wave active amplitude changes rendered output",
    ],
    [
      "wave.calmAmplitude",
      44,
      "browser: wave calm amplitude changes rendered output",
    ],
    [
      "wave.sectorAngle",
      167,
      "browser: wave sector angle changes rendered output",
    ],
  ].map(
    ([target, value, title]): SimpleControlCase => ({
      action: (control) => setSlider(control, Number(value)),
      target: String(target),
      title: String(title),
    }),
  ),
];

for (const controlCase of simpleControlCases) {
  test(controlCase.title, async ({ page }) => {
    const session = await openProofSession(page);
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(controlCase.target, controlCase.action),
      {
        requirementId: controlCase.target,
        selector: outputSelector,
        stabilityIntervalMs: 80,
        timeoutMs: 20_000,
      },
    );
    if (controlCase.layout === "discrete") {
      await expectToolcraftDiscreteSliderMarkers(
        page,
        controlCase.target,
      );
    }
  });
}

test("browser: wave row echo changes rendered output", async ({ page }) => {
  const session = await openProofSession(page);
  const rows = page.locator('[data-toolcraft-control-target="ring.rows"]');

  await setSlider(rows, 4);
  await waitForToolcraftAnimationFrames(page, 2);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("wave.rowEcho", (control) =>
      setSlider(control, 240),
    ),
    {
      requirementId: "wave.rowEcho",
      selector: outputSelector,
      stabilityIntervalMs: 80,
      timeoutMs: 20_000,
    },
  );
});
