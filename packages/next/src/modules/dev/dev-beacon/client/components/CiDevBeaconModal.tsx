"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Loader2 } from "lucide-react";

import { cn } from "@cloudigniter/ui/client";

import type {
  CiDevBeaconModalProps,
  CiEnvMode,
} from "@cloudigniter/core/types";

export function CiDevBeaconModal({
  open,
  onOpenChange,
  env,
  loaded,
  defaultTab = "status",
  dir = "ltr",
  SideTabsList,
  SectionStatus,
  SectionConfig,
  SectionTools,
  headerActions,
  className,
  title = "Developer Dashboard",
  extraTabs = [],
  viewportTopOffset = "120px",
  viewportBottomOffset = "0px",
}: CiDevBeaconModalProps) {
  const isRTL = dir === "rtl";

  const envPulseClass = (currentEnv?: CiEnvMode): string => {
    switch (currentEnv) {
      case "development":
        return "bg-emerald-500/10 text-emerald-600";

      case "test":
      case "staging":
        return "bg-amber-500/10 text-amber-700";

      default:
        return "bg-muted text-foreground/60";
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal>
      <Dialog.Portal>
        {/* Overlay pinned between header and footer. */}
        <Dialog.Overlay
          className="fixed right-0 left-0 bg-black/30 backdrop-blur-sm"
          style={{
            top: viewportTopOffset,
            bottom: viewportBottomOffset,
            zIndex: "var(--z-dev-beacon-overlay)",
          }}
        />

        {/* Content is full-bleed horizontally and pinned vertically. */}
        <Dialog.Content
          className={cn(
            "bg-background fixed right-0 left-0 flex flex-col overflow-hidden rounded-none border-0 p-0 shadow-xl",
            "w-screen! max-w-none! transform-none!",
            className,
          )}
          style={{
            top: viewportTopOffset,
            bottom: viewportBottomOffset,
            zIndex: "var(--z-dev-beacon-content)",
          }}
        >
          {/* Sticky header. */}
          <header className="bg-background/95 supports-backdrop-filter:bg-background/70 relative z-1 flex shrink-0 items-center justify-between border-b px-4 py-3 backdrop-blur">
            <Dialog.Title className="text-xl font-semibold">
              {title}

              {env ? (
                <span
                  className={cn(
                    "ml-2 inline-flex items-center rounded-full px-2 py-0.5 align-middle text-xs",
                    envPulseClass(env),
                  )}
                >
                  {env.toUpperCase()}
                </span>
              ) : null}
            </Dialog.Title>

            <div className="flex items-center gap-2">
              {!loaded ? (
                <span className="text-muted-foreground inline-flex items-center gap-2 text-xs">
                  <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                  Loading dashboard…
                </span>
              ) : null}

              {headerActions}

              <Dialog.Close
                type="button"
                className="rounded-md border px-2 py-1 text-xs"
                aria-label="Close"
              >
                Close
              </Dialog.Close>
            </div>
          </header>

          {/* Body fills the remaining panel and owns the parent scrolling. */}
          <div
            dir={dir}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          >
            <SideTabsList
              loaded={loaded}
              defaultTab={defaultTab}
              className={cn(isRTL && "border-r-0 border-l")}
              statusContent={
                <div className="p-3">
                  <SectionStatus />
                </div>
              }
              configContent={
                <div className="p-3">
                  <SectionConfig />
                </div>
              }
              toolsContent={
                <div className="p-3">
                  <SectionTools onMarkLoaded={() => {}} />
                </div>
              }
              extraTabs={extraTabs}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
