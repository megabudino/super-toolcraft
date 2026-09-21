"use client";

import { ArrowRightIcon } from "@phosphor-icons/react";
import { useFormStatus } from "react-dom";

import { Button, Spinner } from "@/components/ui/button";

export function SubmitButton({ children, arrow = true }: { children: React.ReactNode; arrow?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? <Spinner /> : null}
      {children}
      {!pending && arrow ? <ArrowRightIcon weight="bold" className="size-3.5" /> : null}
    </Button>
  );
}
