"use client";
import * as React from "react";
import { Select, FieldDescription, FieldError } from "@/toolcraft/ui";
import { useExternalDocumentSession } from "../../../../react/external-document/document-session-context";
import type { DocumentLocation } from "../navigation";

const waiting: DocumentLocation = Object.freeze({ current: null, pending: null, status: "loading" });
const emptySubscribe = () => () => {};
const emptySnapshot = () => waiting;
export function DocumentPageControl({ name }: { name: string }) {
  const { session, document } = useExternalDocumentSession();
  const navigation = session?.navigation;
  const location = React.useSyncExternalStore(navigation?.subscribe ?? emptySubscribe,
    navigation?.getSnapshot ?? emptySnapshot, emptySnapshot);
  const [error, setError] = React.useState<string>();
  const value = location.pending ?? location.current ?? "/";
  const options = (document?.pages ?? [{ label: "Home", path: "/" }])
    .map(({ label, path }) => ({ label, value: path }));
  return <>
    <Select name={name} value={value} unlistedValueLabel={value} options={options} disabled={!navigation}
      onValueChange={(path) => {
        setError(undefined);
        try { navigation?.navigate(path); }
        catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
      }} />
    {error || location.error ? <FieldError role="alert">{error ?? location.error}</FieldError> : null}
    {location.status === "loading" ? <FieldDescription role="status">Loading page…</FieldDescription> : null}
    {session && !navigation ? <FieldDescription>Update the website adapter to enable page navigation.</FieldDescription> : null}
  </>;
}
