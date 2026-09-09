import type { Page } from "@playwright/test";

import { expectToolcraftAcceptanceOutcome } from "./browser-acceptance-outcome-helpers";
import { expectToolcraftConditionalControlVisibility } from "./browser-conditional-output-evidence-helpers";
import { prepareGrassSession } from "./grass-test-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

type Point = Readonly<{ x: number; y: number }>;
type Tilt = readonly [number, number];

const tiltControls = [
  ["wind.surfaceTiltLeft", "grass.surface-tilt-left"],
  ["wind.surfaceTiltRight", "grass.surface-tilt-right"],
  ["wind.surfaceTiltUp", "grass.surface-tilt-up"],
  ["wind.surfaceTiltDown", "grass.surface-tilt-down"],
  ["wind.surfaceTiltSmoothing", "grass.surface-tilt-smoothing"],
] as const;

async function chooseWindMode(page: Page, label: string): Promise<void> {
  await page
    .locator('[data-toolcraft-control-target="wind.mode"]')
    .getByRole("button", { exact: true, name: label })
    .click({ force: true });
}

async function setSliderValue(
  page: Page,
  target: string,
  value: number,
): Promise<void> {
  const control = page.locator(`[data-toolcraft-control-target="${target}"]`);
  await control.getByRole("button", { name: /^Edit .+ value$/u }).click();
  const input = control.getByRole("textbox");
  await input.fill(String(value));
  await input.press("Enter");
  await expect(
    control.getByRole("button", { name: /^Edit .+ value$/u }),
  ).toContainText(String(value));
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

async function readRenderedTilt(page: Page): Promise<Tilt> {
  return parseTilt(
    await page
      .locator('[data-slot="grass-webgl-canvas"]')
      .getAttribute("data-grass-surface-tilt-rotation"),
  );
}

async function armNextRenderedTiltObserver(
  output: ReturnType<Page["locator"]>,
): Promise<void> {
  await output.evaluate((element) => {
    type ObservedTiltElement = HTMLElement & {
      __grassTiltObserver?: MutationObserver;
      __grassTiltResult?: Tilt | null;
    };
    const observedElement = element as ObservedTiltElement;
    observedElement.__grassTiltObserver?.disconnect();
    observedElement.__grassTiltResult = null;
    const inspect = (): void => {
      const parsed = JSON.parse(
        observedElement.getAttribute("data-grass-surface-tilt-rotation") ??
          "[0,0]",
      ) as unknown;
      if (
        !Array.isArray(parsed) ||
        parsed.length !== 2 ||
        !parsed.every((component) => Number.isFinite(component))
      ) {
        throw new Error("Invalid rendered surface-tilt diagnostics.");
      }
      const tilt = [Number(parsed[0]), Number(parsed[1])] as const;
      if (Math.hypot(...tilt) <= 0.001) return;
      observedElement.__grassTiltResult = tilt;
      observedElement.__grassTiltObserver?.disconnect();
    };
    observedElement.__grassTiltObserver = new MutationObserver(inspect);
    observedElement.__grassTiltObserver.observe(observedElement, {
      attributeFilter: ["data-grass-surface-tilt-rotation"],
      attributes: true,
    });
  });
}

async function readObservedTilt(
  output: ReturnType<Page["locator"]>,
): Promise<Tilt | null> {
  return output.evaluate((element) => {
    const observedElement = element as HTMLElement & {
      __grassTiltResult?: Tilt | null;
    };
    return observedElement.__grassTiltResult ?? null;
  });
}

async function captureGesture(
  page: Page,
  output: ReturnType<Page["locator"]>,
  from: Point,
  to: Point,
): Promise<Readonly<{ immediate: Tilt; rendered: Tilt; screen: Tilt }>> {
  await page.mouse.move(from.x, from.y);
  await expect(output).toHaveAttribute("data-grass-pointer-direction-hit", "true");
  await expect
    .poll(async () => readRenderedTilt(page), { timeout: 20_000 })
    .toEqual([0, 0]);
  await armNextRenderedTiltObserver(output);
  await page.mouse.move(to.x, to.y);
  await expect
    .poll(async () => readObservedTilt(output), { timeout: 5_000 })
    .not.toBeNull();
  const rendered = await readObservedTilt(output);
  expect(rendered).not.toBeNull();
  const immediate = rendered;
  expect(Math.hypot(...rendered!)).toBeGreaterThan(0.02);
  const screen = parseTilt(
    await output.getAttribute("data-grass-pointer-screen-direction-vector"),
  );
  return { immediate: immediate!, rendered: rendered!, screen };
}

test("simulation pointer movement tilts and settles the complete surface", async ({
  page,
}) => {
  test.setTimeout(600_000);
  const session = await prepareGrassSession(page, { pausePlayback: false });
  const output = page.locator('[data-slot="grass-live-preview"]');
  const canvas = page.locator('[data-slot="grass-webgl-canvas"]');
  await page.evaluate(() => {
    for (const target of [
      "grass.enabled",
      "lawn.enabled",
      "scan.tufted.enabled",
      "scan.wild.enabled",
      "scan.white.enabled",
      "scan.yellow.enabled",
      "scan.rocks.enabled",
      "scan.boulder.enabled",
    ]) {
      const control = document.querySelector(
        `[data-toolcraft-control-target="${target}"] [role="switch"]`,
      );
      if (control?.getAttribute("aria-checked") === "true") {
        (control as HTMLElement).click();
      }
    }
  });
  const pause = page.getByRole("button", { name: "Pause playback" });
  if ((await pause.count()) > 0) {
    await pause.evaluate((button: HTMLButtonElement) => button.click());
  }

  await chooseWindMode(page, "Simulate");
  for (const [target, requirementId] of tiltControls) {
    await expectToolcraftConditionalControlVisibility(
      session,
      session.controlAction("wind.mode", async (control) => {
        await control
          .getByRole("button", { exact: true, name: "Wind" })
          .click({ force: true });
      }),
      session.controlAction("wind.mode", async (control) => {
        await control
          .getByRole("button", { exact: true, name: "Simulate" })
          .click({ force: true });
      }),
      { requirementId, target, timeoutMs: 15_000 },
    );
  }
  await expect(output).toHaveAttribute("data-grass-wind-mode", "simulation");
  await setSliderValue(page, "wind.surfaceTiltLeft", 1);
  await setSliderValue(page, "wind.surfaceTiltRight", 1);
  await setSliderValue(page, "wind.surfaceTiltUp", 1);
  await setSliderValue(page, "wind.surfaceTiltDown", 1);
  await setSliderValue(page, "wind.surfaceTiltSmoothing", 0.1);
  await expect(canvas).toHaveAttribute(
    "data-grass-surface-tilt-rotation",
    "[0,0]",
  );

  const orientationBefore = await output.getAttribute("data-grass-orientation");
  const bounds = await output.boundingBox();
  expect(bounds).not.toBeNull();
  const left = {
    x: bounds!.x + bounds!.width * 0.38,
    y: bounds!.y + bounds!.height * 0.62,
  };
  const right = {
    x: bounds!.x + bounds!.width * 0.56,
    y: bounds!.y + bounds!.height * 0.62,
  };
  const up = {
    x: bounds!.x + bounds!.width * 0.48,
    y: bounds!.y + bounds!.height * 0.57,
  };
  const down = {
    x: bounds!.x + bounds!.width * 0.48,
    y: bounds!.y + bounds!.height * 0.67,
  };

  const directionCases = [
    {
      from: right,
      id: "grass.surface-tilt-left",
      target: "wind.surfaceTiltLeft",
      to: left,
      verify: (tilt: Tilt, screen: Tilt) => {
        expect(screen[0]).toBeLessThan(-0.99);
        expect(Math.abs(screen[1])).toBeLessThan(0.01);
        expect(Math.abs(tilt[0])).toBeLessThan(0.02);
        expect(tilt[1]).toBeGreaterThan(0);
      },
    },
    {
      from: left,
      id: "grass.surface-tilt-right",
      target: "wind.surfaceTiltRight",
      to: right,
      verify: (tilt: Tilt, screen: Tilt) => {
        expect(screen[0]).toBeGreaterThan(0.99);
        expect(Math.abs(screen[1])).toBeLessThan(0.01);
        expect(Math.abs(tilt[0])).toBeLessThan(0.02);
        expect(tilt[1]).toBeLessThan(0);
      },
    },
    {
      from: down,
      id: "grass.surface-tilt-up",
      target: "wind.surfaceTiltUp",
      to: up,
      verify: (tilt: Tilt, screen: Tilt) => {
        expect(screen[1]).toBeLessThan(-0.99);
        expect(Math.abs(screen[0])).toBeLessThan(0.01);
        expect(tilt[0]).toBeLessThan(0);
        expect(Math.abs(tilt[1])).toBeLessThan(0.02);
      },
    },
    {
      from: up,
      id: "grass.surface-tilt-down",
      target: "wind.surfaceTiltDown",
      to: down,
      verify: (tilt: Tilt, screen: Tilt) => {
        expect(screen[1]).toBeGreaterThan(0.99);
        expect(Math.abs(screen[0])).toBeLessThan(0.01);
        expect(tilt[0]).toBeGreaterThan(0);
        expect(Math.abs(tilt[1])).toBeLessThan(0.02);
      },
    },
  ] as const;
  let fastImmediateMagnitude = 0;
  for (const { from, id, target, to, verify } of directionCases) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, async () => {
        await setSliderValue(page, target, 20);
        const gesture = await captureGesture(page, output, from, to);
        verify(gesture.rendered, gesture.screen);
        fastImmediateMagnitude = Math.max(
          fastImmediateMagnitude,
          Math.hypot(...gesture.immediate),
        );
      }),
      {
        baselineStabilityIntervalMs: 20,
        baselineStabilitySamples: 2,
        requirementId: id,
        stabilityIntervalMs: 20,
        stabilitySamples: 2,
        timeoutMs: 20_000,
      },
    );
  }

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("wind.surfaceTiltSmoothing", async () => {
      await setSliderValue(page, "wind.surfaceTiltSmoothing", 1.5);
      const smoothGesture = await captureGesture(page, output, left, right);
      expect(Math.hypot(...smoothGesture.immediate)).toBeLessThan(
        fastImmediateMagnitude,
      );
    }),
    {
      baselineStabilityIntervalMs: 20,
      baselineStabilitySamples: 2,
      requirementId: "grass.surface-tilt-smoothing",
      stabilityIntervalMs: 20,
      stabilitySamples: 2,
      timeoutMs: 20_000,
    },
  );
  expect(await output.getAttribute("data-grass-orientation")).toBe(
    orientationBefore,
  );

  await setSliderValue(page, "wind.surfaceTiltSmoothing", 0.2);
  let completeSurfaceObserved = false;
  await expectToolcraftAcceptanceOutcome(
    async () => completeSurfaceObserved,
    async () => {
      await captureGesture(page, output, left, right);
      await expect
        .poll(async () => readRenderedTilt(page), { timeout: 20_000 })
        .toEqual([0, 0]);
      completeSurfaceObserved = true;
    },
    {
      evidenceType: "command-side-effect",
      requirementId: "grass.surface-tilt",
      stabilityIntervalMs: 20,
      stabilitySamples: 2,
      timeoutMs: 25_000,
    },
  );
  await page.mouse.move(left.x, left.y);
  await page.mouse.move(right.x, right.y);
  await expect
    .poll(async () => Math.hypot(...(await readRenderedTilt(page))))
    .toBeGreaterThan(0.02);
  await chooseWindMode(page, "Wind");
  await expect
    .poll(async () => readRenderedTilt(page), { timeout: 20_000 })
    .toEqual([0, 0]);
});
