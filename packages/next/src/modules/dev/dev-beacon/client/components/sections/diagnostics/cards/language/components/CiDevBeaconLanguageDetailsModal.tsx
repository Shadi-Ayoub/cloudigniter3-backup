"use client";

import * as React from "react";
import { CircleX, FileJson2, FileSearch, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import {
  Alert,
  AlertDescription,
  AlertTitle,
  CiCodeEditor,
  ScrollArea,
  Skeleton,
  cn,
} from "@cloudigniter/ui/client";
import { ciIsDevBeaconLanguageErrorResponse } from "@cloudigniter/core/lib";
import type {
  CiDevBeaconLanguageMessageEntry,
  CiDevBeaconLanguageMessagesResponse,
  CiLocaleDirection,
} from "@cloudigniter/core/types";

const CiAccessibleDialogTitle =
  DialogPrimitive.Title as React.ComponentType<React.PropsWithChildren>;

const CiAccessibleDialogDescription =
  DialogPrimitive.Description as React.ComponentType<React.PropsWithChildren>;

type CiDevBeaconLanguageDetailsModalProps = {
  open: boolean;
  onClose: () => void;
  endpoint: string;
  pathname: string;
  locale: string;
  dir: CiLocaleDirection;
};

type CiDevBeaconLanguageMessageTab = {
  id: string;
  title: string;
  description: string;
  entryCount: number;
  type: "effective" | "source";
  isSelectable: boolean;
  isMissingCustom: boolean;
};

function ciEntriesToStructuredJson(
  entries: CiDevBeaconLanguageMessageEntry[],
): string {
  const result: Record<string, unknown> = {};

  for (const entry of entries) {
    const keyParts = entry.key.split(".").filter(Boolean);

    if (!keyParts.length) {
      continue;
    }

    let node = result;

    for (const [index, key] of keyParts.entries()) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        break;
      }

      const isLast = index === keyParts.length - 1;

      if (isLast) {
        node[key] = entry.value;
        continue;
      }

      const currentValue = node[key];

      if (
        typeof currentValue !== "object" ||
        currentValue === null ||
        Array.isArray(currentValue)
      ) {
        node[key] = {};
      }

      node = node[key] as Record<string, unknown>;
    }
  }

  return JSON.stringify(result, null, 2);
}

