import type { ResolvedToolcraftAppSchema } from "@/toolcraft/runtime";

import {
  schemaHasPngExportPanelAction,
  schemaHasSvgExportPanelAction,
  schemaHasVideoExportPanelAction,
} from "./output-export-actions";
import type {
  ToolcraftAcceptanceEvidence,
  ToolcraftComponentAcceptance,
  ToolcraftInfinityCanvasCoverage,
  ToolcraftProductReadiness,
} from "./types";

type RequiredInfinityCanvasProof = Readonly<{
  coverage: ToolcraftInfinityCanvasCoverage;
  evidence: ToolcraftAcceptanceEvidence;
  message: string;
}>;

function hasInfinityCanvasProof(
  acceptance: readonly ToolcraftComponentAcceptance[],
  proof: RequiredInfinityCanvasProof,
): boolean {
  return acceptance.some(
    (entry) =>
      entry.kind === "runtime" &&
      entry.automated &&
      entry.browser &&
      entry.infinityCanvasCoverage === proof.coverage &&
      entry.evidence === proof.evidence,
  );
}

export function getToolcraftInfinityCanvasCoverageErrors({
  acceptance,
  productReadiness,
  schema,
}: {
  acceptance: readonly ToolcraftComponentAcceptance[];
  productReadiness: ToolcraftProductReadiness;
  schema: ResolvedToolcraftAppSchema;
}): string[] {
  if (
    productReadiness.mode !== "product" ||
    !schema.canvas.enabled ||
    schema.canvas.sizing.mode !== "editable-output"
  ) {
    return [];
  }

  const requiredProofs: RequiredInfinityCanvasProof[] = [
    {
      coverage: "mode-continuity-and-restoration",
      evidence: "viewport-side-effect",
      message:
        'canvas.sizing mode "editable-output" requires a runtime acceptance entry with infinityCanvasCoverage "mode-continuity-and-restoration" proving Infinity canvas changes only the finite boundary and size controls while preserving the world frame, view, renderer identity, backing, and dormant finite size for restoration without centering.',
    },
  ];

  if (schemaHasPngExportPanelAction(schema)) {
    requiredProofs.push({
      coverage: "scene-bounds-image-export",
      evidence: "exported-bytes",
      message:
        'Export PNG with editable-output canvas requires a runtime acceptance entry with infinityCanvasCoverage "scene-bounds-image-export" proving Infinity preserves the saved finite artboard dimensions, crop, background and decoded image content.',
    });
  }

  if (schemaHasSvgExportPanelAction(schema)) {
    requiredProofs.push({
      coverage: "scene-bounds-svg-export",
      evidence: "exported-bytes",
      message:
        'Export SVG with editable-output canvas requires a runtime acceptance entry with infinityCanvasCoverage "scene-bounds-svg-export" proving Infinity preserves the saved finite artboard dimensions, viewBox and vector content.',
    });
  }

  if (schemaHasVideoExportPanelAction(schema)) {
    requiredProofs.push({
      coverage: "scene-bounds-video-export",
      evidence: "exported-bytes",
      message:
        'Export Video with editable-output canvas requires a runtime acceptance entry with infinityCanvasCoverage "scene-bounds-video-export" proving Infinity preserves the saved finite artboard dimensions, duration and decoded video frames.',
    });
  }

  return requiredProofs
    .filter((proof) => !hasInfinityCanvasProof(acceptance, proof))
    .map((proof) => proof.message);
}
