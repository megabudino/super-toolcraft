import type { AnchorHTMLAttributes } from "react";
import { referenceClasses } from "./reference/reference-classes";
export default function ReferenceLink(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} className={referenceClasses(props.className)} />;
}
