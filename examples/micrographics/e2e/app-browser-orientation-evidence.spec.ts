import { expect, test, type Page } from "@playwright/test";

import {
  expectToolcraftOrientationAxisDrag,
  expectToolcraftOrientationAxisSnap,
  expectToolcraftOrientationCanvasMissPan,
  expectToolcraftOrientationModelDrag,
  expectToolcraftOrientationUndoReset,
  type ToolcraftOrientationBrowserObservation,
} from "./browser-orientation-gizmo-evidence-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import {
  attachedEvidenceTypes,
  setProofState,
} from "./browser-semantic-evidence-test-helpers";

async function installModelOrbitPointerProbe(
  page: Page,
  next: ToolcraftOrientationBrowserObservation,
): Promise<void> {
  await page.locator('[data-slot="toolcraft-runtime-app"]').evaluate(
    (root, observation) => {
      root.querySelector('[data-orientation-model-drag-probe]')?.remove();
      const surface = document.createElement("div");
      surface.dataset.orientationModelDragProbe = "";
      surface.dataset.canvasModelLayer = "proof-model";
      surface.dataset.toolcraftModelOrbitSurface = "true";
      Object.assign(surface.style, {
        height: "120px",
        left: "240px",
        position: "absolute",
        top: "160px",
        width: "160px",
        zIndex: "1000",
      });
      surface.addEventListener("pointerup", () => {
        root.setAttribute(
          "data-proof-orientation",
          JSON.stringify(observation),
        );
      });
      root.append(surface);
    },
    next,
  );
}

test("orientation recipes require shared pose/output changes and correct canvas ownership", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  const attachmentCount = testInfo.attachments.length;
  const baseline: ToolcraftOrientationBrowserObservation = {
    outputSignature: "model-front",
    pixelSignature: "pixels-front",
    pose: { position: [0, 0, 5], up: [0, 1, 0] },
    poseTarget: "view.orbit",
    presentationCacheKey: "appearance:document-model:v2",
    presentationDocumentId: "document-model",
    viewportOffsetX: 0,
    viewportOffsetY: 0,
  };
  const dragged: ToolcraftOrientationBrowserObservation = {
    ...baseline,
    outputSignature: "model-dragged",
    pixelSignature: "pixels-dragged",
    pose: { position: [1, 1, 4.8], up: [0, 1, 0] },
  };
  const options = {
    requirementId: "model.orientation",
    stabilityIntervalMs: 0,
    target: "view.orbit",
  } as const;

  await setProofState(page, "orientation", baseline);
  const observation = session.observe((root) =>
    JSON.parse(root.getAttribute("data-proof-orientation") ?? "null"),
  );
  await expect(
    expectToolcraftOrientationAxisDrag(
      observation,
      session.action((currentPage) =>
        setProofState(currentPage, "orientation", {
          ...dragged,
          pixelSignature: baseline.pixelSignature,
        }),
      ),
      options,
    ),
  ).rejects.toThrow(/must change sampled rendered pixels/);
  expect(testInfo.attachments).toHaveLength(attachmentCount);

  await setProofState(page, "orientation", baseline);
  await expectToolcraftOrientationAxisDrag(
    observation,
    session.action((currentPage) =>
      setProofState(currentPage, "orientation", dragged),
    ),
    options,
  );
  await expectToolcraftOrientationUndoReset(
    observation,
    session.action((currentPage) =>
      setProofState(currentPage, "orientation", baseline),
    ),
    session.action((currentPage) =>
      setProofState(currentPage, "orientation", dragged),
    ),
    session.action((currentPage) =>
      setProofState(currentPage, "orientation", baseline),
    ),
    baseline,
    dragged,
    options,
  );

  const snapped: ToolcraftOrientationBrowserObservation = {
    ...baseline,
    outputSignature: "model-positive-x",
    pixelSignature: "pixels-positive-x",
    pose: { position: [5, 0, 0], up: [0, 1, 0] },
  };
  await expectToolcraftOrientationAxisSnap(
    observation,
    session.action((currentPage) =>
      setProofState(currentPage, "orientation", snapped),
    ),
    "+x",
    options,
  );

  await setProofState(page, "orientation", baseline);
  const modelDragged: ToolcraftOrientationBrowserObservation = {
    ...baseline,
    outputSignature: "model-direct-drag",
    pixelSignature: "pixels-direct-drag",
    pose: { position: [-1, 1, 4.8], up: [0, 1, 0] },
  };
  await expect(
    expectToolcraftOrientationModelDrag(
      observation,
      session,
      { ...options, dragDelta: { x: 28, y: 18 } },
    ),
  ).rejects.toThrow(/exactly one visible runtime model orbit surface/);
  expect(testInfo.attachments).toHaveLength(attachmentCount + 5);
  await installModelOrbitPointerProbe(page, modelDragged);
  await expectToolcraftOrientationModelDrag(
    observation,
    session,
    { ...options, dragDelta: { x: 28, y: 18 } },
  );

  await setProofState(page, "orientation", baseline);
  await expectToolcraftOrientationCanvasMissPan(
    observation,
    session.action((currentPage) =>
      setProofState(currentPage, "orientation", {
        ...baseline,
        viewportOffsetX: 24,
        viewportOffsetY: -12,
      }),
    ),
    options,
  );

  expect(attachedEvidenceTypes(testInfo, attachmentCount)).toEqual([
    "orientation-axis-drag",
    "orientation-shared-pose-output",
    "product-observable-change",
    "orientation-undo-reset",
    "orientation-axis-snap",
    "orientation-model-drag",
    "orientation-canvas-miss-pan",
  ]);
});