export function CiDevBeaconLanguageDetailsModal({
  open,
  onClose,
  endpoint,
  pathname,
  locale,
  dir,
}: CiDevBeaconLanguageDetailsModalProps) {
  const [data, setData] = React.useState<CiDevBeaconLanguageMessagesResponse>();
  const [error, setError] = React.useState<string>();
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedSourceId, setSelectedSourceId] = React.useState("effective");

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const controller = new AbortController();

    const loadDetails = async () => {
      setData(undefined);
      setError(undefined);
      setIsLoading(true);
      setSelectedSourceId("effective");

      try {
        const requestUrl = new URL(endpoint, window.location.origin);

        requestUrl.searchParams.set("pathname", pathname);
        requestUrl.searchParams.set("locale", locale);
        requestUrl.searchParams.set("detail", "messages");

        const response = await fetch(requestUrl, {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });

        const payload: unknown = await response.json();

        if (ciIsDevBeaconLanguageErrorResponse(payload)) {
          throw new Error(payload.error.message);
        }

        if (!response.ok) {
          throw new Error(
            `Language details request failed with status ${response.status}.`,
          );
        }

        const result = payload as CiDevBeaconLanguageMessagesResponse;

        if (result.locale !== locale) {
          throw new Error(
            `Language details locale mismatch. Expected "${locale}" but received "${result.locale}".`,
          );
        }

        if (result.dir !== dir) {
          throw new Error(
            `Language details direction mismatch. Expected "${dir}" but received "${result.dir}".`,
          );
        }

        setData(result);
      } catch (caughtError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not load language details.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadDetails();

    return () => {
      controller.abort();
    };
  }, [dir, endpoint, locale, open, pathname]);

  const sourceMessagesById = React.useMemo(
    () =>
      new Map(
        (data?.sourceMessages ?? []).map((source) => [source.id, source]),
      ),
    [data?.sourceMessages],
  );

  const messageTabs = React.useMemo<CiDevBeaconLanguageMessageTab[]>(() => {
    const sources = data?.sourceMessages ?? [];

    return [
      {
        id: "effective",
        title: "All messages",
        description: "Merged effective message catalogue",
        entryCount: data?.effectiveMessages.length ?? 0,
        type: "effective",
        isSelectable: true,
        isMissingCustom: false,
      },
      ...sources.map((source) => {
        const isMissingCustom =
          source.source === "custom" && source.status === "not-found";

        return {
          id: source.id,
          title: `${source.fileName}.json`,
          description: isMissingCustom
            ? "Custom override not found"
            : source.source,
          entryCount: source.entries.length,
          type: "source" as const,
          isSelectable: source.status === "loaded",
          isMissingCustom,
        };
      }),
    ];
  }, [data?.effectiveMessages.length, data?.sourceMessages]);

  const selectedSource =
    selectedSourceId === "effective"
      ? undefined
      : sourceMessagesById.get(selectedSourceId);

  const selectedSourceIsLoaded = selectedSource?.status === "loaded";

  const selectedEntries =
    selectedSourceIsLoaded && selectedSource
      ? selectedSource.entries
      : (data?.effectiveMessages ?? []);

  const selectedJson = React.useMemo(
    () => ciEntriesToStructuredJson(selectedEntries),
    [selectedEntries],
  );

  const selectedTitle =
    selectedSourceIsLoaded && selectedSource
      ? `${selectedSource.source}/${selectedSource.fileName}.json`
      : "All messages (merged)";

  const selectedDescription =
    selectedSourceIsLoaded && selectedSource
      ? `Source messages loaded from ${selectedSource.source}.`
      : "The final merged catalogue available to the current route.";

  return (
    <DialogPrimitive.Root
      open={open}
      modal
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 bg-black/45 backdrop-blur-sm"
          style={{
            zIndex: "var(--z-dev-beacon-diagnostics-overlay)",
          }}
        />

        <DialogPrimitive.Content
          className={cn(
            "bg-background fixed top-1/2 left-1/2",
            "flex h-[min(82vh,820px)] w-[min(1240px,calc(100vw-2rem))]",
            "max-w-310 -translate-x-1/2 -translate-y-1/2 flex-col",
            "gap-0 overflow-hidden rounded-lg border p-0 shadow-2xl outline-none",
          )}
          style={{
            zIndex: "var(--z-dev-beacon-diagnostics-content)",
          }}
        >
          <DialogPrimitive.Close asChild>
            <button
              type="button"
              aria-label="Close language details"
              className={cn(
                "text-muted-foreground hover:text-foreground",
                "hover:bg-muted/80 active:bg-muted",
                "focus-visible:ring-ring/60 focus-visible:ring-2 focus-visible:outline-none",
                "absolute top-4 right-4 z-10 inline-flex size-9 shrink-0 items-center justify-center rounded-full",
                "border border-transparent transition-colors",
              )}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </DialogPrimitive.Close>

          <header className="border-b px-6 py-5 pr-16">
            <DialogPrimitive.Title className="text-lg font-semibold">
              Language details
            </DialogPrimitive.Title>

            <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
              {locale} · {dir} · {data?.namespace ?? "Resolving…"}
            </DialogPrimitive.Description>
          </header>

          <div
            dir={dir}
            className="grid min-h-0 flex-1 lg:grid-cols-[19rem_minmax(0,1fr)]"
          >
            <aside className="min-h-0 border-b lg:border-r lg:border-b-0">
              <div className="border-b px-4 py-3">
                <h3 className="text-sm font-semibold">
                  Expected language files
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  Select a loaded file to inspect its source messages.
                </p>
              </div>

              <ScrollArea className="h-[24vh] lg:h-[calc(min(82vh,820px)-10rem)]">
                <div className="space-y-1 p-3">
                  {isLoading
                    ? Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton key={index} className="h-14 w-full" />
                      ))
                    : null}

                  {!isLoading && error ? (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                      Language file tabs could not be loaded.
                    </div>
                  ) : null}

                  {!isLoading && !error
                    ? messageTabs.map((tab) => {
                        const isUnavailable = !tab.isSelectable;
                        const isSelected =
                          !isUnavailable && selectedSourceId === tab.id;

                        const Icon =
                          tab.type === "effective"
                            ? FileSearch
                            : tab.isMissingCustom
                              ? CircleX
                              : FileJson2;

                        return (
                          <button
                            key={tab.id}
                            type="button"
                            disabled={isUnavailable}
                            aria-disabled={isUnavailable}
                            aria-pressed={isSelected}
                            title={
                              tab.isMissingCustom
                                ? `${tab.title} is not available in "@/custom/locales".`
                                : tab.type === "effective"
                                  ? "Inspect the merged effective messages."
                                  : `Inspect ${tab.description}/${tab.title}.`
                            }
                            onClick={() => {
                              if (tab.isSelectable) {
                                setSelectedSourceId(tab.id);
                              }
                            }}
                            className={cn(
                              "flex w-full items-start gap-3 rounded-md border px-3 py-2.5 text-left transition-colors",
                              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                              tab.isMissingCustom
                                ? "cursor-not-allowed border-destructive/30 bg-destructive/5 opacity-50"
                                : isUnavailable
                                  ? "cursor-not-allowed border-transparent opacity-45"
                                  : isSelected
                                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                    : "border-transparent hover:border-border hover:bg-muted/70",
                            )}
                          >
                            <Icon
                              className={cn(
                                "mt-0.5 size-4 shrink-0",
                                tab.isMissingCustom
                                  ? "text-destructive"
                                  : isSelected
                                    ? "text-primary-foreground"
                                    : "text-muted-foreground",
                              )}
                            />

                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">
                                {tab.title}
                              </span>

                              <span
                                className={cn(
                                  "mt-0.5 block truncate text-xs",
                                  tab.isMissingCustom
                                    ? "text-destructive"
                                    : isSelected
                                      ? "text-primary-foreground/75"
                                      : "text-muted-foreground",
                                )}
                              >
                                {tab.description}
                              </span>
                            </span>

                            <span
                              className={cn(
                                "shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium",
                                tab.isMissingCustom
                                  ? "bg-destructive/10 text-destructive"
                                  : isSelected
                                    ? "bg-primary-foreground/15 text-primary-foreground"
                                    : "bg-muted text-muted-foreground",
                              )}
                            >
                              {tab.isMissingCustom ? "Missing" : tab.entryCount}
                            </span>
                          </button>
                        );
                      })
                    : null}

                  {!isLoading && !error && data && messageTabs.length === 1 ? (
                    <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                      No individual language source files were returned for this
                      route.
                    </div>
                  ) : null}
                </div>
              </ScrollArea>
            </aside>

            <main className="flex min-h-0 flex-col">
              <header className="flex items-start justify-between gap-4 border-b px-5 py-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">
                    {selectedTitle}
                  </h3>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedDescription}
                  </p>
                </div>

                <span className="shrink-0 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                  {selectedEntries.length} messages
                </span>
              </header>

              {isLoading ? (
                <div className="space-y-3 p-5">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <Skeleton key={index} className="h-5 w-full" />
                  ))}
                </div>
              ) : null}

              {error ? (
                <div className="p-5">
                  <Alert variant="destructive">
                    <AlertTitle>
                      Language details could not be loaded
                    </AlertTitle>

                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              ) : null}

              {!isLoading && !error && data ? (
                <div className="min-h-0 flex-1">
                  <CiCodeEditor
                    content={selectedJson}
                    options={{
                      readOnly: true,
                      domReadOnly: true,
                      wordWrap: "on",
                      folding: true,
                      renderValidationDecorations: "off",
                    }}
                  />
                </div>
              ) : null}
            </main>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
