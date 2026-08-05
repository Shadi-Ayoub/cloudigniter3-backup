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

interface CiDevBeaconProvidersStatusRowProps<TProviders extends object> {
  providers: TProviders;
}

export function CiDevBeaconProvidersStatusRow<TProviders extends object>({
  providers,
}: CiDevBeaconProvidersStatusRowProps<TProviders>) {
  const [selectedProvider, setSelectedProvider] = useState<{
    key: string;
    config: unknown;
  } | null>(null);

  const providerKeys = Object.keys(providers) as Array<Extract<keyof TProviders, string>>;

  const displayedProviders = providerKeys.map((providerKey) => providerKey.toUpperCase());

  return (
    <>
      <CiDevBeaconCardRow
        label="Cloud Providers"
        value={displayedProviders}
        onClick={(displayedProviderKey) => {
          const providerKey = providerKeys.find((key) => key.toUpperCase() === displayedProviderKey);

          if (!providerKey) {
            return;
          }

          setSelectedProvider({
            key: displayedProviderKey,
            config: providers[providerKey],
          });
        }}
        tooltip={
          <>Cloud providers configured for this application. Click a provider to inspect its resolved configuration.</>
        }
      />

      <Dialog
        open={selectedProvider !== null}
        modal
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedProvider(null);
          }
        }}
      >
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
                <DialogTitle className="text-base font-semibold">
                  {selectedProvider?.key} Provider Configuration
                </DialogTitle>

                <DialogDescription className="text-muted-foreground mt-1 text-sm">
                  Resolved cloud provider configuration.
                </DialogDescription>
              </div>

              <DialogClose asChild>
                <button
                  type="button"
                  aria-label="Close provider configuration"
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
                  content={selectedProvider?.config ?? {}}
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
