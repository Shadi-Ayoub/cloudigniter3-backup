"use client";

import * as React from "react";
import { Code2, FileSearch, Loader2, RefreshCw } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@cloudigniter/ui/client";
import {
  ciGetLangDir,
  ciIsDevBeaconLanguageErrorResponse,
} from "@cloudigniter/core/lib";
import type { CiDevBeaconLanguageSummaryResponse } from "@cloudigniter/core/types";

import { CiDevBeaconLanguageDetailsModal } from "./CiDevBeaconLanguageDetailsModal";

type CiDevBeaconStatusLanguageProps = {
  endpoint?: string;
};

type CiLanguageSummaryValueProps = {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
};

function CiLanguageSummaryValue({
  label,
  value,
  mono = false,
}: CiLanguageSummaryValueProps) {
  return (
    <div className="min-w-0 rounded-md border border-border p-3">
      <span className="block text-xs text-muted-foreground">{label}</span>

      <strong
        className={[
          "mt-1 block break-all text-sm",
          mono ? "font-mono text-xs" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </strong>
    </div>
  );
}

export function CiDevBeaconStatusLanguage({
  endpoint = "/ci-internal/dev-beacon/language",
}: CiDevBeaconStatusLanguageProps) {
  const pathname = usePathname() ?? "/";
  const locale = useLocale();
  const dir = ciGetLangDir(locale);

  const [summary, setSummary] =
    React.useState<CiDevBeaconLanguageSummaryResponse>();
  const [error, setError] = React.useState<string>();
  const [isLoading, setIsLoading] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const loadSummary = React.useCallback(
    async (signal?: AbortSignal) => {
      setError(undefined);
      setIsLoading(true);

      try {
        const requestUrl = new URL(endpoint, window.location.origin);

        requestUrl.searchParams.set("pathname", pathname);
        requestUrl.searchParams.set("locale", locale);

        const response = await fetch(requestUrl, {
          cache: "no-store",
          credentials: "same-origin",
          signal,
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

        const result = payload as CiDevBeaconLanguageSummaryResponse;

        if (result.locale !== locale) {
          throw new Error(
            `Language diagnostics locale mismatch. Expected "${locale}" but received "${result.locale}".`,
          );
        }

        if (result.dir !== dir) {
          throw new Error(
            `Language diagnostics direction mismatch. Expected "${dir}" but received "${result.dir}".`,
          );
        }

        setSummary(result);
      } catch (caughtError) {
        if (signal?.aborted) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not resolve language diagnostics.",
        );
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [dir, endpoint, locale, pathname],
  );

  React.useEffect(() => {
    const controller = new AbortController();

    void loadSummary(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadSummary]);

  return (
    <>
      <Card dir={dir}>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">Language</CardTitle>

            <CardDescription className="mt-1">
              Resolved locale and translation bundle summary for this route.
            </CardDescription>
          </div>

          <Button
            size="icon"
            variant="ghost"
            disabled={isLoading}
            onClick={() => void loadSummary()}
            aria-label="Refresh language diagnostics"
            title="Refresh language diagnostics"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <CiLanguageSummaryValue label="Locale" value={locale} />

            <CiLanguageSummaryValue label="Direction" value={dir} />

            <CiLanguageSummaryValue
              label="Namespace"
              value={summary?.namespace ?? "Resolving…"}
              mono
            />

            <CiLanguageSummaryValue
              label="Effective Messages"
              value={summary ? summary.diagnostics.effectiveMessageCount : "—"}
            />

            <CiLanguageSummaryValue
              label="Custom Overrides"
              value={summary ? summary.diagnostics.customOverrideCount : "—"}
            />

            <CiLanguageSummaryValue
              label="Route pathname"
              value={summary?.urlPath ?? pathname}
              mono
            />
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>
                Language diagnostics could not be resolved
              </AlertTitle>

              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Button
            className="w-full"
            disabled={!summary || isLoading}
            onClick={() => setDetailsOpen(true)}
          >
            <Code2 className="size-4" />
            Show language details
          </Button>
        </CardContent>
      </Card>

      <CiDevBeaconLanguageDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        endpoint={endpoint}
        pathname={pathname}
        locale={locale}
        dir={dir}
      />
    </>
  );
}
