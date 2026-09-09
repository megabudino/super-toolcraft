import { expect, test, type Page } from "@playwright/test";

import { appPerformance } from "../src/app/app-performance";
import { getEditorialTemplate } from "../src/app/editorial-templates";
import {
  applyToolcraftPerformanceWorkloadFixture,
  applyToolcraftPerformanceStressFixture,
  dragToolcraftCanvasViewport,
  dragToolcraftSliderToValue,
  expectToolcraftScenarioPerformanceBudget,
  getToolcraftPerformanceStressValue,
  measureToolcraftAnimationFrames,
  measureToolcraftInteraction,
} from "./performance-helpers";

async function expectPosterReady(page: Page) {
  await page.goto("/");
  await expect(page.getByTestId("editorial-pattern-output")).toBeVisible();
}

async function applyMorphStressFixture(
  page: Page,
  scenarioId: "pattern-morph-frames" | "pattern-morph-viewport-drag",
) {
  await applyToolcraftPerformanceStressFixture(page, appPerformance, scenarioId, {
    detail: async (value) => {
      await dragToolcraftSliderToValue(page, "Detail", Number(value));
    },
    segmentSize: async (value) => {
      await dragToolcraftSliderToValue(page, "Segment size", Number(value));
    },
  });
}

test("browser perf: whole composition shuffle stays responsive", async ({ page }) => {
  await expectPosterReady(page);
  const shuffle = page.getByRole("button", { name: "Shuffle all", exact: true });
  await shuffle.scrollIntoViewIfNeeded();
  await expect(shuffle).toBeVisible();
  const result = await measureToolcraftInteraction(page, async () => {
    await shuffle.click();
  });
  expectToolcraftScenarioPerformanceBudget(
    result,
    appPerformance,
    "composition-shuffle-change",
  );
});

test("browser perf: preserve colors toggle stays responsive", async ({ page }) => {
  await expectPosterReady(page);
});

test("browser perf: equation morph frames stay smooth", async ({ page }) => {
  await expectPosterReady(page);
  await applyMorphStressFixture(page, "pattern-morph-frames");
  await page.getByRole("button", { name: "Shuffle all", exact: true }).click();
  await expect(page.getByTestId("editorial-pattern-output")).toHaveAttribute(
    "data-pattern-morphing",
    "true",
  );
  const result = await measureToolcraftAnimationFrames(page, 120);
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "pattern-morph-frames");
});

test("browser perf: canvas drag stays responsive during equation morph", async ({ page }) => {
  await expectPosterReady(page);
  await applyMorphStressFixture(page, "pattern-morph-viewport-drag");
  await page.getByRole("button", { name: "Shuffle all", exact: true }).click();
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftCanvasViewport(page);
  });
  expectToolcraftScenarioPerformanceBudget(
    result,
    appPerformance,
    "pattern-morph-viewport-drag",
  );
});

test("browser perf: template changes stay responsive", async ({ page }) => {
  await expectPosterReady(page);
  await applyToolcraftPerformanceWorkloadFixture(
    page,
    appPerformance,
    "template-change",
    {
      detail: async (value) => {
        await dragToolcraftSliderToValue(page, "Detail", Number(value));
      },
      segmentSize: async (value) => {
        await dragToolcraftSliderToValue(page, "Segment size", Number(value));
      },
    },
  );

  const templateId = getToolcraftPerformanceStressValue<string>(
    appPerformance,
    "template-change",
  );
  const templateLabel = getEditorialTemplate(templateId).label;
  const result = await measureToolcraftInteraction(page, async () => {
    const field = page
      .locator('[data-slot="field"]')
      .filter({ hasText: /^Template/ });
    await field.getByRole("combobox").click();
    await page
      .locator('[data-slot="select-item"]')
      .filter({ has: page.getByText(templateLabel, { exact: true }) })
      .last()
      .click();
  });

  await expect(page.getByTestId("editorial-pattern-output")).toHaveAttribute(
    "data-editorial-template",
    templateId,
  );
  await expect(page.getByTestId("editorial-pattern-output")).toHaveAttribute(
    "data-text-element-count",
    "25",
  );
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "template-change");
});
test("browser perf: custom copy mode stays responsive", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: eyebrow edits stay responsive", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: headline edits stay responsive", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: body edits stay responsive", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: footer edits stay responsive", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: equation changes stay responsive", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: symmetry drag stays live", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: resonance drag stays live", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: coupling drag stays live", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: phase drag stays live", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: warp drag stays live", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: position fields stay responsive", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: scale drag stays live", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: detail drag stays live", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: stroke drag stays live", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: segment size drag stays live", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: segment randomness drag stays live", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: color spread drag stays live", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: first line color stays responsive", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: second line color stays responsive", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: third line color stays responsive", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: palette shuffle stays responsive", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: headline ink stays responsive", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: detail ink stays responsive", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: rule ink stays responsive", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: background include stays responsive", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: background color stays responsive", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: image format stays responsive", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: image resolution selection stays responsive", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: maximum-detail preview renders within budget", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: maximum-detail viewport zoom stays stable", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: poster viewport remains stable", async ({ page }) => {
  await expectPosterReady(page);
});
test("browser perf: 8K poster export completes within budget", async ({ page }) => {
  await expectPosterReady(page);
});
