import type { CDPSession, Page } from "@playwright/test";

import { prepareGrassSession } from "./grass-test-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

type Point = Readonly<{ x: number; y: number }>;
type Tilt = readonly [number, number];

async function chooseSimulation(page: Page): Promise<void> {
  await page
    .locator('[data-toolcraft-control-target="wind.mode"]')
    .getByRole("button", { exact: true, name: "Simulate" })
    .click({ force: true });
}

async function dispatchTouch(
  client: CDPSession,
  type: "touchEnd" | "touchMove" | "touchStart",
  point?: Point,
): Promise<void> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      client.send("Input.dispatchTouchEvent", {
        touchPoints: point
          ? [
              {
                force: 1,
                id: 1,
                radiusX: 1,
                radiusY: 1,
                x: point.x,
                y: point.y,
              },
            ]
          : [],
        type,
      }),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(
          () => reject(new Error(`${type} did not reach Chromium.`)),
          10_000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

function parseTilt(value: string | null): Tilt {
  const parsed = JSON.parse(value ?? "[0,0]") as unknown;
  if (
    !Array.isArray(parsed) ||
    parsed.length !== 2 ||
    !parsed.every((component) => Number.isFinite(component))
  ) {
    throw new Error(`Invalid rendered surface tilt ${String(value)}.`);
  }
  return [Number(parsed[0]), Number(parsed[1])];
}

test("mobile touch drag drives terrain wind and surface tilt", async ({
  page,
}) => {
  test.setTimeout(600_000);
  const session = await prepareGrassSession(page, { pausePlayback: true });
  const output = page.locator('[data-slot="grass-live-preview"]');
  const canvas = page.locator('[data-slot="grass-webgl-canvas"]');
  await chooseSimulation(page);
  await expect(output).toHaveAttribute("data-grass-touch-interactive", "true");
  await expect(output).toHaveCSS("touch-action", "none");

  const bounds = await output.boundingBox();
  expect(bounds).not.toBeNull();
  const start = {
    x: bounds!.x + bounds!.width * 0.4,
    y: bounds!.y + bounds!.height * 0.62,
  };
  const end = {
    x: bounds!.x + bounds!.width * 0.58,
    y: bounds!.y + bounds!.height * 0.62,
  };
  const orientationBefore = await output.getAttribute("data-grass-orientation");
  const client = await page.context().newCDPSession(page);
  await client.send("Emulation.setTouchEmulationEnabled", {
    enabled: true,
    maxTouchPoints: 1,
  });

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("wind.mode", async () => {
      await dispatchTouch(client, "touchStart", start);
      await expect(output).toHaveAttribute("data-grass-touch-active", "true");
      await expect(output).toHaveAttribute(
        "data-grass-pointer-direction-hit",
        "true",
      );
      await dispatchTouch(client, "touchMove", end);
      await expect(output).toHaveAttribute(
        "data-grass-pointer-direction-observed",
        "true",
      );
      await expect
        .poll(
          async () =>
            Math.hypot(
              ...parseTilt(
                await canvas.getAttribute(
                  "data-grass-surface-tilt-rotation",
                ),
              ),
            ),
          { timeout: 20_000 },
        )
        .toBeGreaterThan(0.02);
    }),
    {
      baselineStabilityIntervalMs: 20,
      baselineStabilitySamples: 2,
      requirementId: "grass.touch-terrain-interaction",
      selector: '[data-slot="grass-webgl-canvas"]',
      stabilityIntervalMs: 20,
      stabilitySamples: 2,
      timeoutMs: 30_000,
    },
  );

  await dispatchTouch(client, "touchEnd");
  await expect(output).toHaveAttribute("data-grass-touch-active", "false");
  await expect(output).toHaveAttribute(
    "data-grass-pointer-direction-hit",
    "false",
  );
  await expect(output).toHaveAttribute("data-grass-pointer-wind-active", "false");
  await expect
    .poll(
      async () =>
        parseTilt(
          await canvas.getAttribute("data-grass-surface-tilt-rotation"),
        ),
      { timeout: 20_000 },
    )
    .toEqual([0, 0]);
  expect(await output.getAttribute("data-grass-orientation")).toBe(
    orientationBefore,
  );
});
