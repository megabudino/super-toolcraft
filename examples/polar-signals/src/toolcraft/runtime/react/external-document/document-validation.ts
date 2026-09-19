import { conflictsWithExternalSite } from "../../modules/built-ins/external-site/declaration";
import type { ResolvedToolcraftAppSchema } from "../../schema/resolved-app-schema";
import type { ToolcraftAppPorts } from "../app-shell/toolcraft-app-ports";

export function assertExternalDocumentPorts(
  schema: ResolvedToolcraftAppSchema,
  ports: ToolcraftAppPorts,
) {
  const document = ports.scene?.externalDocument;
  if (!document) return;
  const url = new URL(document.url);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password)
    throw new Error("Invalid external document URL.");
  if (
    typeof document.connect !== "function" ||
    !document.projectId ||
    !document.runId ||
    !document.fingerprint ||
    !document.title ||
    new Set(document.targets).size !== document.targets.length
  )
    throw new Error("Invalid external document identity or targets.");
  if (
    schema.modulePlan.capabilities.some(({ capabilityId }) =>
      conflictsWithExternalSite(capabilityId),
    ) ||
    ports.scene?.canvasContent !== undefined ||
    ports.scene?.infiniteCanvasContent !== undefined ||
    ports.scene?.rasterFrameRenderer ||
    ports.scene?.vectorFrameRenderer ||
    ports.scene?.sceneBoundsProvider ||
    ports.modelPresentation ||
    ports.renderer
  ) {
    throw new Error(
      "External documents own their page, input and viewport; graphical scenes, media and export modules cannot be combined with this presentation.",
    );
  }
  if (!schema.canvas.enabled || schema.canvas.upload)
    throw new Error("External documents require a canvas without source uploads.");
  if (
    document.sharedValues &&
    (document.sharedValues.targets.length !== document.targets.length ||
      document.sharedValues.targets.some((target) => !document.targets.includes(target)))
  )
    throw new Error("Shared values must own exactly the external document targets.");
}
