import type { Page } from "@playwright/test";

import { appAcceptance } from "../src/app/app-acceptance-data";
import { appSchema } from "../src/app/app-schema";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import {
  expectToolcraftInfinityCanvasModeEvidence,
  observeInfinityCanvas,
} from "./browser-infinity-canvas-evidence";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftPersistenceState } from "./browser-state-evidence-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const previewSelector = '[data-recraft-native-section]';

const heightAcceptance = appAcceptance.find(
  (entry) => entry.id === "section.height",
);
const infinityAcceptance = appAcceptance.find(
  (entry) => entry.id === "canvas.infinity",
);
const persistenceAcceptance = appAcceptance.find(
  (entry) => entry.id === "persistence.reload",
);

if (
  !heightAcceptance?.target ||
  !infinityAcceptance ||
  !persistenceAcceptance
) {
  throw new Error("Missing Studio Room product acceptance declarations.");
}

if (appSchema.persistence.storage !== "localStorage") {
  throw new Error("Studio Room workspace persistence requires localStorage.");
}

async function waitForPreview(page: Page) {
  await expect(page.locator(previewSelector)).toBeVisible();
  await expect(page.locator("[data-studio-room]")).toBeVisible();
}

async function resetAndWaitForPreview(page: Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await waitForPreview(page);
}

test("browser: Canvas height resizes the real Recraft Studio Room", async ({
  page,
}) => {
  await resetAndWaitForPreview(page);

  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction(
      heightAcceptance.target,
      async (control, currentPage) => {
        const input = control.getByRole("textbox");
        await input.fill("1200");
        await input.press("Enter");

        await expect(currentPage.locator(previewSelector)).toHaveCSS("height", "1200px");
        await expect
          .poll(() =>
            currentPage
              .locator("[data-studio-room]")
              .evaluate((section) => (section as HTMLElement).clientHeight),
          )
          .toBe(1200);
      },
    ),
    {
      requirementId: heightAcceptance.id,
      selector: previewSelector,
      stabilityIntervalMs: 50,
      stabilitySamples: 2,
      timeoutMs: 10_000,
    },
  );
});

test("browser: infinity mode restores the exact finite Studio Room size", async ({
  page,
}) => {
  await resetAndWaitForPreview(page);

  const before = await observeInfinityCanvas(page);
  const infinityControl = await getToolcraftControlFieldByTarget(
    page,
    "canvas.infinity",
  );
  await infinityControl.getByRole("switch").click();
  const enabled = await observeInfinityCanvas(page);

  const viewport = page.getByRole("application", { name: "Canvas viewport" });
  const viewportBox = await viewport.boundingBox();
  if (!viewportBox) {
    throw new Error("Infinity canvas proof requires visible viewport geometry.");
  }
  await page.mouse.move(
    viewportBox.x + viewportBox.width * 0.55,
    viewportBox.y + viewportBox.height * 0.55,
  );
  await page.mouse.down();
  await page.mouse.move(
    viewportBox.x + viewportBox.width * 0.55 + 64,
    viewportBox.y + viewportBox.height * 0.55 + 36,
    { steps: 4 },
  );
  await page.mouse.up();
  const afterPan = await observeInfinityCanvas(page);

  await page.reload();
  await waitForPreview(page);
  const afterReload = await observeInfinityCanvas(page);

  const restoredInfinityControl = await getToolcraftControlFieldByTarget(
    page,
    "canvas.infinity",
  );
  await restoredInfinityControl.getByRole("switch").click();
  const restored = await observeInfinityCanvas(page);
  await page.getByRole("button", { name: "Undo" }).click();
  const undone = await observeInfinityCanvas(page);
  await page.getByRole("button", { name: "Redo" }).click();
  const redone = await observeInfinityCanvas(page);

  await expectToolcraftInfinityCanvasModeEvidence(
    { afterPan, afterReload, before, enabled, redone, restored, undone },
    {
      expectedFiniteSize: { height: 1080, width: 1920 },
      expectedSceneRect: { height: 1080, width: 1920, x: 0, y: 0 },
      requirementId: infinityAcceptance.id,
      target: "canvas.infinity",
    },
  );
});

type PersistenceObservation = {
  canvasStyleHeight: string | null;
  controlsCollapsed: boolean;
  persistedCanvasHeight: number | null;
  persistedCanvasZoom: number | null;
  persistedControlsCollapsed: boolean | null;
  persistedValuesHeight: number | null;
  previewHeight: string | null;
  visibleZoom: string | null;
};

