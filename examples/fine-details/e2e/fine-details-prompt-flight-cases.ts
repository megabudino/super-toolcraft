import { expect } from "@playwright/test";

import { fineDetailsPromptFlightTargets } from "../src/app/fine-details-prompt-flight-values";
import {
  beginCarousel,
  editNumericControl,
  expectLandedAwayFrom,
  expectPromptFlightSettings,
  getCenterDistance,
  getDistance,
  getPromptRect,
  getTypographyCornerOffset,
  orderGhostSnapshotsAlongPath,
  prepareWith,
  prepareLandedWith,
  readGhostOpacityAtRect,
  readGhostOpacities,
  readGhostRects,
  readGhostSnapshots,
  setImagesMode,
  waitForGhostsToClear,
  type PromptFlightEvidenceCase,
  type PromptFlightTarget,
} from "./fine-details-prompt-flight-evidence";

const promptFlightEvidenceRegistry = {
  [fineDetailsPromptFlightTargets.enabled]: {
    target: fineDetailsPromptFlightTargets.enabled,
    prepare: prepareWith({
      bounce: 0,
      flightTime: 250,
      ghosts: true,
      offsetX: 0,
      offsetY: 0,
      startDelay: 1_000,
    }),
    edit: async (control) => {
      const active = control.getByRole("switch");
      await active.click();
      await expect(active).not.toBeChecked();
      return { enabled: false };
    },
    outcome: async ({ baseRect, control, ghosts, layer, page, prompt }) => {
      await setImagesMode(page, "Trail");
      await expect(prompt).toHaveAttribute("data-fine-details-prompt-flight", "idle", {
        timeout: 150,
      });
      await expect(ghosts).toHaveCount(0);
      expect(getDistance(await getPromptRect(layer), baseRect)).toBeLessThanOrEqual(1);

      await setImagesMode(page, "Carousel");
      await expect(prompt).toHaveAttribute("data-fine-details-prompt-flight", "landed", {
        timeout: 150,
      });
      await page.waitForTimeout(100);
      await expect(prompt).toHaveAttribute("data-fine-details-prompt-flight", "landed");
      await expect(ghosts).toHaveCount(0);
      await expectLandedAwayFrom(prompt, layer, baseRect);

      await setImagesMode(page, "Trail");
      await expect(prompt).toHaveAttribute("data-fine-details-prompt-flight", "idle", {
        timeout: 150,
      });
      await expect(ghosts).toHaveCount(0);
      expect(getDistance(await getPromptRect(layer), baseRect)).toBeLessThanOrEqual(1);

      const active = control.getByRole("switch");
      await active.click();
      await expect(active).toBeChecked();
      await expectPromptFlightSettings(page, { enabled: true });
      await setImagesMode(page, "Carousel");
      await expect(prompt).toHaveAttribute("data-fine-details-prompt-flight", "flying");
      await page.waitForTimeout(300);
      await expect(prompt).toHaveAttribute("data-fine-details-prompt-flight", "flying");
      expect(getDistance(await getPromptRect(layer), baseRect)).toBeLessThanOrEqual(1);
      await expectLandedAwayFrom(prompt, layer, baseRect);
    },
  },
  [fineDetailsPromptFlightTargets.offsetX]: {
    target: fineDetailsPromptFlightTargets.offsetX,
    prepare: prepareLandedWith({
      bounce: 0,
      flightTime: 250,
      ghosts: false,
      offsetX: 0,
      offsetY: 0,
      startDelay: 0,
    }),
    edit: async (control) => {
      await editNumericControl(control, "Offset X", 40);
      return { offset: { x: 40, y: 0 } };
    },
    outcome: async (context) => {
      await beginCarousel(context);
      await expect(context.prompt).toHaveAttribute("data-fine-details-prompt-flight", "landed");
      const landed = await getPromptRect(context.layer);
      const cornerOffset = getTypographyCornerOffset(
        landed,
        await getPromptRect(context.upperLeftTypography),
        await getPromptRect(context.lowerRightTypography),
      );
      expect(landed.x - context.baseRect.x).toBeGreaterThanOrEqual(39);
      expect(landed.x - context.baseRect.x).toBeLessThanOrEqual(41);
      expect(Math.abs(landed.y - context.baseRect.y)).toBeLessThanOrEqual(1);
      expect(cornerOffset.x).toBeGreaterThanOrEqual(39);
      expect(cornerOffset.x).toBeLessThanOrEqual(41);
      expect(Math.abs(cornerOffset.y)).toBeLessThanOrEqual(2);
    },
  },
  [fineDetailsPromptFlightTargets.offsetY]: {
    target: fineDetailsPromptFlightTargets.offsetY,
    prepare: prepareLandedWith({
      bounce: 0,
      flightTime: 250,
      ghosts: false,
      offsetX: 0,
      offsetY: 0,
      startDelay: 0,
    }),
    edit: async (control) => {
      await editNumericControl(control, "Offset Y", -40);
      return { offset: { x: 0, y: -40 } };
    },
    outcome: async (context) => {
      await beginCarousel(context);
      await expect(context.prompt).toHaveAttribute("data-fine-details-prompt-flight", "landed");
      const landed = await getPromptRect(context.layer);
      const cornerOffset = getTypographyCornerOffset(
        landed,
        await getPromptRect(context.upperLeftTypography),
        await getPromptRect(context.lowerRightTypography),
      );
      expect(Math.abs(landed.x - context.baseRect.x)).toBeLessThanOrEqual(1);
      expect(landed.y - context.baseRect.y).toBeGreaterThanOrEqual(-41);
      expect(landed.y - context.baseRect.y).toBeLessThanOrEqual(-39);
      expect(Math.abs(cornerOffset.x)).toBeLessThanOrEqual(2);
      expect(cornerOffset.y).toBeGreaterThanOrEqual(-41);
      expect(cornerOffset.y).toBeLessThanOrEqual(-39);
    },
  },
  [fineDetailsPromptFlightTargets.startDelay]: {
    target: fineDetailsPromptFlightTargets.startDelay,
    prepare: prepareWith({
      bounce: 0,
      flightTime: 250,
      ghosts: false,
      offsetX: 0,
      offsetY: 0,
    }),
    edit: async (control) => {
      await editNumericControl(control, "Start delay", 1_200);
      return { startDelay: 1_200 };
    },
    outcome: async (context) => {
      await beginCarousel(context);
      await expect(context.prompt).toHaveAttribute("data-fine-details-prompt-flight", "flying");
      await context.page.waitForTimeout(300);
      await expect(context.prompt).toHaveAttribute("data-fine-details-prompt-flight", "flying");
      expect(getDistance(await getPromptRect(context.layer), context.baseRect)).toBeLessThanOrEqual(
        1,
      );
      await expectLandedAwayFrom(context.prompt, context.layer, context.baseRect);
    },
  },
  [fineDetailsPromptFlightTargets.flightTime]: {
    target: fineDetailsPromptFlightTargets.flightTime,
    prepare: prepareWith({
      bounce: 0,
      ghosts: false,
      offsetX: 0,
      offsetY: 0,
      startDelay: 0,
    }),
    edit: async (control) => {
      await editNumericControl(control, "Flight time", 1_500);
      return { flightTime: 1_500 };
    },
    outcome: async (context) => {
      await beginCarousel(context);
      await expect(context.prompt).toHaveAttribute("data-fine-details-prompt-flight", "flying");
      await context.page.waitForTimeout(800);
      await expect(context.prompt).toHaveAttribute("data-fine-details-prompt-flight", "flying");
      const midpoint = await getPromptRect(context.layer);
      expect(getDistance(midpoint, context.baseRect)).toBeGreaterThan(5);
      const landed = await expectLandedAwayFrom(context.prompt, context.layer, context.baseRect);
      expect(getDistance(midpoint, landed)).toBeGreaterThan(5);
    },
  },
  [fineDetailsPromptFlightTargets.bounce]: {
    target: fineDetailsPromptFlightTargets.bounce,
    prepare: prepareWith({
      flightTime: 800,
      ghosts: false,
      offsetX: 0,
      offsetY: 0,
      startDelay: 0,
    }),
    edit: async (control) => {
      await editNumericControl(control, "Bounce", 50);
      return { bounce: 50 };
    },
    outcome: async (context) => {
      const upperLeftRect = await getPromptRect(context.upperLeftTypography);
      const lowerRightRect = await getPromptRect(context.lowerRightTypography);
      const targetRect = {
        ...context.baseRect,
        x: upperLeftRect.x,
        y: lowerRightRect.y + lowerRightRect.height - context.baseRect.height,
      };
      const delta = {
        x: targetRect.x - context.baseRect.x,
        y: targetRect.y - context.baseRect.y,
      };
      const squaredDistance = delta.x ** 2 + delta.y ** 2;
      await beginCarousel(context);
      await expect
        .poll(
          async () => {
            const current = await getPromptRect(context.layer);
            return (
              ((current.x - context.baseRect.x) * delta.x +
                (current.y - context.baseRect.y) * delta.y) /
              squaredDistance
            );
          },
          { intervals: [25], timeout: 750 },
        )
        .toBeGreaterThan(1.25);
      const landed = await expectLandedAwayFrom(context.prompt, context.layer, context.baseRect);
      expect(getDistance(landed, targetRect)).toBeLessThanOrEqual(2);
    },
  },
  [fineDetailsPromptFlightTargets.ghosts]: {
    target: fineDetailsPromptFlightTargets.ghosts,
    prepare: prepareWith({
      bounce: 0,
      flightTime: 600,
      ghostSpacing: 56,
      ghosts: true,
      offsetX: 0,
      offsetY: 0,
      startDelay: 0,
      vanishStagger: 70,
      vanishTime: 260,
    }),
    edit: async (control) => {
      const active = control.getByRole("switch");
      await active.click();
      await expect(active).not.toBeChecked();
      return { ghosts: false };
    },
    outcome: async (context) => {
      await beginCarousel(context);
      await expect(context.ghosts).toHaveCount(0);
      await expectLandedAwayFrom(context.prompt, context.layer, context.baseRect);

      const active = context.control.getByRole("switch");
      await active.click();
      await expect(active).toBeChecked();
      await expectPromptFlightSettings(context.page, { ghosts: true });
      await setImagesMode(context.page, "Trail");
      await expect(context.prompt).toHaveAttribute("data-fine-details-prompt-flight", "returning");
      await expect
        .poll(async () => (await readGhostOpacities(context.ghosts)).some((value) => value > 0))
        .toBe(true);
      await expect(context.prompt).toHaveAttribute("data-fine-details-prompt-flight", "idle");
    },
  },
  [fineDetailsPromptFlightTargets.ghostSpacing]: {
    target: fineDetailsPromptFlightTargets.ghostSpacing,
    prepare: prepareWith({
      bounce: 0,
      flightTime: 1_800,
      ghostFalloff: 0,
      ghostOpacity: 80,
      ghosts: true,
      offsetX: 0,
      offsetY: 0,
      startDelay: 0,
      vanishStagger: 200,
      vanishTime: 500,
    }),
    edit: async (control) => {
      await editNumericControl(control, "Spacing", 64);
      return { ghostSpacing: 64 };
    },
    outcome: async (context) => {
      await beginCarousel(context);
      await expect
        .poll(
          async () => (await readGhostOpacities(context.ghosts)).filter((value) => value > 0).length,
        )
        .toBeGreaterThanOrEqual(3);
      const firstPrompt = await getPromptRect(context.layer);
      const [first, second, third] = (await readGhostRects(context.ghosts)).slice(0, 3);
      const firstFlightState = await context.prompt.getAttribute(
        "data-fine-details-prompt-flight",
      );
      if (!first || !second || !third) throw new Error("Expected three emerged prompt ghosts.");
      expect(firstFlightState).toBe("flying");
      expect(getCenterDistance(first, second)).toBeGreaterThanOrEqual(61);
      expect(getCenterDistance(first, second)).toBeLessThanOrEqual(67);
      expect(getCenterDistance(second, third)).toBeGreaterThanOrEqual(61);
      expect(getCenterDistance(second, third)).toBeLessThanOrEqual(67);
      await context.page.waitForTimeout(120);
      const secondPrompt = await getPromptRect(context.layer);
      const [firstAgain, secondAgain] = (await readGhostRects(context.ghosts)).slice(0, 2);
      const secondFlightState = await context.prompt.getAttribute(
        "data-fine-details-prompt-flight",
      );
      if (!firstAgain || !secondAgain) throw new Error("Expected stationary prompt breadcrumbs.");
      expect(secondFlightState).toBe("flying");
      expect(getDistance(secondPrompt, firstPrompt)).toBeGreaterThan(5);
      expect(firstAgain).toEqual(first);
      expect(secondAgain).toEqual(second);
      await expect(context.prompt).toHaveAttribute("data-fine-details-prompt-flight", "flying");
      await expectLandedAwayFrom(context.prompt, context.layer, context.baseRect);
      await waitForGhostsToClear(context.ghosts);
    },
  },
  [fineDetailsPromptFlightTargets.ghostOpacity]: {
    target: fineDetailsPromptFlightTargets.ghostOpacity,
    prepare: prepareWith({
      bounce: 0,
      flightTime: 1_800,
      ghostFalloff: 0,
      ghostSpacing: 64,
      ghosts: true,
      offsetX: 0,
      offsetY: 0,
      startDelay: 0,
      vanishStagger: 200,
      vanishTime: 500,
    }),
    edit: async (control) => {
      await editNumericControl(control, "Opacity", 80);
      return { ghostOpacity: 80 };
    },
    outcome: async (context) => {
      await beginCarousel(context);
      await expect
        .poll(
          async () => (await readGhostOpacities(context.ghosts)).filter((value) => value > 0).length,
          { intervals: [20], timeout: 1_200 },
        )
        .toBeGreaterThanOrEqual(3);
      const visible = (await readGhostOpacities(context.ghosts)).filter((value) => value > 0);
      expect(Math.min(...visible)).toBeGreaterThan(0.75);
      expect(Math.max(...visible)).toBeLessThanOrEqual(0.8);
      await expectLandedAwayFrom(context.prompt, context.layer, context.baseRect);
      await waitForGhostsToClear(context.ghosts);
    },
  },
  [fineDetailsPromptFlightTargets.ghostFalloff]: {
    target: fineDetailsPromptFlightTargets.ghostFalloff,
    prepare: prepareWith({
      bounce: 0,
      flightTime: 1_800,
      ghostOpacity: 100,
      ghostSpacing: 64,
      ghosts: true,
      offsetX: 0,
      offsetY: 0,
      startDelay: 0,
      vanishStagger: 200,
      vanishTime: 500,
    }),
    edit: async (control) => {
      await editNumericControl(control, "Falloff", 40);
      return { ghostFalloff: 40 };
    },
    outcome: async (context) => {
      await beginCarousel(context);
      await expect
        .poll(
          async () => (await readGhostOpacities(context.ghosts)).filter((value) => value > 0).length,
        )
        .toBeGreaterThanOrEqual(3);
      const visible = (await readGhostOpacities(context.ghosts)).filter((value) => value > 0);
      const [takeoff = 0, middle = 0, newest = 0] = visible.slice(0, 3);
      expect(takeoff).toBeLessThan(middle);
      expect(middle).toBeLessThan(newest);
      expect(Math.abs(takeoff / middle - 0.6)).toBeLessThan(0.05);
      expect(Math.abs(middle / newest - 0.6)).toBeLessThan(0.05);
      await expectLandedAwayFrom(context.prompt, context.layer, context.baseRect);
      await waitForGhostsToClear(context.ghosts);
    },
  },
  [fineDetailsPromptFlightTargets.vanishStagger]: {
    target: fineDetailsPromptFlightTargets.vanishStagger,
    prepare: prepareWith({
      bounce: 0,
      flightTime: 600,
      ghostFalloff: 0,
      ghostOpacity: 80,
      ghostSpacing: 80,
      ghosts: true,
      offsetX: 0,
      offsetY: 0,
      startDelay: 0,
      vanishTime: 80,
    }),
    edit: async (control) => {
      await editNumericControl(control, "Vanish stagger", 400);
      return { vanishStagger: 400 };
    },
    outcome: async (context) => {
      await beginCarousel(context);
      await expect(context.prompt).toHaveAttribute("data-fine-details-prompt-flight", "landed");
      const landingRect = await getPromptRect(context.layer);
      const pathOrderedAtLanding = orderGhostSnapshotsAlongPath(
        await readGhostSnapshots(context.ghosts),
        context.baseRect,
        landingRect,
      );
      const takeoffSideAtLanding = pathOrderedAtLanding[0];
      const landingSideAtLanding = pathOrderedAtLanding.at(-1);
      if (!takeoffSideAtLanding || !landingSideAtLanding) {
        throw new Error("Expected geometrically distinct prompt breadcrumbs at landing.");
      }
      expect(getCenterDistance(takeoffSideAtLanding, landingSideAtLanding)).toBeGreaterThan(80);
      await expect
        .poll(async () => {
          const pathOrdered = orderGhostSnapshotsAlongPath(
            await readGhostSnapshots(context.ghosts),
            context.baseRect,
            landingRect,
          );
          const takeoffSide = pathOrdered[0];
          const landingSide = pathOrdered.at(-1);
          return {
            landingSideVisible: (landingSide?.opacity ?? 0) > 0,
            takeoffSideGone: (takeoffSide?.opacity ?? 1) <= 0.01,
          };
        })
        .toEqual({ landingSideVisible: true, takeoffSideGone: true });
      await waitForGhostsToClear(context.ghosts);
    },
  },
  [fineDetailsPromptFlightTargets.vanishTime]: {
    target: fineDetailsPromptFlightTargets.vanishTime,
    prepare: prepareWith({
      bounce: 0,
      flightTime: 500,
      ghostFalloff: 0,
      ghostOpacity: 80,
      ghostSpacing: 80,
      ghosts: true,
      offsetX: 0,
      offsetY: 0,
      startDelay: 0,
      vanishStagger: 0,
    }),
    edit: async (control) => {
      await editNumericControl(control, "Vanish time", 700);
      return { vanishTime: 700 };
    },
    outcome: async (context) => {
      await beginCarousel(context);
      await expect
        .poll(
          async () =>
            (await readGhostSnapshots(context.ghosts)).filter(({ opacity }) => opacity > 0.7).length,
          { intervals: [16], timeout: 500 },
        )
        .toBeGreaterThan(0);
      const selected = (await readGhostSnapshots(context.ghosts)).find(
        ({ opacity }) => opacity > 0.7,
      );
      if (!selected) throw new Error("Expected one visible breadcrumb for vanish timing.");

      let observedOnsetAt: number | null = null;
      const observeOnset = expect
        .poll(
          async () => {
            const opacity = await readGhostOpacityAtRect(context.ghosts, selected);
            if (opacity !== null && opacity < selected.opacity - 0.01) {
              observedOnsetAt ??= Date.now();
            }
            return observedOnsetAt !== null;
          },
          { intervals: [16], timeout: 1_200 },
        )
        .toBe(true);
      await Promise.all([
        observeOnset,
        expect(context.prompt).toHaveAttribute("data-fine-details-prompt-flight", "landed"),
      ]);
      if (observedOnsetAt === null) throw new Error("Expected an observed breadcrumb vanish onset.");
      const vanishOnsetAt = observedOnsetAt;

      const lowerBracket = 600;
      const upperBracket = 800;
      await expect
        .poll(() => Date.now() - vanishOnsetAt, {
          intervals: [25],
          timeout: lowerBracket + 100,
        })
        .toBeGreaterThanOrEqual(lowerBracket);
      expect((await readGhostOpacityAtRect(context.ghosts, selected)) ?? 0).toBeGreaterThan(0.001);

      let observedCompletionAt: number | null = null;
      await expect
        .poll(
          async () => {
            const opacity = await readGhostOpacityAtRect(context.ghosts, selected);
            if (opacity === null || opacity <= 0.001) observedCompletionAt ??= Date.now();
            return observedCompletionAt !== null;
          },
          { intervals: [16], timeout: upperBracket - lowerBracket + 100 },
        )
        .toBe(true);
      if (observedCompletionAt === null) {
        throw new Error("Expected the selected breadcrumb vanish to complete.");
      }
      const observedVanishTime = observedCompletionAt - vanishOnsetAt;
      expect(observedVanishTime).toBeGreaterThanOrEqual(lowerBracket);
      expect(observedVanishTime).toBeLessThanOrEqual(upperBracket);
      await waitForGhostsToClear(context.ghosts);
    },
  },
} satisfies {
  [Target in PromptFlightTarget]: PromptFlightEvidenceCase & { target: Target };
};

export const promptFlightEvidenceCases = [
  promptFlightEvidenceRegistry[fineDetailsPromptFlightTargets.enabled],
  promptFlightEvidenceRegistry[fineDetailsPromptFlightTargets.offsetX],
  promptFlightEvidenceRegistry[fineDetailsPromptFlightTargets.offsetY],
  promptFlightEvidenceRegistry[fineDetailsPromptFlightTargets.startDelay],
  promptFlightEvidenceRegistry[fineDetailsPromptFlightTargets.flightTime],
  promptFlightEvidenceRegistry[fineDetailsPromptFlightTargets.bounce],
  promptFlightEvidenceRegistry[fineDetailsPromptFlightTargets.ghosts],
  promptFlightEvidenceRegistry[fineDetailsPromptFlightTargets.ghostSpacing],
  promptFlightEvidenceRegistry[fineDetailsPromptFlightTargets.ghostOpacity],
  promptFlightEvidenceRegistry[fineDetailsPromptFlightTargets.ghostFalloff],
  promptFlightEvidenceRegistry[fineDetailsPromptFlightTargets.vanishStagger],
  promptFlightEvidenceRegistry[fineDetailsPromptFlightTargets.vanishTime],
] as const;
