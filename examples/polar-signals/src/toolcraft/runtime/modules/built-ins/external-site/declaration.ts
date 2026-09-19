import {
  TOOLCRAFT_DOCUMENT_VIEWPORT_OPERATIONS,
  type ToolcraftProductModuleContribution,
} from "../../contract/contribution";
import { requireValidContribution, hasExactTuple } from "../../contract/contribution-validation";
export function validateContribution(
  contribution: ToolcraftProductModuleContribution,
): ToolcraftProductModuleContribution {
  requireValidContribution(
    contribution.id,
    (contribution.id === "external-site.toolbar" && contribution.kind === "panel-surface" &&
      contribution.moduleId === "external-site" && contribution.surface === "document-toolbar" && contribution.configuration === true) ||
    contribution.id === "external-site.behavior" &&
      contribution.kind === "canvas-behavior" &&
      contribution.moduleId === "external-site" &&
      contribution.behavior === "external-document" &&
      hasExactTuple(contribution.operations, TOOLCRAFT_DOCUMENT_VIEWPORT_OPERATIONS),
  );
  return contribution;
}

import type { ToolcraftProductCapabilityId } from "../../contract/capability";
const graphicalCapabilities: ReadonlySet<string> = new Set<ToolcraftProductCapabilityId>([
  "artifact.image-export",
  "artifact.svg-export",
  "artifact.video-export",
  "canvas.editing",
  "layers.management",
  "media.source",
  "model.3d",
  "spatial.view",
  "timeline.keyframes",
  "timeline.playback",
]);
export function conflictsWithExternalSite(capabilityId: string): boolean {
  return graphicalCapabilities.has(capabilityId);
}
