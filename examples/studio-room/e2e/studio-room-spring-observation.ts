import type { Page } from "@playwright/test";
import { roomOutput } from "./studio-room-motion-fixture";

type SpringSample = { ms: number; x: number };

export async function observeRoomSpring(page: Page, destination: { x: number; y: number }) {
  const ready = page.waitForEvent("console", {
    predicate: message => message.text() === "studio-room spring observer ready",
    timeout: 3000,
  });
  const observation = page.locator(roomOutput).evaluate(async root => {
    const wall = root.querySelector('[class*="_backWall_"]')!;
    return new Promise<SpringSample[]>(resolve => {
      // Start at the real pointer event, not at the test runner's IPC timestamp.
      root.addEventListener("pointermove", () => {
        const start = performance.now();
        const samples: SpringSample[] = [];
        const sample = () => {
          const ms = performance.now() - start;
          samples.push({ ms, x: new DOMMatrixReadOnly(getComputedStyle(wall).transform).m41 });
          if (ms >= 750) resolve(samples);
          else requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      }, { once: true });
      console.debug("studio-room spring observer ready");
    });
  });
  // A read-only evaluate above installs the observer; this command is the
  // actual user interaction. No clock, spring value or renderer is mutated.
  // Locator resolution is asynchronous: without this event handshake, the
  // mouse can arrive before the observer is installed and leave it waiting.
  await ready;
  await page.mouse.move(destination.x, destination.y);
  return observation;
}

/** Measure the actual exponential settling tail, independent of frame phase. */
export function roomSpringDecay(samples: SpringSample[], destination: number) {
  const tail = samples.filter(sample => {
    const remaining = Math.abs((destination - sample.x) / destination);
    return sample.ms >= 300 && remaining > 0.002 && remaining < 0.25;
  }).map(sample => ({ seconds: sample.ms / 1000, distance: Math.log(Math.abs(destination - sample.x)) }));
  if (tail.length < 5) throw new Error("The rendered spring must expose at least five settling frames");
  const meanTime = tail.reduce((sum, sample) => sum + sample.seconds, 0) / tail.length;
  const meanDistance = tail.reduce((sum, sample) => sum + sample.distance, 0) / tail.length;
  const covariance = tail.reduce((sum, sample) => sum + (sample.seconds - meanTime) * (sample.distance - meanDistance), 0);
  const variance = tail.reduce((sum, sample) => sum + (sample.seconds - meanTime) ** 2, 0);
  return -covariance / variance;
}