test(
  "browser: app restores exact canvas and panel workspace slices after reload",
  async ({ page }) => {
    const persistenceKey = appSchema.persistence.key;
    const changedCanvasHeight = 1200;
    const changedCanvasZoom = 110;

    await page.addInitScript((key) => {
      Object.defineProperty(window, "__studioRoomPersistenceProofKey", {
        configurable: false,
        enumerable: false,
        value: key,
        writable: false,
      });
    }, persistenceKey);
    await page.goto("/");
    await page.evaluate((key) => localStorage.removeItem(key), persistenceKey);
    await page.reload();

    const session = await createToolcraftBrowserProofSession(page);
    const persistedWorkspace = session.observe<PersistenceObservation>((root) => {
      const canvas = root.querySelector<HTMLElement>(
        "[data-toolcraft-editable-canvas]",
      );
      const toolbar = root.querySelector<HTMLElement>(
        '[data-toolcraft-inspect-toolbar="true"]',
      );
      const visibleZoom = [...(toolbar?.querySelectorAll("span") ?? [])]
        .map((candidate) => candidate.textContent?.trim() ?? "")
        .find((text) => /^\d+%$/u.test(text)) ?? null;
      const key = (
        window as Window & { __studioRoomPersistenceProofKey?: unknown }
      ).__studioRoomPersistenceProofKey;
      const rawSnapshot =
        typeof key === "string" ? localStorage.getItem(key) : null;
      let persistedCanvasHeight: number | null = null;
      let persistedCanvasZoom: number | null = null;
      let persistedControlsCollapsed: boolean | null = null;
      let persistedValuesHeight: number | null = null;

      if (rawSnapshot) {
        try {
          const snapshot = JSON.parse(rawSnapshot) as {
            state?: {
              canvas?: { size?: { height?: unknown }; zoom?: unknown };
              panels?: { controls?: { collapsed?: unknown } };
              values?: Record<string, unknown>;
            };
          };
          const canvasHeight = snapshot.state?.canvas?.size?.height;
          const canvasZoom = snapshot.state?.canvas?.zoom;
          const controlsCollapsed =
            snapshot.state?.panels?.controls?.collapsed;
          const valuesHeight =
            snapshot.state?.values?.["canvas.size.height"];
          persistedCanvasHeight =
            typeof canvasHeight === "number" ? canvasHeight : null;
          persistedCanvasZoom =
            typeof canvasZoom === "number" ? canvasZoom : null;
          persistedControlsCollapsed =
            typeof controlsCollapsed === "boolean" ? controlsCollapsed : null;
          persistedValuesHeight =
            typeof valuesHeight === "number" ? valuesHeight : null;
        } catch {
          persistedCanvasHeight = null;
        }
      }

      return {
        canvasStyleHeight: canvas?.style.height ?? null,
        controlsCollapsed:
          root.querySelector('[aria-label="Expand controls"]') !== null,
        persistedCanvasHeight,
        persistedCanvasZoom,
        persistedControlsCollapsed,
        persistedValuesHeight,
        previewHeight:
          root
            .querySelector<HTMLElement>('[data-recraft-native-section]')
            ?.style.height.replace("px", "") ?? null,
        visibleZoom,
      };
    });
    const expected: PersistenceObservation = {
      canvasStyleHeight: `${changedCanvasHeight}px`,
      controlsCollapsed: true,
      persistedCanvasHeight: changedCanvasHeight,
      persistedCanvasZoom: changedCanvasZoom,
      persistedControlsCollapsed: true,
      persistedValuesHeight: changedCanvasHeight,
      previewHeight: String(changedCanvasHeight),
      visibleZoom: `${changedCanvasZoom}%`,
    };

    await expectToolcraftPersistenceState(
      persistedWorkspace,
      session.controlAction(
        "canvas.size.height",
        async (control, currentPage) => {
          const input = control.getByRole("textbox").first();
          await input.fill(String(changedCanvasHeight));
          await input.press("Enter");
          await currentPage.getByRole("button", { name: "Zoom in" }).click();
          await currentPage
            .getByRole("button", { name: "Collapse controls" })
            .click();
          await expect(
            currentPage.getByRole("button", { name: "Expand controls" }),
          ).toBeVisible();
          await expect(
            currentPage.locator('[data-slot="toolcraft-runtime-app"]'),
          ).toHaveAttribute("data-toolcraft-persistence-status", "success");
        },
      ),
      session.reload(),
      expected,
      {
        assertRestoredOutput: async () => {
          await waitForPreview(page);
          await expect(page.locator(previewSelector)).toHaveCSS("height", `${changedCanvasHeight}px`);
        },
        requirementId: persistenceAcceptance.id,
        stabilityIntervalMs: 0,
      },
    );
  },
);
