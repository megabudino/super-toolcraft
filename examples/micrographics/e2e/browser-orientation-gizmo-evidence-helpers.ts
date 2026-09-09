import { expect } from "@playwright/test";

import { attachToolcraftBrowserRuntimeEvidence } from "./browser-runtime-evidence";
import {
  createToolcraftSemanticTransitionOptions,
  expectToolcraftExpectedOutcomeAfterAction,
  type ToolcraftSemanticEvidenceOptions,
} from "./browser-acceptance-transition-helpers";
import {
  assertToolcraftBrowserProofSession,
  readToolcraftBrowserObservation,
  runToolcraftBrowserAction,
  type ToolcraftBrowserAction,
  type ToolcraftBrowserObservation,
  type ToolcraftBrowserProofSession,
} from "./browser-proof-session";
import {
  expectToolcraftPersistentOutcomeChange,
  expectToolcraftStableOutcomeBaseline,
  snapshotToolcraftOutcome,
} from "./stable-outcome-helpers";

export type ToolcraftOrientationBrowserObservation = {
  outputSignature: string;
  pixelSignature: string;
  pose: {
    position: readonly [number, number, number];
    up: readonly [number, number, number];
  };
  poseTarget: string;
  presentationCacheKey: string;
  presentationDocumentId: string;
  viewportOffsetX: number;
  viewportOffsetY: number;
};

export type ToolcraftOrientationEvidenceOptions =
  ToolcraftSemanticEvidenceOptions & {
    target: string;
  };

export type ToolcraftOrientationModelDragEvidenceOptions =
  ToolcraftOrientationEvidenceOptions & {
    dragDelta: Readonly<{ x: number; y: number }>;
  };

type ToolcraftOrientationAxis = "+x" | "-x" | "+y" | "-y" | "+z" | "-z";

const axisVectors: Record<
  ToolcraftOrientationAxis,
  readonly [number, number, number]
> = {
  "+x": [1, 0, 0],
  "-x": [-1, 0, 0],
  "+y": [0, 1, 0],
  "-y": [0, -1, 0],
  "+z": [0, 0, 1],
  "-z": [0, 0, -1],
};

const modelOrbitSurfaceSelector =
  '[data-canvas-model-layer][data-toolcraft-model-orbit-surface="true"]';

function expectNonBlankSignature(value: string, description: string): void {
  expect(value.trim(), description).not.toBe("");
  expect(/^(?:blank|empty|none|transparent)$/iu.test(value.trim())).toBe(false);
}

function getMessage(
  behavior: string,
  requirementId: string,
): string {
  return `Orientation ${behavior} "${requirementId}" must update the shared runtime pose and product output with correct canvas ownership.`;
}

function validateObservation(
  observation: ToolcraftOrientationBrowserObservation,
  options: ToolcraftOrientationEvidenceOptions,
): void {
  expect(
    observation.poseTarget,
    `Orientation evidence "${options.requirementId}" must identify the runtime pose target.`,
  ).toBe(options.target);
  expectNonBlankSignature(
    observation.outputSignature,
    `Orientation evidence "${options.requirementId}" must report a stable product-output signature.`,
  );
  expectNonBlankSignature(
    observation.pixelSignature,
    `Orientation evidence "${options.requirementId}" must report nonblank sampled model pixels.`,
  );
  expectNonBlankSignature(
    observation.presentationDocumentId,
    `Orientation evidence "${options.requirementId}" must identify the rendered canonical document.`,
  );
  expectNonBlankSignature(
    observation.presentationCacheKey,
    `Orientation evidence "${options.requirementId}" must identify the shared appearance cache entry.`,
  );
  for (const [name, vector] of Object.entries(observation.pose)) {
    expect(
      vector.length,
      `Orientation evidence "${options.requirementId}" ${name} must be a three-component vector.`,
    ).toBe(3);
    expect(
      vector.every((value) => Number.isFinite(value)),
      `Orientation evidence "${options.requirementId}" ${name} must contain finite values.`,
    ).toBe(true);
  }
  expect(Math.hypot(...observation.pose.position)).toBeGreaterThan(1e-6);
  expect(Math.hypot(...observation.pose.up)).toBeGreaterThan(1e-6);
  const [positionX, positionY, positionZ] = observation.pose.position;
  const [upX, upY, upZ] = observation.pose.up;
  expect(
    Math.hypot(
      positionY * upZ - positionZ * upY,
      positionZ * upX - positionX * upZ,
      positionX * upY - positionY * upX,
    ),
    `Orientation evidence "${options.requirementId}" position and up vectors must not be collinear.`,
  ).toBeGreaterThan(1e-6);
  expect(Number.isFinite(observation.viewportOffsetX)).toBe(true);
  expect(Number.isFinite(observation.viewportOffsetY)).toBe(true);
}

