"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2 } from "lucide-react";
import type { CiEnvMode } from "@cloudigniter/core/types";
import { cn } from "@ci-next/ui/client";
import type {
  CiDevBeaconExtraTab,
  CiDevBeaconTabValue,
} from "@cloudigniter/core/types";

type CiSideTabsListProps = {
  loaded: boolean;
  defaultTab: CiDevBeaconTabValue | string;
  className?: string;
  statusContent?: React.ReactNode;
  configContent?: React.ReactNode;
  toolsContent?: React.ReactNode;
  extraTabs?: CiDevBeaconExtraTab[];
};

export interface CiDevBeaconModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  env?: CiEnvMode;
  loaded: boolean;
  defaultTab?: CiDevBeaconTabValue | string;
  dir?: "ltr" | "rtl";
  SideTabsList: React.ComponentType<CiSideTabsListProps>;
  SectionStatus: React.ComponentType;
  SectionConfig: React.ComponentType;
  SectionTools: React.ComponentType<{ onMarkLoaded: () => void }>;
  headerActions?: React.ReactNode;
  className?: string;
  title?: string;
  extraTabs?: CiDevBeaconExtraTab[];
  viewportTopOffset?: string; // e.g. '120px'
  viewportBottomOffset?: string; // e.g. '56px'
}

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

  const envPulseClass = (env?: CiEnvMode) => {
    let classByEnv: string;

    switch (env) {
      case "development":
        classByEnv = "bg-emerald-500/10 text-emerald-600";
        break;
      case "test":
      case "staging":
        classByEnv = "bg-amber-500/10 text-amber-700";
        break;
      default:
        classByEnv = "bg-muted text-foreground/60";
    }

    return classByEnv;
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {/* Overlay pinned between header/footer */}
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed right-0 left-0 bg-black/30 backdrop-blur-sm"
          style={{
            top: viewportTopOffset,
            bottom: viewportBottomOffset,
            zIndex: 3000,
          }}
        />
        {/* Content: full-bleed horizontally, pinned vertically, no animations, no transforms */}
        <Dialog.Content
          // IMPORTANT: no shadcn default class string here—this is the Radix primitive
          className={cn(
            "bg-background fixed right-0 left-0 z-[3001] overflow-y-auto rounded-none border-0 p-0 shadow-xl",
            // hard overrides to ensure no centering ever applies
            "!w-screen !max-w-none !transform-none",
            className,
          )}
          style={{ top: viewportTopOffset, bottom: viewportBottomOffset }}
        >
          {/* Sticky header */}
          <header className="bg-background/95 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-[1] flex items-center justify-between border-b px-4 py-3 backdrop-blur">
            <Dialog.Title className="text-xl font-semibold">
              {title}{" "}
              {env ? (
                <span
                  className={cn(
                    "ml-2 inline-flex items-center rounded-full px-2 py-0.5 align-middle text-xs",
                    envPulseClass(env),
                  )}
                >
                  {String(env).toUpperCase()}
                </span>
              ) : null}
            </Dialog.Title>

            <div className="flex items-center gap-2">
              {!loaded && (
                <span className="text-muted-foreground inline-flex items-center gap-2 text-xs">
                  <Loader2 className="size-3 animate-spin" />
                  Loading dashboard…
                </span>
              )}
              {headerActions}
              <Dialog.Close
                className="rounded-md border px-2 py-1 text-xs"
                aria-label="Close"
              >
                Close
              </Dialog.Close>
            </div>
          </header>

          {/* Body fills the panel; internal scroll already enabled on Content */}
          <div dir={dir} className="h-full">
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
