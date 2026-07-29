"use client";

import { CI_DEFAULT_REQUEST_CONTEXT_COOKIE_NAME, CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME } from "@cloudigniter/core/lib";
import type { CiDevBeaconSectionStatusProps } from "@cloudigniter/core/types";
import type { CiNextContext } from "@ci-next/types";

import { CiDevBeaconGeneralDiagnisticsCard, CiDevBeaconTenantRouteCard, CiDevBeaconRequestContextCard } from "./cards";
import { CiDevBeaconStatusLanguage } from "./language";

export function CiDevBeaconSectionDiagnostics({
  context,
  routeHeadersRefreshing = false,
}: CiDevBeaconSectionStatusProps<CiNextContext>) {
  const requestContextHeaderName =
    context.config.appCoreConfig.request.context.requestContextHeaderName ?? CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME;

  const requestContextCookieName =
    context.config.appCoreConfig.request.context.requestContextCookieName ?? CI_DEFAULT_REQUEST_CONTEXT_COOKIE_NAME;

  const requestHeaderEntries = Object.entries(context.headers ?? {}).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  const requestCookieEntries = Object.entries(context.cookies ?? {}).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  const requestContextHeaderValue =
    requestHeaderEntries.find(([name]) => name.toLowerCase() === requestContextHeaderName.toLowerCase())?.[1] ?? null;

  const requestContextCookieValue =
    requestCookieEntries.find(([name]) => name === requestContextCookieName)?.[1] ?? null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1 border-b pb-4">
        <h3 className="text-lg font-semibold">System Diagnostics</h3>

        <p className="text-muted-foreground text-sm">
          Runtime, resolved routing context, request headers, and cookies.
        </p>
      </header>

      <section aria-label="Operational overview">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <CiDevBeaconGeneralDiagnisticsCard context={context} />

          <CiDevBeaconTenantRouteCard context={context} />

          <CiDevBeaconStatusLanguage endpoint={context.config.appResolvedCoreConfig.languageDiagnosticsEndpoint} />
        </div>
      </section>

      <section aria-labelledby="ci-dev-beacon-request-context-title">
        <div className="mb-3">
          <h4 id="ci-dev-beacon-request-context-title" className="text-sm font-semibold">
            Request Diagnostics
          </h4>

          <p className="mt-1 text-xs text-muted-foreground">
            Request-context data received from the header and cookie.
          </p>
        </div>

        <CiDevBeaconRequestContextCard
          entries={[
            {
              source: "header",
              label: "Request Context Header",
              name: requestContextHeaderName,
              value: requestContextHeaderValue,
              pending: routeHeadersRefreshing,
            },
            {
              source: "cookie",
              label: "Request Context Cookie",
              name: requestContextCookieName,
              value: requestContextCookieValue,
            },
          ]}
        />
      </section>
    </div>
  );
}