async function expectOrientationTransition(
  observation: ToolcraftBrowserObservation<ToolcraftOrientationBrowserObservation>,
  action: ToolcraftBrowserAction,
  behavior: string,
  options: ToolcraftOrientationEvidenceOptions,
): Promise<{
  after: ToolcraftOrientationBrowserObservation;
  before: ToolcraftOrientationBrowserObservation;
}> {
  assertToolcraftBrowserProofSession(observation, action);
  const observe = () => readToolcraftBrowserObservation(observation);
  const message = getMessage(behavior, options.requirementId);
  const transitionOptions = createToolcraftSemanticTransitionOptions(
    message,
    options,
  );
  const before = snapshotToolcraftOutcome(await observe(), message);

  validateObservation(before, options);
  await expectToolcraftStableOutcomeBaseline(
    observe,
    before,
    transitionOptions,
  );
  await runToolcraftBrowserAction(action);
  const after = await expectToolcraftPersistentOutcomeChange(
    observe,
    before,
    transitionOptions,
  );
  validateObservation(after, options);

  return { after, before };
}

function expectPoseAndOutputChange(
  before: ToolcraftOrientationBrowserObservation,
  after: ToolcraftOrientationBrowserObservation,
  options: ToolcraftOrientationEvidenceOptions,
): void {
  expect(
    after.pose,
    `Orientation "${options.requirementId}" must change the shared pose.`,
  ).not.toEqual(before.pose);
  expect(
    after.outputSignature,
    `Orientation "${options.requirementId}" must change product output from the same pose.`,
  ).not.toBe(before.outputSignature);
  expect(
    after.pixelSignature,
    `Orientation "${options.requirementId}" must change sampled rendered pixels from the same pose.`,
  ).not.toBe(before.pixelSignature);
  expect(after.presentationDocumentId).toBe(before.presentationDocumentId);
  expect(after.presentationCacheKey).toBe(before.presentationCacheKey);
  expect({ x: after.viewportOffsetX, y: after.viewportOffsetY }).toEqual({
    x: before.viewportOffsetX,
    y: before.viewportOffsetY,
  });
}

async function attachOrientationEvidence(
  evidenceType:
    | "orientation-axis-drag"
    | "orientation-axis-snap"
    | "orientation-canvas-miss-pan"
    | "orientation-model-drag"
    | "orientation-shared-pose-output"
    | "orientation-undo-reset"
    | "product-observable-change",
  coverage: string | null,
  options: ToolcraftOrientationEvidenceOptions,
): Promise<void> {
  await attachToolcraftBrowserRuntimeEvidence({
    evidenceType,
    requirementId:
      coverage === null
        ? options.requirementId
        : `${options.requirementId}#${coverage}`,
    target: options.target,
  });
}

export async function expectToolcraftOrientationAxisDrag(
  observation: ToolcraftBrowserObservation<ToolcraftOrientationBrowserObservation>,
  action: ToolcraftBrowserAction,
  options: ToolcraftOrientationEvidenceOptions,
): Promise<ToolcraftOrientationBrowserObservation> {
  const { after, before } = await expectOrientationTransition(
    observation,
    action,
    "axis drag",
    options,
  );
  expectPoseAndOutputChange(before, after, options);
  await attachOrientationEvidence(
    "orientation-axis-drag",
    "axis-drag",
    options,
  );
  await attachOrientationEvidence(
    "orientation-shared-pose-output",
    "shared-pose-output",
    options,
  );
  await attachOrientationEvidence(
    "product-observable-change",
    null,
    options,
  );
  return after;
}

export async function expectToolcraftOrientationAxisSnap(
  observation: ToolcraftBrowserObservation<ToolcraftOrientationBrowserObservation>,
  action: ToolcraftBrowserAction,
  axis: ToolcraftOrientationAxis,
  options: ToolcraftOrientationEvidenceOptions,
): Promise<ToolcraftOrientationBrowserObservation> {
  const { after, before } = await expectOrientationTransition(
    observation,
    action,
    "axis snap",
    options,
  );
  expectPoseAndOutputChange(before, after, options);
  const radius = Math.hypot(...before.pose.position);
  const expectedPosition = axisVectors[axis].map(
    (component) => component * radius,
  );

  after.pose.position.forEach((component, index) => {
    expect(component).toBeCloseTo(expectedPosition[index] ?? 0, 4);
  });
  await attachOrientationEvidence(
    "orientation-axis-snap",
    "axis-snap",
    options,
  );
  return after;
}

