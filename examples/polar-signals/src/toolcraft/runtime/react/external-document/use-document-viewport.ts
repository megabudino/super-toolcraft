import * as React from "react";
import type {
  ToolcraftDocumentConnectionStatus,
  ToolcraftDocumentSession,
} from "../../modules/built-ins/external-site/document-port";
import { useToolcraftStore } from "../app-shell/toolcraft-store-context";
import { useToolcraftCommittedSelector } from "../app-shell/toolcraft-selectors";
import { fitDocumentViewport } from "./fit-document-viewport";

export function useDocumentViewport(
  frame: React.RefObject<HTMLIFrameElement | null>,
  session: React.RefObject<ToolcraftDocumentSession | null>,
) {
  const store = useToolcraftStore();
  const measurement = useToolcraftCommittedSelector((state) => state.documentViewport);
  const width = useToolcraftCommittedSelector((state) => state.canvas.size.width);
  const height = useToolcraftCommittedSelector(
    (state) => state.canvas.size.height,
  );
  const [connected, setConnected] = React.useState(false);
  const busy = React.useRef(false);
  const dirty = React.useRef(false);
  // This hook is the single height writer. Probes never change the frame origin.
  React.useLayoutEffect(() => {
    if (frame.current) frame.current.style.height = `${height}px`;
  }, [frame, height]);
  const invalidate = React.useCallback(() => {
    if (busy.current) dirty.current = true;
    else if (store.getState().documentViewport?.status !== "measuring")
      store.dispatch({ type: "document.invalidateViewport" });
  }, [store]);
  const onStatus = React.useCallback(
    (status: ToolcraftDocumentConnectionStatus) => {
      setConnected(status === "connected");
      if (status !== "connected")
        store.dispatch({ type: "document.invalidateViewport", resetBackground: true });
    },
    [store],
  );

  React.useEffect(() => {
    const element = frame.current;
    const current = session.current;
    if (!connected || !measurement || !element || !current) return;
    const document = element.ownerDocument;
    let active = document.visibilityState !== "hidden";
    busy.current = active;
    dirty.current = false;
    const generation = measurement.generation;
    const isCurrent = () =>
      active &&
      document.visibilityState !== "hidden" &&
      session.current === current &&
      store.getState().documentViewport?.generation === generation;
    const setHeight = (height: number) => {
      element.style.height = `${height}px`;
      // Commit the host layout before asking the cross-origin guest to measure it.
      // Otherwise a background frame can still observe the preceding probe's height.
      void element.clientHeight;
    };
    const retire = () => {
      active = false;
      busy.current = false;
      setHeight(store.getState().canvas.size.height);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") retire();
      else store.dispatch({ type: "document.invalidateViewport" });
    };
    // Hidden tabs can apply parent CSS while retaining the guest's previous
    // viewport. Retire that transaction; visibility resumes with a fresh generation.
    document.addEventListener("visibilitychange", onVisibility);
    const measure: ToolcraftDocumentSession["measureViewport"] = async (size) => {
      const result = await current.measureViewport(size);
      // The observed reply includes every preceding invalidation on this session.
      // Later events still mark the transaction dirty and receive one follow-up.
      if (isCurrent() && size.observe) dirty.current = false;
      return result;
    };
    if (active) void (async () => {
      try {
        const height = await fitDocumentViewport({
          width,
          height: store.getState().canvas.size.height,
          manualHeight: store.getState().canvas.documentView?.manualHeight,
          measure,
          setHeight,
          isCurrent,
        });
        if (isCurrent())
          store.dispatch({
            type: "document.measureViewport",
            width,
            generation,
            result: { height },
          });
      } catch (error) {
        if (isCurrent()) {
          const size = store.getState().canvas.size;
          setHeight(size.height);
          try {
            await measure({ ...size, observe: true });
          } catch {
            /* Connection owns recovery. */
          }
          if (isCurrent())
            store.dispatch({
              type: "document.measureViewport",
              width,
              generation,
              result: {
                error:
                  error instanceof Error
                    ? error.message
                    : "Automatic website height is unavailable.",
              },
            });
        }
      } finally {
        if (active) {
          busy.current = false;
          if (dirty.current) {
            dirty.current = false;
            store.dispatch({ type: "document.invalidateViewport" });
          }
        }
      }
    })();
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      retire();
    };
  }, [connected, frame, session, store, width, measurement?.generation]);
  return { connected, onStatus, onViewportChange: invalidate };
}
