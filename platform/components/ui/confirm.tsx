"use client";

import { createContext, useCallback, useContext, useState, useTransition } from "react";

import { Button, Spinner } from "./button";
import { Dialog, DialogContent } from "./dialog";

type ConfirmOptions = { title: string; description?: React.ReactNode; confirmLabel: string; destructive?: boolean; onConfirm: () => Promise<void> };

const ConfirmContext = createContext<(options: ConfirmOptions) => void>(() => {});

/** Imperative confirm dialog: `confirm({ title, onConfirm })` from any client component. */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [pending, startTransition] = useTransition();
  const confirm = useCallback((next: ConfirmOptions) => setOptions(next), []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={options !== null} onOpenChange={(open) => !open && !pending && setOptions(null)}>
        {options ? (
          <DialogContent title={options.title} description={options.description}>
            <div className="flex justify-end gap-2">
              <Button variant="ghost-muted" onClick={() => setOptions(null)} disabled={pending}>
                Cancel
              </Button>
              <Button
                variant={options.destructive ? "destructive" : "default"}
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await options.onConfirm();
                    setOptions(null);
                  })
                }
              >
                {pending ? <Spinner /> : null}
                {options.confirmLabel}
              </Button>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
