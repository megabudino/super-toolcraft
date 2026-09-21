import { CompassIcon } from "@phosphor-icons/react/dist/ssr";

import { EmptyState } from "@/components/page-header";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <EmptyState icon={<CompassIcon />} title="Page not found" actions={<ButtonLink href="/" variant="outline">Back to your apps</ButtonLink>}>
      It may have been moved, or you don&apos;t have access to it.
    </EmptyState>
  );
}
