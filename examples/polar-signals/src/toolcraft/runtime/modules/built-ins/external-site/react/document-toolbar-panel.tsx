"use client";
import * as React from "react";
import { FieldError, FieldDescription } from "@/toolcraft/ui";
import { PanelContainer } from "../../../../react/panel-host/panel-host";
import { useToolcraftPanelBinding } from "../../../../react/panel-host/use-toolcraft-panel-binding";
import { useToolcraftStore } from "../../../../react/app-shell/toolcraft-store-context";
import { useToolcraftTheme } from "../../../../react/app-shell/theme-runtime";
import { useExternalDocumentSession } from "../../../../react/external-document/document-session-context";
const selectWidth = (state: import("../../../../state/types").ToolcraftState) =>
  state.canvas.size.width;
export function DocumentToolbarPanel() {
  const { session } = useExternalDocumentSession();
  const store = useToolcraftStore();
  const binding = useToolcraftPanelBinding({ panelId: "document-toolbar" });
  const { resolvedTheme } = useToolcraftTheme();
  const theme = React.useRef(resolvedTheme);
  const themeListeners = React.useRef(new Set<() => void>());
  const container = React.useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState<string>();
  React.useLayoutEffect(() => {
    theme.current = resolvedTheme;
    themeListeners.current.forEach((changed) => changed());
  }, [resolvedTheme]);
  React.useEffect(() => {
    setError(undefined);
    if (binding.panelState.hidden || !container.current || !session?.mountToolbar) return;
    let active = true;
    try {
      const dispose = session.mountToolbar(container.current, {
        viewport: {
          getWidth: () => selectWidth(store.getCommittedState()),
          setWidth: (width) =>
            store.dispatch({
              type: "controls.setValue",
              target: "canvas.size.width",
              value: width,
            }),
          subscribe: (changed) => store.subscribeSelector(selectWidth, changed),
        },
        theme: {
          getSnapshot: () => theme.current,
          subscribe: (changed) => {
            themeListeners.current.add(changed);
            return () => {
              themeListeners.current.delete(changed);
            };
          },
        },
        preferences: {
          load: () => {
            const value = store.getCommittedState().canvas.documentView?.toolbar;
            return value ? JSON.parse(value) : undefined;
          },
          save: (snapshot) => store.dispatch({ type: "document.setToolbarPreferences", snapshot }),
        },
        onError: (reason) => {
          if (active) setError(reason instanceof Error ? reason.message : String(reason));
        },
      });
      return () => {
        active = false;
        dispose();
      };
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  }, [session, store, binding.panelState.hidden]);
  if (binding.panelState.hidden) return null;
  return (
    <PanelContainer
      panelType="document-toolbar"
      placement="floating"
      panelState={binding.panelState}
      onPanelStateChange={binding.onPanelStateChange}
    >
      <div data-panel-drag-ignore="" data-toolcraft-document-toolbar="">
        {error ? <FieldError role="alert">{error}</FieldError> : null}
        {session && !session.mountToolbar ? (
          <FieldDescription>Update the website adapter to enable its toolbar.</FieldDescription>
        ) : null}
        <div ref={container} />
      </div>
    </PanelContainer>
  );
}
