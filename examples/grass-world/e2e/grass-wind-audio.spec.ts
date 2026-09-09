import type { Page } from "@playwright/test";

import { expectToolcraftAcceptanceOutcome } from "./browser-acceptance-outcome-helpers";
import { expectToolcraftConditionalControlVisibility } from "./browser-conditional-output-evidence-helpers";
import { expectToolcraftPersistenceState } from "./browser-state-evidence-helpers";
import { prepareGrassSession } from "./grass-test-helpers";
import { expect, test } from "./toolcraft-product-test";

type WindAudioProbe = {
  pauseCalls: number;
  playCalls: number;
  volume: number;
};

async function chooseWindMode(page: Page, label: string): Promise<void> {
  await page
    .locator('[data-toolcraft-control-target="wind.mode"]')
    .getByRole("button", { exact: true, name: label })
    .click({ force: true });
}

async function readAudioProbe(page: Page): Promise<WindAudioProbe> {
  return page.evaluate(() =>
    structuredClone(
      (
        window as typeof window & {
          __grassWindAudioProbe: WindAudioProbe;
        }
      ).__grassWindAudioProbe,
    ),
  );
}

test("simulation terrain hover plays and fades wind audio", async ({
  page,
}) => {
  test.setTimeout(600_000);
  await page.addInitScript(() => {
    const runtime = window as typeof window & {
      __grassWindAudioProbe: WindAudioProbe;
    };
    runtime.__grassWindAudioProbe = {
      pauseCalls: 0,
      playCalls: 0,
      volume: 1,
    };
    Object.defineProperty(HTMLMediaElement.prototype, "paused", {
      configurable: true,
      get() {
        return Reflect.get(this, "__grassAudioPaused") ?? true;
      },
    });
    Object.defineProperty(HTMLMediaElement.prototype, "volume", {
      configurable: true,
      get() {
        return Reflect.get(this, "__grassAudioVolume") ?? 1;
      },
      set(value: number) {
        Reflect.set(this, "__grassAudioVolume", value);
        runtime.__grassWindAudioProbe.volume = value;
      },
    });
    HTMLMediaElement.prototype.play = async function play() {
      runtime.__grassWindAudioProbe.playCalls += 1;
      Reflect.set(this, "__grassAudioPaused", false);
    };
    HTMLMediaElement.prototype.pause = function pause() {
      runtime.__grassWindAudioProbe.pauseCalls += 1;
      Reflect.set(this, "__grassAudioPaused", true);
    };
  });

  const session = await prepareGrassSession(page, { pausePlayback: false });
  const output = page.locator('[data-slot="grass-live-preview"]');
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
    {
      requirementId: "grass.wind-audio-volume",
      target: "wind.audioVolume",
      timeoutMs: 15_000,
    },
  );
  await expectToolcraftPersistenceState(
    session.observe((root) => {
      const slider = root.querySelector<HTMLInputElement>(
        '[data-toolcraft-control-target="wind.audioVolume"] input[type="range"]',
      );
      return Number(slider?.value);
    }),
    session.controlAction("wind.audioVolume", async (control) => {
      await control.getByRole("slider").press("ArrowRight");
    }),
    session.reload(),
    61,
    {
      requirementId: "grass.wind-audio-volume",
      stabilityIntervalMs: 80,
      stabilitySamples: 2,
      timeoutMs: 15_000,
    },
  );
  await expect(output).toHaveAttribute("data-grass-wind-mode", "simulation");
  const bounds = await output.boundingBox();
  expect(bounds).not.toBeNull();
  const terrainPoint = {
    x: bounds!.x + bounds!.width * 0.4,
    y: bounds!.y + bounds!.height * 0.6,
  };

  await expectToolcraftAcceptanceOutcome(
    async () => (await readAudioProbe(page)).playCalls,
    async () => {
      await page.mouse.move(terrainPoint.x, terrainPoint.y);
      await expect(output).toHaveAttribute(
        "data-grass-pointer-direction-hit",
        "true",
      );
    },
    {
      evidenceType: "command-side-effect",
      requirementId: "grass.wind-audio",
      stabilityIntervalMs: 80,
      stabilitySamples: 2,
      timeoutMs: 20_000,
    },
  );
  await expect(output).toHaveAttribute("data-grass-wind-audio-active", "true");
  await expect(output).toHaveAttribute(
    "data-grass-wind-audio-state",
    "playing",
    {
      timeout: 10_000,
    },
  );

  const beforeMute = await readAudioProbe(page);
  await expectToolcraftAcceptanceOutcome(
    async () => Number((await readAudioProbe(page)).volume.toFixed(3)),
    async () => {
      const slider = page
        .locator('[data-toolcraft-control-target="wind.audioVolume"]')
        .getByRole("slider");
      await slider.focus();
      await slider.press("Home");
    },
    {
      evidenceType: "command-side-effect",
      requirementId: "grass.wind-audio-volume-effect",
      stabilityIntervalMs: 80,
      stabilitySamples: 2,
      timeoutMs: 15_000,
    },
  );
  expect((await readAudioProbe(page)).pauseCalls).toBeGreaterThan(
    beforeMute.pauseCalls,
  );
  expect((await readAudioProbe(page)).volume).toBe(0);
  await expect(output).toHaveAttribute("data-grass-wind-audio-state", "idle");

  const beforeResume = await readAudioProbe(page);
  const volumeSlider = page
    .locator('[data-toolcraft-control-target="wind.audioVolume"]')
    .getByRole("slider");
  for (let step = 0; step < 25; step += 1) {
    await volumeSlider.press("ArrowRight");
  }
  await expect
    .poll(async () => (await readAudioProbe(page)).playCalls)
    .toBeGreaterThan(beforeResume.playCalls);
  await expect
    .poll(async () => Number((await readAudioProbe(page)).volume.toFixed(2)))
    .toBe(0.25);
  await expect(output).toHaveAttribute(
    "data-grass-wind-audio-state",
    "playing",
    { timeout: 10_000 },
  );

  const beforeLeave = await readAudioProbe(page);
  await page.mouse.move(bounds!.x + 2, bounds!.y + 2);
  await expect(output).toHaveAttribute(
    "data-grass-pointer-direction-hit",
    "false",
  );
  await expect
    .poll(async () => (await readAudioProbe(page)).pauseCalls)
    .toBeGreaterThan(beforeLeave.pauseCalls);
  await expect(output).toHaveAttribute("data-grass-wind-audio-state", "idle");

  await chooseWindMode(page, "Wind");
  const beforeWindHover = await readAudioProbe(page);
  await page.mouse.move(terrainPoint.x, terrainPoint.y);
  await expect(output).toHaveAttribute(
    "data-grass-pointer-direction-hit",
    "true",
  );
  await page.waitForTimeout(800);
  expect((await readAudioProbe(page)).playCalls).toBe(
    beforeWindHover.playCalls,
  );
  await expect(output).toHaveAttribute("data-grass-wind-audio-active", "false");
});
