export type ToolcraftModelImportCoverage =
  | "advertised-format-import"
  | "clean-commit"
  | "export-output"
  | "fatal-rejection"
  | "history-reset"
  | "persistence-restore"
  | "preview-output"
  | "repair-action"
  | "repair-progress"
  | "repairable-diagnosis"
  | "resource-unavailable"
  | "staged-preview"
  | "verified-repair";

export const TOOLCRAFT_REQUIRED_MODEL_IMPORT_COVERAGE = [
  "advertised-format-import",
  "staged-preview",
  "clean-commit",
  "repairable-diagnosis",
  "repair-action",
  "repair-progress",
  "verified-repair",
  "fatal-rejection",
  "persistence-restore",
  "resource-unavailable",
  "preview-output",
  "export-output",
  "history-reset",
] as const satisfies readonly ToolcraftModelImportCoverage[];
