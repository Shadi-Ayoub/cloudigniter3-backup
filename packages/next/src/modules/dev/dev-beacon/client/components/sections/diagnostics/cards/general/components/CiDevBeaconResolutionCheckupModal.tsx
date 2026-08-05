"use client";

import { X } from "lucide-react";
import type { CiDevTenantResolutionCheckup } from "@cloudigniter/core/types";
import {
  cn,
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@cloudigniter/ui/client";
import type { CiDevResolutionCheckArea } from "../types";

export type CiDevBeaconResolutionCheckupModalProps = {
  area: CiDevResolutionCheckArea | null;
  checkup: CiDevTenantResolutionCheckup | null;
  onClose: () => void;
};

export function CiDevBeaconResolutionCheckupModal({
  area,
  checkup,
  onClose,
}: CiDevBeaconResolutionCheckupModalProps) {
  const open = area !== null && checkup !== null;

  const title =
    area === "tenant"
      ? "Tenant Resolution Checkup"
      : "Org Unit Resolution Checkup";

  const summary = area === "tenant" ? checkup?.tenant : checkup?.orgUnit;

  const checks =
    area && checkup
      ? checkup.checks.filter((check) => check.area === area)
      : [];

  return (
    <Dialog
      open={open}
      modal
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
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
            "flex h-[min(48rem,calc(100dvh-2rem))]",
            "w-[min(110rem,calc(100vw-2rem))] max-w-none sm:max-w-none",
            "-translate-x-1/2 -translate-y-1/2 flex-col",
            "overflow-hidden rounded-xl border shadow-2xl outline-none",
          )}
          style={{
            zIndex: "var(--z-dev-beacon-diagnostics-content)",
          }}
          onWheelCapture={(event) => {
            event.stopPropagation();
          }}
          onTouchMoveCapture={(event) => {
            event.stopPropagation();
          }}
          showCloseButton={false}
        >
          <header className="bg-background flex shrink-0 items-start justify-between gap-4 border-b px-6 py-5">
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold">
                {title}
              </DialogTitle>

              <DialogDescription className="text-muted-foreground mt-1 text-sm">
                {summary
                  ? `${summary.passed} passed · ${summary.failed} failed · ${summary.total} total`
                  : "Resolution probe report."}
              </DialogDescription>
            </div>

            <DialogClose asChild>
              <button
                type="button"
                aria-label="Close resolution checkup"
                className={cn(
                  "text-muted-foreground hover:text-foreground",
                  "hover:bg-muted/80 active:bg-muted",
                  "focus-visible:ring-ring/60 focus-visible:ring-2 focus-visible:outline-none",
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-full",
                  "border border-transparent transition-colors",
                )}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </DialogClose>
          </header>

          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5"
            onWheel={(event) => {
              event.stopPropagation();
            }}
            onTouchMove={(event) => {
              event.stopPropagation();
            }}
          >
            {checks.length > 0 ? (
              <div className="space-y-3">
                {checks.map((check) => (
                  <article
                    key={check.id}
                    className="bg-card rounded-lg border p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h5 className="text-sm font-semibold">{check.label}</h5>

                        <p className="text-muted-foreground mt-1 text-sm">
                          {check.message}
                        </p>
                      </div>

                      <span
                        className={cn(
                          "shrink-0 rounded px-2 py-0.5 text-xs font-medium",
                          check.state === "passed" &&
                            "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                          check.state === "failed" &&
                            "bg-red-500/10 text-red-700 dark:text-red-400",
                          check.state !== "passed" &&
                            check.state !== "failed" &&
                            "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                        )}
                      >
                        {check.state}
                      </span>
                    </div>

                    {check.pathname ? (
                      <div className="bg-muted/30 mt-3 rounded-md border px-3 py-2">
                        <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                          Probe Pathname
                        </div>

                        <code className="text-foreground mt-1 block break-all font-mono text-xs">
                          {check.pathname}
                        </code>
                      </div>
                    ) : null}

                    <dl className="mt-4 grid gap-3 lg:grid-cols-2">
                      <div className="min-w-0">
                        <dt className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                          Expected
                        </dt>

                        <dd className="bg-muted/60 max-h-52 overflow-auto overscroll-contain rounded p-3">
                          <pre className="whitespace-pre-wrap break-all font-mono text-xs">
                            {ciFormatResolutionCheckValue(check.expected)}
                          </pre>
                        </dd>
                      </div>

                      <div className="min-w-0">
                        <dt className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                          Actual
                        </dt>

                        <dd className="bg-muted/60 max-h-52 overflow-auto overscroll-contain rounded p-3">
                          <pre className="whitespace-pre-wrap break-all font-mono text-xs">
                            {ciFormatResolutionCheckValue(check.actual)}
                          </pre>
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground flex min-h-40 items-center justify-center text-sm">
                No resolution checks are available.
              </div>
            )}
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

function ciFormatResolutionCheckValue(
  value: Record<string, unknown> | undefined,
): string {
  return value ? JSON.stringify(value, null, 2) : "—";
}
