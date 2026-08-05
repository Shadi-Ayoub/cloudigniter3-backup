"use client";

import { useState } from "react";
import { X } from "lucide-react";

import {
  CiCodeEditor,
  cn,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@cloudigniter/ui/client";

import { CiDevBeaconCardRow } from "@ci-next/modules/dev/dev-beacon/client/components";

export interface CiDevBeaconAmplifyOutputsStatusRowProps {
  amplifyOutputs: unknown;
  isOk: boolean;
}

export function CiDevBeaconAmplifyOutputsStatusRow({ amplifyOutputs, isOk }: CiDevBeaconAmplifyOutputsStatusRowProps) {
  const [isOpen, setIsOpen] = useState(false);

  const canOpen = isOk && amplifyOutputs != null;

  return (
    <>
      <CiDevBeaconCardRow
        label="Amplify Outputs"
        value={isOk ? "OK" : "CHECK!"}
        valueClassName={
          isOk
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
        }
        onClick={canOpen ? () => setIsOpen(true) : undefined}
        clickTitle={canOpen ? "View AWS Amplify Outputs" : undefined}
        tooltip={
          <>
            Indicates whether the AWS Amplify outputs were loaded successfully. Click <strong>OK</strong> to inspect the
            resolved JSON.
          </>
        }
      />

      <Dialog open={isOpen} modal onOpenChange={setIsOpen}>
        <DialogPortal>
          <DialogOverlay
            className="fixed inset-0 bg-black/60 backdrop-blur-[1px]"
            style={{
              zIndex: "var(--z-dev-beacon-diagnostics-overlay)",
            }}
          />

          <DialogContent
            className={cn(
              "bg-background text-foreground fixed top-1/2 left-1/2",
              "flex h-[min(44rem,calc(100dvh-2rem))]",
              "w-[min(70rem,calc(100vw-2rem))] max-w-none sm:max-w-none",
              "-translate-x-1/2 -translate-y-1/2 flex-col",
              "overflow-hidden rounded-xl border shadow-2xl outline-none",
            )}
            style={{
              zIndex: "var(--z-dev-beacon-diagnostics-content)",
            }}
            showCloseButton={false}
            onWheel={(event) => {
              event.stopPropagation();
            }}
            onTouchMove={(event) => {
              event.stopPropagation();
            }}
          >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b px-6 py-5">
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold">AWS Amplify Outputs</DialogTitle>

                <DialogDescription className="text-muted-foreground mt-1 text-sm">
                  Resolved AWS Amplify resource configuration.
                </DialogDescription>
              </div>

              <DialogClose asChild>
                <button
                  type="button"
                  aria-label="Close AWS Amplify Outputs"
                  className={cn(
                    "text-muted-foreground hover:text-foreground",
                    "hover:bg-muted/80 active:bg-muted",
                    "focus-visible:ring-ring/60 focus-visible:ring-2",
                    "focus-visible:outline-none",
                    "inline-flex size-9 shrink-0 items-center",
                    "justify-center rounded-full border",
                    "border-transparent transition-colors",
                  )}
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </DialogClose>
            </header>

            <div className="min-h-0 flex-1 p-4">
              <div className="h-full overflow-hidden rounded-md border">
                <CiCodeEditor
                  content={amplifyOutputs ?? {}}
                  options={{
                    readOnly: true,
                    folding: true,
                    wordWrap: "on",
                  }}
                />
              </div>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  );
}
