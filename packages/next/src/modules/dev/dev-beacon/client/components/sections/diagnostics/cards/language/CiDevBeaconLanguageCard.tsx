"use client";

import * as React from "react";
import { CircleAlert, Code2, Loader2, RefreshCw } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";

import { Alert, AlertDescription, AlertTitle, Button, cn } from "@cloudigniter/ui/client";
import { ciGetLangDir, ciIsDevBeaconLanguageErrorResponse } from "@cloudigniter/core/lib";
import type { CiDevBeaconLanguageSummaryResponse } from "@cloudigniter/core/types";

import {
  CiDevBeaconCard,
  CiDevBeaconCardRowGrid,
  CiDevBeaconCardSummaryValue,
} from "@ci-next/modules/dev/dev-beacon/client/components";

import { CiDevBeaconLanguageDetailsModal } from "./components";

export interface CiDevBeaconLanguageCardProps {
  endpoint?: string;
}

export function CiDevBeaconLanguageCard({
  endpoint = "/ci-internal/dev-beacon/language",
}: CiDevBeaconLanguageCardProps) {
  const pathname = usePathname() ?? "/";
  const locale = useLocale();
  const dir = ciGetLangDir(locale);

  const [summary, setSummary] = React.useState<CiDevBeaconLanguageSummaryResponse>();
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
        requestUrl.searchParams.set("detail", "messages");

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
          throw new Error(`Language diagnostics request failed with status ${response.status}.`);
        }

        const result = payload as CiDevBeaconLanguageSummaryResponse;

        if (result.locale !== locale) {
          throw new Error(
            `Language diagnostics locale mismatch. Expected "${locale}" but received "${result.locale}".`,
          );
        }

        if (result.dir !== dir) {
          throw new Error(`Language diagnostics direction mismatch. Expected "${dir}" but received "${result.dir}".`);
        }

        setSummary(result);
      } catch (caughtError) {
        if (signal?.aborted) {
          return;
        }

        setError(caughtError instanceof Error ? caughtError.message : "Could not resolve language diagnostics.");
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
      <CiDevBeaconCard
        dir={dir}
        title="Language"
        description="Resolved locale and translation bundle summary for this route."
        tooltip={
          <>
            Shows the locale, text direction, translation namespace, and message resolution statistics for the current
            route. The diagnostics endpoint{" "}
            <code className="rounded bg-black/10 px-1 py-0.5 font-mono text-xs dark:bg-white/10">{endpoint}</code> reads
            both CloudIgniter request-context transports and accepts only a resolved context matching the current
            pathname. Cookie correlation is required because internal endpoints bypass the application proxy, and
            browser fetch requests do not inherit the page’s server-side request headers.
          </>
        }
        tooltipAriaLabel="About language diagnostics"
        contentClassName="space-y-4"
        headerAction={
          <Button
            size="icon"
            variant="ghost"
            disabled={isLoading}
            onClick={() => void loadSummary()}
            aria-label="Refresh language diagnostics"
            title="Refresh language diagnostics"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="size-4" aria-hidden="true" />
            )}
          </Button>
        }
      >
        <CiDevBeaconCardRowGrid columns={3} className="gap-3 lg:grid-cols-3">
          <CiDevBeaconCardSummaryValue label="Locale" value={locale} />

          <CiDevBeaconCardSummaryValue label="Direction" value={dir} />

          <CiDevBeaconCardSummaryValue label="Namespace" value={summary?.namespace ?? "Resolving…"} mono />

          <CiDevBeaconCardSummaryValue
            label="Effective Messages"
            value={summary ? summary.diagnostics.effectiveMessageCount : "—"}
          />

          <CiDevBeaconCardSummaryValue
            label="Custom Overrides"
            value={summary ? summary.diagnostics.customOverrideCount : "—"}
          />

          <CiDevBeaconCardSummaryValue label="Route Pathname" value={summary?.urlPath ?? pathname} mono />
        </CiDevBeaconCardRowGrid>

        {error ? (
          <Alert
            variant="destructive"
            className="flex items-start gap-3 border-red-300 bg-red-50 px-4 py-3 text-red-950 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
          >
            <CircleAlert className="mt-0.5 size-7 shrink-0 text-red-700 dark:text-red-400" aria-hidden="true" />

            <div className="min-w-0 flex-1 space-y-1">
              <AlertTitle className="text-red-950 dark:text-red-200">
                Language diagnostics could not be resolved
              </AlertTitle>

              <AlertDescription className="text-red-900 dark:text-red-300">{error}</AlertDescription>
            </div>
          </Alert>
        ) : null}

        <Button
          type="button"
          className={cn(
            "w-full",
            "border border-orange-200 bg-orange-100 text-orange-900",
            "hover:bg-orange-200 hover:text-orange-950",
            "dark:border-orange-800 dark:bg-orange-950/60 dark:text-orange-200",
            "dark:hover:bg-orange-900/70 dark:hover:text-orange-100",
          )}
          disabled={!summary || isLoading}
          onClick={() => setDetailsOpen(true)}
        >
          <Code2 className="size-4" aria-hidden="true" />
          Show language details
        </Button>
      </CiDevBeaconCard>

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
