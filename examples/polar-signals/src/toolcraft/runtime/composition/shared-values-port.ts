export type ToolcraftDocumentValues = Readonly<Record<string, string | number>>;

export type ToolcraftSharedValuesOperation =
  | { type: "set"; target: string; value: string | number; gestureId?: string }
  | { type: "setMany"; values: ToolcraftDocumentValues }
  | { type: "reset"; targets?: string[] }
  | { type: "undo" | "redo" };
export type ToolcraftSharedValuesSnapshot = Readonly<{
  values: ToolcraftDocumentValues;
  defaults: ToolcraftDocumentValues;
  history: { canUndo: boolean; canRedo: boolean };
  pending: ToolcraftDocumentValues;
  editable: boolean;
  status: "connected" | "pending" | "disconnected" | "conflict";
}>;
export type ToolcraftSharedValuesPort = Readonly<{
  targets: readonly string[];
  getSnapshot(): ToolcraftSharedValuesSnapshot;
  subscribe(listener: () => void): () => void;
  submit(operation: ToolcraftSharedValuesOperation): void;
}>;
