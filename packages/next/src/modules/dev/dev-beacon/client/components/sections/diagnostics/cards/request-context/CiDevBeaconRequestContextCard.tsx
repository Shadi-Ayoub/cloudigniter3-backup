"use client";

import { useMemo, useState } from "react";
import { Braces, Cookie, FileJson2, LoaderCircle, X } from "lucide-react";

import {
  CiCodeEditor,
  cn,
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@cloudigniter/ui/client";

import { CiDevBeaconCardTitle } from "@ci-next/modules/dev/dev-beacon/client/components";

export interface CiDevBeaconRequestContextEntry {
  source: "header" | "cookie";
  label: string;
  name: string;
  value?: string | null;
  pending?: boolean;
}

interface CiDevBeaconRequestContextCardProps {
  entries: readonly CiDevBeaconRequestContextEntry[];
}

export function CiDevBeaconRequestContextCard({ entries }: CiDevBeaconRequestContextCardProps) {
  const [selectedEntry, setSelectedEntry] = useState<CiDevBeaconRequestContextEntry | null>(null);

  const availableEntries = entries.filter(
    (entry) => entry.value !== null && entry.value !== undefined && entry.value !== "",
  ).length;

  return (
    <>
      <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <header className="bg-card flex items-start justify-between gap-3 border-b px-4 py-3">
          {/* <div>
            <h5 className="text-sm font-semibold">Request Context</h5>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Request-context values forwarded through the current request.
            </p>
          </div> */}
          <CiDevBeaconCardTitle
            title="Request Context"
            description="Request-context values forwarded through the current request."
            tooltip={
              <>
                Displays the serialized CloudIgniter request context received through the configured request header and
                cookie. Select <strong>View JSON</strong> to inspect the decoded value.
              </>
            }
            tooltipAriaLabel="About request context"
          />

          <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-border">
            {availableEntries}/{entries.length}
          </span>
        </header>

        <dl className="divide-y">
          {entries.map((entry) => {
            const Icon = entry.source === "header" ? Braces : Cookie;
            const hasValue = entry.value !== null && entry.value !== undefined && entry.value !== "";

            return (
              <div
                key={`${entry.source}:${entry.name}`}
                className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(10rem,0.8fr)_minmax(0,1.2fr)] sm:items-center"
              >
                <dt className="flex min-w-0 items-start gap-2">
                  <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                  <div className="min-w-0">
                    <div className="text-xs font-medium">{entry.label}</div>

                    <code className="mt-1 block truncate text-xs text-muted-foreground">{entry.name}</code>
                  </div>
                </dt>

                <dd className="flex min-w-0 items-center gap-2 sm:justify-end">
                  <div
                    aria-busy={entry.pending}
                    aria-live="polite"
                    className="min-w-0 flex-1 text-left font-mono text-xs sm:text-right"
                  >
                    {entry.pending ? (
                      <span role="status" className="inline-flex items-center text-muted-foreground">
                        <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />

                        <span className="sr-only">Refreshing {entry.name}</span>
                      </span>
                    ) : hasValue ? (
                      <span className="block truncate text-muted-foreground" title={entry.value ?? undefined}>
                        {entry.value}
                      </span>
                    ) : (
                      <span className="italic text-muted-foreground">Not available</span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={!hasValue || entry.pending}
                    onClick={() => setSelectedEntry(entry)}
                    className={[
                      "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border bg-background px-2.5",
                      "text-xs font-medium transition-colors",
                      "hover:bg-muted hover:text-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                      "disabled:pointer-events-none disabled:opacity-40",
                    ].join(" ")}
                  >
                    <FileJson2 aria-hidden="true" className="size-3.5" />
                    View JSON
                  </button>
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      <CiDevBeaconJsonViewerDialog
        entry={selectedEntry}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEntry(null);
          }
        }}
      />
    </>
  );
}

function CiDevBeaconJsonViewerDialog({
  entry,
  onOpenChange,
}: {
  entry: CiDevBeaconRequestContextEntry | null;
  onOpenChange: (open: boolean) => void;
}) {
  const formattedValue = useMemo(() => (entry?.value ? ciFormatJsonValue(entry.value) : ""), [entry?.value]);

  return (
    <Dialog open={entry !== null} modal onOpenChange={onOpenChange}>
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
            "w-[min(72rem,calc(100vw-2rem))] max-w-none sm:max-w-none",
            "-translate-x-1/2 -translate-y-1/2 flex-col",
            "overflow-hidden rounded-xl border shadow-2xl outline-none",
          )}
          style={{
            zIndex: "var(--z-dev-beacon-diagnostics-content)",
          }}
          onWheel={(event) => {
            event.stopPropagation();
          }}
          onTouchMove={(event) => {
            event.stopPropagation();
          }}
          showCloseButton={false}
        >
          <header className="bg-background flex shrink-0 items-start justify-between gap-4 border-b px-6 py-5">
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold">{entry?.label ?? "Request Context JSON"}</DialogTitle>

              <DialogDescription className="text-muted-foreground mt-1 break-all font-mono text-xs">
                {entry?.name ?? "Request context value"}
              </DialogDescription>
            </div>

            <DialogClose asChild>
              <button
                type="button"
                aria-label="Close JSON viewer"
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

          <div className="min-h-0 flex-1 overflow-hidden">
            <CiCodeEditor
              content={formattedValue}
              options={{
                readOnly: true,
                domReadOnly: true,
                folding: true,
                wordWrap: "on",
                fontSize: 13,
                tabSize: 2,
                padding: {
                  top: 14,
                  bottom: 14,
                },
              }}
            />
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

/**
 * Handles plain JSON, URI-encoded JSON, and base64url-encoded JSON.
 * If the value cannot be decoded, it is still displayed as valid JSON.
 */
function ciFormatJsonValue(rawValue: string): string {
  const candidates = new Set<string>();
  const trimmedValue = rawValue.trim();

  candidates.add(trimmedValue);

  try {
    candidates.add(decodeURIComponent(trimmedValue));
  } catch {
    // The value is not URI encoded.
  }

  const base64Decoded = ciDecodeBase64Url(trimmedValue);

  if (base64Decoded) {
    candidates.add(base64Decoded);

    try {
      candidates.add(decodeURIComponent(base64Decoded));
    } catch {
      // The decoded value is not URI encoded.
    }
  }

  for (const candidate of candidates) {
    try {
      let parsedValue: unknown = JSON.parse(candidate);

      // Also support JSON that was stringified twice.
      if (typeof parsedValue === "string") {
        try {
          parsedValue = JSON.parse(parsedValue);
        } catch {
          // The parsed value is an ordinary JSON string.
        }
      }

      return JSON.stringify(parsedValue, null, 2) ?? "null";
    } catch {
      // Try the next representation.
    }
  }

  return JSON.stringify(
    {
      rawValue,
    },
    null,
    2,
  );
}

function ciDecodeBase64Url(value: string): string | null {
  if (typeof atob !== "function" || !/^[A-Za-z0-9_-]+={0,2}$/.test(value)) {
    return null;
  }

  try {
    const normalizedValue = value.replace(/-/g, "+").replace(/_/g, "/");

    const paddedValue = normalizedValue.padEnd(Math.ceil(normalizedValue.length / 4) * 4, "=");

    const binaryValue = atob(paddedValue);
    const bytes = Uint8Array.from(binaryValue, (character) => character.charCodeAt(0));

    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}
