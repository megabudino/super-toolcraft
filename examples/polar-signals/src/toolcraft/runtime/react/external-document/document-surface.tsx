"use client";
import type { CanvasNavigationInput } from "../canvas/canvas-navigation-controller";
import { useExternalDocumentSession } from "./document-session-context";
import { useDocumentViewport } from "./use-document-viewport";
import * as React from "react";
import type { ToolcraftDocumentValues } from "../../composition/shared-values-port";
import type {
  ToolcraftDocumentSession,
  ToolcraftExternalDocumentPort,
} from "../../modules/built-ins/external-site/document-port";
import type { ToolcraftState } from "../../state/types";
import { useToolcraftCommittedSelector } from "../app-shell/toolcraft-selectors";
import { useToolcraftTheme } from "../app-shell/theme-runtime";
import { useToolcraftStore } from "../app-shell/toolcraft-store-context";
import { readDocumentPage } from "../../modules/built-ins/external-site/navigation";

const selectCanvasSize = (state: ToolcraftState) => state.canvas.size;
export function ToolcraftExternalDocumentSurface({
  document,
  onViewportInput,
}: {
  document: ToolcraftExternalDocumentPort;
  onViewportInput?(input: CanvasNavigationInput): void;
}) {
  return (
    <DocumentFrame
      key={JSON.stringify([
        document.projectId,
        document.runId,
        document.loadKey,
        document.fingerprint,
        new URL(document.url).origin,
      ])}
      document={document}
      onViewportInput={onViewportInput}
    />
  );
}

function DocumentFrame({
  document,
  onViewportInput,
}: {
  document: ToolcraftExternalDocumentPort;
  onViewportInput?(input: CanvasNavigationInput): void;
}) {
  const { publish } = useExternalDocumentSession();
  const store = useToolcraftStore();
  const [initialUrl] = React.useState(() => {
    const page = readDocumentPage(store.getCommittedState().canvas.documentView?.page);
    return page ? new URL(page, document.url).href : document.url;
  });
  const frame = React.useRef<HTMLIFrameElement>(null);
  const session = React.useRef<ToolcraftDocumentSession | null>(null);
  const viewport = useDocumentViewport(frame, session);
  const { resolvedTheme } = useToolcraftTheme();
  const currentDocument = React.useRef(document);
  currentDocument.current = document;
  const inputHandler = React.useRef(onViewportInput);
  inputHandler.current = onViewportInput;
  const clipped = useToolcraftCommittedSelector(state =>
    state.documentViewport?.contentHeight === undefined ||
    state.canvas.size.height + 1 < state.documentViewport.contentHeight);
  const contentRevision = React.useRef(document.contentRevision);
  const size = useToolcraftCommittedSelector(selectCanvasSize);
  const selectValues = React.useCallback(
    (state: ToolcraftState): ToolcraftDocumentValues =>
      Object.fromEntries(
        document.targets.map((target) => {
          const value = state.values[target];
          if (typeof value !== "number" && typeof value !== "string")
            throw new Error(`Invalid external document value: ${target}`);
          return [target, value];
        }),
      ),
    [document.targets],
  );
  const values = useToolcraftCommittedSelector(selectValues, (a, b) =>
    document.targets.every((target) => a[target] === b[target]),
  );
  const latest = React.useRef(values);
  latest.current = values;
  React.useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return;
    let active = true;
    const owner = currentDocument.current;
    owner.onStatus?.("loading");
    // The keyed iframe owns its session before paint, including while loading.
    // flush waits for the guest using the session's existing confirmation deadline.
    const current = owner.connect(element, {
      url: initialUrl,
      theme: resolvedTheme,
      onStatus: (status, message) => {
        if (!active) return;
        viewport.onStatus(status);
        if (status !== "connected")
          inputHandler.current?.({
            type: "gesture",
            phase: "end",
            clientX: 0,
            clientY: 0,
            scale: 1,
          });
        currentDocument.current.onStatus?.(status, message);
      },
      onViewportChange: viewport.onViewportChange,
      onBackgroundChange: (color) => {
        if (active) store.dispatch({ type: "document.setBackground", color });
      },
      onViewportInput: onViewportInput
        ? (input) => {
            if (!active) return;
            const rect = element.getBoundingClientRect();
            inputHandler.current?.({
              ...input,
              clientX: rect.left + input.x * rect.width,
              clientY: rect.top + input.y * rect.height,
            });
          }
        : undefined,
    });
    session.current = current;
    const rememberLocation = () => {
      const location = current.navigation?.getSnapshot();
      if (location?.status === "ready" && location.current)
        store.dispatch({ type: "document.rememberLocation", path: location.current });
    };
    const unsubscribeLocation = current.navigation?.subscribe(rememberLocation);
    rememberLocation();
    publish(current);
    current.update(latest.current);
    owner.onSession?.(current);
    return () => {
      active = false;
      inputHandler.current?.({ type: "gesture", phase: "end", clientX: 0, clientY: 0, scale: 1 });
      current.dispose();
      unsubscribeLocation?.();
      session.current = null;
      publish(null);
      owner.onSession?.(null);
    };
  }, []);
  const onLoad = React.useCallback(() => session.current?.reload(), []);
  React.useEffect(() => {
    store.dispatch({ type: "document.setBackground", theme: resolvedTheme });
    session.current?.setTheme(resolvedTheme);
  }, [resolvedTheme, store]);
  React.useEffect(() => {
    session.current?.update(values);
  }, [values]);
  React.useEffect(() => {
    if (contentRevision.current === document.contentRevision) return;
    contentRevision.current = document.contentRevision;
    session.current?.refresh();
  }, [document.contentRevision]);
  return (
    <div data-toolcraft-document-crop="" className="absolute z-30 overflow-hidden"
      style={{ left: -size.width / 2, top: -size.height / 2, width: size.width, height: size.height }}>
    <iframe
      ref={frame}
      src={initialUrl}
      title={document.title}
      data-toolcraft-external-document=""
      data-toolcraft-document-scroll={clipped ? "native" : "canvas"}
      onLoad={onLoad}
      sandbox="allow-scripts allow-same-origin allow-forms"
      className="absolute z-30 border-0"
      style={{
        colorScheme: resolvedTheme,
        pointerEvents: onViewportInput && !viewport.connected ? "none" : undefined,
        left: 0,
        top: 0,
        width: size.width,
      }}
    />
    </div>
  );
}
