// packages/next/src/ui/client/components/dev-beacon/CiDevBeaconLanguageMessagesModal.tsx

"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";

import { ciIsDevBeaconLanguageErrorResponse } from "@cloudigniter/core/lib";
import type {
  CiDevBeaconLanguageMessageEntry,
  CiDevBeaconLanguageMessagesResponse,
  CiLocaleDirection,
} from "@cloudigniter/core/types";

import {
  Button,
  Input,
  ScrollArea,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@ci-next/ui/client";

type CiDevBeaconLanguageMessagesModalProps = {
  open: boolean;
  onClose: () => void;
  endpoint: string;
  pathname: string;
  locale: string;
  dir: CiLocaleDirection;
};

type CiMessagesView = "effective" | "source";

function ciFormatMessageValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value === undefined) {
    return "undefined";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function ciMatchesMessage(
  entry: CiDevBeaconLanguageMessageEntry,
  query: string,
): boolean {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return (
    entry.key.toLocaleLowerCase().includes(normalizedQuery) ||
    ciFormatMessageValue(entry.value)
      .toLocaleLowerCase()
      .includes(normalizedQuery)
  );
}

export function CiDevBeaconLanguageMessagesModal({
  open,
  onClose,
  endpoint,
  pathname,
  locale,
  dir,
}: CiDevBeaconLanguageMessagesModalProps) {
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const activeElementRef = React.useRef<HTMLElement | null>(null);

  const [data, setData] = React.useState<CiDevBeaconLanguageMessagesResponse>();
  const [error, setError] = React.useState<string>();
  const [isLoading, setIsLoading] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<CiMessagesView>("effective");

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const controller = new AbortController();

    const loadMessages = async () => {
      setIsLoading(true);
      setError(undefined);
      setQuery("");
      setView("effective");

      try {
        const requestUrl = new URL(endpoint, window.location.origin);

        requestUrl.searchParams.set("pathname", pathname);
        requestUrl.searchParams.set("detail", "messages");

        const response = await fetch(requestUrl, {
          cache: "no-store",
          signal: controller.signal,
        });

        const payload: unknown = await response.json();

        if (ciIsDevBeaconLanguageErrorResponse(payload)) {
          throw new Error(payload.error.message);
        }

        if (!response.ok) {
          throw new Error(
            `Language diagnostics request failed with status ${response.status}.`,
          );
        }

        setData(payload as CiDevBeaconLanguageMessagesResponse);
      } catch (caughtError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not load the resolved language messages.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadMessages();

    return () => {
      controller.abort();
    };
  }, [endpoint, open, pathname]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;

    activeElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      activeElementRef.current?.focus();
      activeElementRef.current = null;
    };
  }, [onClose, open]);

  const resolvedLocale = data?.locale ?? locale;
  const resolvedDir = data?.dir ?? dir;

  const effectiveMessages = React.useMemo(
    () =>
      (data?.effectiveMessages ?? []).filter((entry) =>
        ciMatchesMessage(entry, query),
      ),
    [data?.effectiveMessages, query],
  );

  const sourceMessageGroups = React.useMemo(
    () =>
      (data?.sourceMessages ?? [])
        .map((sourceFile) => ({
          ...sourceFile,
          entries: sourceFile.entries.filter((entry) =>
            ciMatchesMessage(entry, query),
          ),
        }))
        .filter((sourceFile) => sourceFile.entries.length > 0),
    [data?.sourceMessages, query],
  );

  const hasNoResults =
    !isLoading &&
    !error &&
    ((view === "effective" && effectiveMessages.length === 0) ||
      (view === "source" && sourceMessageGroups.length === 0));

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-3100 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ci-dev-beacon-language-messages-title"
        aria-describedby="ci-dev-beacon-language-messages-description"
        tabIndex={-1}
        className="bg-background flex max-h-[88vh] w-[min(1120px,calc(100vw-2rem))] flex-col gap-0 overflow-hidden rounded-lg border p-0 shadow-2xl outline-none"
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        <header className="border-b px-6 py-5">
          <h2
            id="ci-dev-beacon-language-messages-title"
            className="text-lg font-semibold"
          >
            {data
              ? `Loaded messages · ${data.diagnostics.effectiveMessageCount}`
              : "Loaded messages"}
          </h2>

          <p
            id="ci-dev-beacon-language-messages-description"
            className="mt-1 text-sm text-muted-foreground"
          >
            <span>
              Locale: <strong>{resolvedLocale}</strong>
            </span>
            <span className="px-1.5">·</span>
            <span>
              Direction: <strong>{resolvedDir}</strong>
            </span>
            {data?.namespace ? (
              <>
                <span className="px-1.5">·</span>
                <span>
                  Namespace: <strong>{data.namespace}</strong>
                </span>
              </>
            ) : null}
          </p>
        </header>

        <div
          dir={resolvedDir}
          className="flex min-h-0 flex-1 flex-col gap-4 px-6 py-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
              value={view}
              onValueChange={(value) => setView(value as CiMessagesView)}
            >
              <TabsList>
                <TabsTrigger value="effective">Effective messages</TabsTrigger>

                <TabsTrigger value="source">By source file</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search key or value..."
                className="ps-9"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden rounded-lg border">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="h-4 w-2/5" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                ))}
              </div>
            ) : null}

            {error ? (
              <div className="p-5">
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  <p className="font-semibold">
                    Language messages could not be loaded
                  </p>

                  <p className="mt-1 text-xs">{error}</p>
                </div>
              </div>
            ) : null}

            {!isLoading && !error && hasNoResults ? (
              <div className="flex min-h-64 items-center justify-center p-6 text-center">
                <div>
                  <p className="text-sm font-medium">
                    No matching messages found
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Try a different message key or translated value.
                  </p>
                </div>
              </div>
            ) : null}

            {!isLoading && !error && view === "effective" ? (
              <ScrollArea className="h-[56vh]">
                <div className="divide-y">
                  {effectiveMessages.map((entry) => (
                    <article key={entry.key} className="px-4 py-3">
                      <code className="block break-all text-xs font-semibold text-foreground">
                        {entry.key}
                      </code>

                      <pre className="mt-2 whitespace-pre-wrap break-words rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                        {ciFormatMessageValue(entry.value)}
                      </pre>
                    </article>
                  ))}
                </div>
              </ScrollArea>
            ) : null}

            {!isLoading && !error && view === "source" ? (
              <ScrollArea className="h-[56vh]">
                <div className="space-y-4 p-4">
                  {sourceMessageGroups.map((sourceFile) => (
                    <section
                      key={sourceFile.id}
                      className="overflow-hidden rounded-lg border"
                    >
                      <header className="flex items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
                        <code className="break-all text-xs font-semibold">
                          {sourceFile.source}/{sourceFile.fileName}.json
                        </code>

                        <span className="shrink-0 text-xs text-muted-foreground">
                          {sourceFile.entries.length} messages
                        </span>
                      </header>

                      <div className="divide-y">
                        {sourceFile.entries.map((entry) => (
                          <article key={entry.key} className="px-4 py-3">
                            <code className="block break-all text-xs font-semibold text-foreground">
                              {entry.key}
                            </code>

                            <pre className="mt-2 whitespace-pre-wrap break-words rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                              {ciFormatMessageValue(entry.value)}
                            </pre>
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </ScrollArea>
            ) : null}
          </div>
        </div>

        <footer className="flex justify-end border-t px-6 py-4">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Close
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
