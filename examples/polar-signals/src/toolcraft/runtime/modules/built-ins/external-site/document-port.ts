export type ToolcraftDocumentViewportInput =
  | { type: "wheel"; x: number; y: number; deltaX: number; deltaY: number; zoom: boolean }
  | { type: "gesture"; phase: "start" | "change" | "end"; x: number; y: number; scale: number };
import type {
  ToolcraftDocumentValues,
  ToolcraftSharedValuesPort,
} from "../../../composition/shared-values-port";

export type ToolcraftDocumentConnectionStatus = "loading" | "handshaking" | "connected" | "failed";
export type ToolcraftDocumentToolbarPorts = Readonly<{
  viewport: { getWidth(): number; setWidth(width: number): void; subscribe(changed: () => void): () => void };
  theme: { getSnapshot(): "light" | "dark"; subscribe(changed: () => void): () => void };
  preferences: { load(): unknown; save(snapshot: unknown): void };
  onError(error: unknown): void;
}>;
export type ToolcraftDocumentSession = Readonly<{
  navigation?: import("./navigation").DocumentNavigationPort;
  mountToolbar?(container: HTMLElement, ports: ToolcraftDocumentToolbarPorts): () => void;
  setTheme(theme: "light" | "dark"): void;
  measureViewport(size: {
    width: number;
    height: number;
    observe?: boolean;
  }): Promise<{ width: number; height: number; contentHeight: number; intrinsicHeight?: number }>;
  update(values: ToolcraftDocumentValues): void;
  /** Same document identity loaded again; retain bounded pending preview confirmation. */
  reload(): void;
  /** Refresh the current guest location while retaining this document identity. */
  refresh(): void;
  dispose(): void;
  flush(values: ToolcraftDocumentValues): Promise<void>;
}>;
export type ToolcraftExternalDocumentPort = Readonly<{
  projectId: string;
  runId: string;
  /** Change to reload the document after reconnecting to its authority. */
  loadKey?: string;
  /** Completed external content; changes refresh the same iframe/session. */
  contentRevision?: string;
  fingerprint: string;
  url: string;
  title: string;
  pages?: readonly Readonly<{ label: string; path: string }>[];
  targets: readonly string[];
  sharedValues?: ToolcraftSharedValuesPort;
  connect(
    frame: HTMLIFrameElement,
    events: {
      url: string;
      theme: "light" | "dark";
      onViewportInput?(input: ToolcraftDocumentViewportInput): void;
      onViewportChange(): void;
      onBackgroundChange(color: string | null): void;
      onStatus(status: ToolcraftDocumentConnectionStatus, error?: string): void;
    },
  ): ToolcraftDocumentSession;
  onStatus?(status: ToolcraftDocumentConnectionStatus, error?: string): void;
  /** Registered before the iframe can be used; retired before its replacement registers. */
  onSession?(session: ToolcraftDocumentSession | null): void;
}>;
