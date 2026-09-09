import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import {
  createLogoSphereProofSession,
  logoSphereCanvasSelector,
  moveSliderToEnd,
} from "./logo-sphere-test-helpers";
import { test } from "./toolcraft-product-test";

test.setTimeout(120_000);

const fadeCases = [
  ["fade.mask-size", "fade.maskSize"],
  ["fade.feather", "fade.feather"],
  ["fade.rear-opacity", "fade.rearOpacity"],
] as const;

for (const [requirementId, target] of fadeCases) {
  test(
    `browser: ${requirementId} updates logo sphere product output`,
    async ({ page }) => {
      const session = await createLogoSphereProofSession(page);
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction(target, moveSliderToEnd),
        {
          requirementId,
          selector: logoSphereCanvasSelector,
          stabilityIntervalMs: 0,
        },
      );
    },
  );
}
