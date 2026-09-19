"use client";
import * as React from "react";
import type { ToolcraftDocumentSession, ToolcraftExternalDocumentPort } from "../../modules/built-ins/external-site/document-port";
const Context = React.createContext<{
  session: ToolcraftDocumentSession | null;
  document?: ToolcraftExternalDocumentPort;
  publish(session: ToolcraftDocumentSession | null): void;
}>({ session: null, publish() {} });
export const useExternalDocumentSession = () => React.useContext(Context);
export function ExternalDocumentSessionProvider({ children, document }: { children: React.ReactNode; document?: ToolcraftExternalDocumentPort }) {
  const [session, publish] = React.useState<ToolcraftDocumentSession | null>(null);
  const value = React.useMemo(() => ({ session, publish, document }), [session, document]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
