import { dotsBrowserTestName } from "../src/app/dots/dots-acceptance";
import { expectToolcraftExportedArtifact } from "./browser-acceptance-outcome-helpers";
import { expectToolcraftBackgroundOutputSemantics } from "./browser-conditional-output-evidence-helpers";
import {
  expectToolcraftInfinityCanvasBackgroundEvidence,
  observeInfinityCanvasBackground,
} from "./browser-infinity-canvas-evidence";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { proveDotsReferenceTimelineAndPersistence } from "./dots-acceptance-reference";
import {
  exportDownload,
  inspectPng,
  inspectVideo,
  outputSelector,
  pausePlayback,
  selectFiniteCanvas,
  type ProductPage,
  type ProofSession,
} from "./dots-acceptance-support";
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

async function setShortExportDuration(page: ProductPage): Promise<void> {
  const timelineToggle = page.locator(
    '[data-toolcraft-control-target="panels.timeline.extended"]',
  );
  const toggle = timelineToggle.getByRole("switch");
  if ((await toggle.getAttribute("aria-checked")) !== "true") {
    await toggle.click();
  }
  await page.getByRole("button", { name: "Edit timeline duration" }).click();
  const editor = page.getByRole("textbox", { name: "timeline duration" });
  await editor.fill("1");
  await editor.press("Enter");
}

test.setTimeout(300_000);

test(dotsBrowserTestName("export.includeBackground"), async ({ page }) => {
  const session = await openProof(page);
  await setShortExportDuration(page);
  const output = page.locator(outputSelector);
  let backgroundColor = await output.getAttribute("data-background-color");
  expect(backgroundColor).toMatch(/^#[\da-f]{6}$/iu);
  const includeSwitch = page
    .locator(
      '[data-toolcraft-control-target="export.includeBackground"]',
    )
    .getByRole("switch");
  if ((await includeSwitch.getAttribute("aria-checked")) !== "true") {
    await includeSwitch.click();
  }
  const infinitySwitch = page
    .locator('[data-toolcraft-control-target="canvas.infinity"]')
    .getByRole("switch");
  await infinitySwitch.click();
  await expect(infinitySwitch).toHaveAttribute("aria-checked", "true");

  const frameSignatureBeforeLiveColor = await output.getAttribute(
    "data-dots-frame-signature",
  );
  await page.getByRole("button", { name: "Pick Background color" }).click();
  await page
    .locator('[data-slot="style-guide-color-surface"]')
    .click({ position: { x: 180, y: 60 } });
  const liveBackgroundColor = await page
    .getByRole("textbox", { name: "Background color hex" })
    .inputValue();
  const viewport = page.locator('[data-slot="toolcraft-runtime-canvas"]');
  await expect(viewport).toHaveAttribute(
    "data-toolcraft-infinite-background-color",
    liveBackgroundColor,
  );
  const expectedViewportColor = await page.evaluate((hex) => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = hex;
    document.body.append(probe);
    const resolved = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return resolved;
  }, liveBackgroundColor);
  await expect
    .poll(() =>
      viewport.evaluate((element) => getComputedStyle(element).backgroundColor),
    )
    .toBe(expectedViewportColor);
  await expect(output).toHaveAttribute(
    "data-dots-frame-signature",
    frameSignatureBeforeLiveColor ?? "",
  );
  await page.keyboard.press("Escape");
  backgroundColor = liveBackgroundColor;

  const infiniteBackground = await observeInfinityCanvasBackground(page);
  await includeSwitch.click();
  await expect(infinitySwitch).toBeDisabled();
  const backgroundExcluded = await observeInfinityCanvasBackground(page);
  await includeSwitch.click();
  await expect(infinitySwitch).toBeEnabled();
  const backgroundRestored = await observeInfinityCanvasBackground(page);
  await expectToolcraftInfinityCanvasBackgroundEvidence(
    {
      backgroundExcluded,
      backgroundRestored,
      infinite: infiniteBackground,
    },
    {
      expectedBackgroundColor: backgroundColor!,
      requirementId: "export.includeBackground",
      target: "export.includeBackground",
    },
  );
  const preview = session.observe((root) => {
    const node = root.querySelector<HTMLElement>(
      '[data-dots-renderer="true"]',
    );
    return {
      backgroundVisible: node?.dataset.backgroundVisible === "true",
      outputSignature: node?.dataset.dotsFrameSignature ?? "",
    };
  });
  await expectToolcraftBackgroundOutputSemantics(
    preview,
    session.controlAction("export.includeBackground", (control) =>
      control.getByRole("switch").click(),
    ),
    {
      backgroundVisible: false,
      outputSignature: await (async () => {
        await includeSwitch.click();
        const signature =
          (await output.getAttribute("data-dots-frame-signature")) ?? "";
        await includeSwitch.click();
        return signature;
      })(),
    },
    session.action((currentPage) =>
      exportDownload(currentPage, "Export PNG"),
    ),
    inspectPng,
    {
      requirementId: "export.includeBackground",
      stabilityIntervalMs: 80,
      timeoutMs: 90_000,
      video: {
        exportArtifact: session.action((currentPage) =>
          exportDownload(currentPage, "Export Video"),
        ),
        inspectArtifact: (download) =>
          inspectVideo(download, backgroundColor ?? undefined),
      },
    },
  );
});

test(dotsBrowserTestName("actions.output"), async ({ page }) => {
  const session = await openProof(page);
  await setShortExportDuration(page);
  await expectToolcraftExportedArtifact(
    session.controlAction(
      "actions.output",
      async (_control, currentPage) => {
        const video = await exportDownload(currentPage, "Export Video");
        const image = await exportDownload(currentPage, "Export PNG");
        return { image, video };
      },
    ),
    async ({ image, video }) => [
      await inspectVideo(video),
      await inspectPng(image),
    ],
    { requirementId: "actions.output" },
  );
});

for (const requirementId of [
  "reference.canvas-sizing",
  "reference.control-mapping",
  "reference.renderer-state",
  "runtime.timeline.playback",
  "runtime.persistence.reload",
  "runtime.canvas.viewport",
] as const) {
  test(dotsBrowserTestName(requirementId), async ({ page }) => {
    const session = await openProof(page);
    await proveDotsReferenceTimelineAndPersistence(page, session);
  });
}
