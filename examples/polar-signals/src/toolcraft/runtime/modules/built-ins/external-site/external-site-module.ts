import { createBuiltInToolcraftProductModuleDefinition } from "../../contract/module-definition";
import { TOOLCRAFT_DOCUMENT_VIEWPORT_OPERATIONS } from "../../contract/contribution";
import { validateContribution } from "./declaration";

const definition = createBuiltInToolcraftProductModuleDefinition(
  {
    id: "external-site",
    contributions: [
      { id: "external-site.toolbar", kind: "panel-surface", moduleId: "external-site", surface: "document-toolbar", configuration: true },
      {
        id: "external-site.behavior",
        kind: "canvas-behavior",
        moduleId: "external-site",
        behavior: "external-document",
        operations: TOOLCRAFT_DOCUMENT_VIEWPORT_OPERATIONS,
      },
    ],
    defaultProviders: [],
    portRequirements: [{ applicability: "always", id: "scene.externalDocument" }],
    provides: ["document.external-site"],
    requires: [],
  },
  validateContribution,
);

export function externalSiteModule() {
  return definition;
}
