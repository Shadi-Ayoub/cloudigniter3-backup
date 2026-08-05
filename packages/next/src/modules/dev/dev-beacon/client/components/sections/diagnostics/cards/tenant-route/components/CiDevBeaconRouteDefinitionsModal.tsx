"use client";

import { X } from "lucide-react";

import type { CiNextContext } from "@ci-next/types";

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

type CiRouteDefinitions = NonNullable<CiNextContext["route"]>["routesDefinitions"];

interface CiDevBeaconRouteDefinitionsModalProps {
  routesDefinitions?: CiRouteDefinitions;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CiDevBeaconRouteDefinitionsModal({
  routesDefinitions,
  open,
  onOpenChange,
}: CiDevBeaconRouteDefinitionsModalProps) {
  return (
    <Dialog open={open} modal onOpenChange={onOpenChange}>
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
              <DialogTitle className="text-base font-semibold">Route Definitions</DialogTitle>

              <DialogDescription className="text-muted-foreground mt-1 text-sm">
                Registered route definitions available to the current request context.
              </DialogDescription>
            </div>

            <DialogClose asChild>
              <button
                type="button"
                aria-label="Close Route Definitions"
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
                content={routesDefinitions ?? {}}
                options={{
                  readOnly: true,
                  domReadOnly: true,
                  folding: true,
                  renderValidationDecorations: "off",
                  wordWrap: "on",
                }}
              />
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