export async function expectToolcraftOrientationModelDrag(
  observation: ToolcraftBrowserObservation<ToolcraftOrientationBrowserObservation>,
  session: ToolcraftBrowserProofSession,
  options: ToolcraftOrientationModelDragEvidenceOptions,
): Promise<ToolcraftOrientationBrowserObservation> {
  expect(
    Number.isFinite(options.dragDelta.x) && Number.isFinite(options.dragDelta.y),
    "Direct model orbit proof requires a finite pointer delta.",
  ).toBe(true);
  expect(
    Math.hypot(options.dragDelta.x, options.dragDelta.y),
    "Direct model orbit proof requires non-zero pointer movement.",
  ).toBeGreaterThan(0);
  const action = session.action(async (page) => {
    const surface = page.locator(modelOrbitSurfaceSelector);
    await expect(
      surface,
      "Direct model orbit proof requires exactly one visible runtime model orbit surface.",
    ).toHaveCount(1);
    await expect(surface).toBeVisible();
    const box = await surface.boundingBox();
    if (!box) {
      throw new Error("Direct model orbit proof could not measure the runtime model surface.");
    }
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    try {
      await page.mouse.move(
        startX + options.dragDelta.x,
        startY + options.dragDelta.y,
        { steps: 8 },
      );
    } finally {
      await page.mouse.up();
    }
  });
  const { after, before } = await expectOrientationTransition(
    observation,
    action,
    "model drag",
    options,
  );
  expectPoseAndOutputChange(before, after, options);
  await attachOrientationEvidence(
    "orientation-model-drag",
    "model-drag",
    options,
  );
  return after;
}

export async function expectToolcraftOrientationCanvasMissPan(
  observation: ToolcraftBrowserObservation<ToolcraftOrientationBrowserObservation>,
  action: ToolcraftBrowserAction,
  options: ToolcraftOrientationEvidenceOptions,
): Promise<ToolcraftOrientationBrowserObservation> {
  const { after, before } = await expectOrientationTransition(
    observation,
    action,
    "canvas miss pan",
    options,
  );

  expect(after.pose).toEqual(before.pose);
  expect(after.outputSignature).toBe(before.outputSignature);
  expect(after.pixelSignature).toBe(before.pixelSignature);
  expect(after.presentationDocumentId).toBe(before.presentationDocumentId);
  expect(after.presentationCacheKey).toBe(before.presentationCacheKey);
  expect({ x: after.viewportOffsetX, y: after.viewportOffsetY }).not.toEqual({
    x: before.viewportOffsetX,
    y: before.viewportOffsetY,
  });
  await attachOrientationEvidence(
    "orientation-canvas-miss-pan",
    "canvas-miss-pan",
    options,
  );
  return after;
}

export async function expectToolcraftOrientationUndoReset(
  observation: ToolcraftBrowserObservation<ToolcraftOrientationBrowserObservation>,
  undoAction: ToolcraftBrowserAction,
  redoAction: ToolcraftBrowserAction,
  resetAction: ToolcraftBrowserAction,
  expectedBaseline: ToolcraftOrientationBrowserObservation,
  expectedChanged: ToolcraftOrientationBrowserObservation,
  options: ToolcraftOrientationEvidenceOptions,
): Promise<void> {
  assertToolcraftBrowserProofSession(
    observation,
    undoAction,
    redoAction,
    resetAction,
  );
  validateObservation(expectedBaseline, options);
  validateObservation(expectedChanged, options);
  expect(expectedChanged.pose).not.toEqual(expectedBaseline.pose);
  expect(expectedChanged.outputSignature).not.toBe(
    expectedBaseline.outputSignature,
  );
  expect(expectedChanged.pixelSignature).not.toBe(
    expectedBaseline.pixelSignature,
  );
  expect(expectedChanged.presentationDocumentId).toBe(
    expectedBaseline.presentationDocumentId,
  );
  expect(expectedChanged.presentationCacheKey).toBe(
    expectedBaseline.presentationCacheKey,
  );
  expect(await readToolcraftBrowserObservation(observation)).toEqual(
    expectedChanged,
  );
  const transitionOptions = createToolcraftSemanticTransitionOptions(
    getMessage("undo/reset", options.requirementId),
    options,
  );

  await expectToolcraftExpectedOutcomeAfterAction(
    observation,
    undoAction,
    expectedBaseline,
    transitionOptions,
  );
  await expectToolcraftExpectedOutcomeAfterAction(
    observation,
    redoAction,
    expectedChanged,
    transitionOptions,
  );
  await expectToolcraftExpectedOutcomeAfterAction(
    observation,
    resetAction,
    expectedBaseline,
    transitionOptions,
  );
  await attachOrientationEvidence(
    "orientation-undo-reset",
    "undo-reset",
    options,
  );
}
