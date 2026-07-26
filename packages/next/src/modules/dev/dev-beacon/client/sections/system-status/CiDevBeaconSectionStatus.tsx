"use client";

import { CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME } from "@cloudigniter/core/lib";
import type { CiDevBeaconSectionStatusProps } from "@cloudigniter/core/types";
import type { CiNextContext } from "@ci-next/types";

import { CiDevBeaconGeneralStatusCard, CiDevBeaconTenantRouteCard } from "./cards";
import { CiDevBeaconDiagnosticsBox } from "./components";
import { CiDevBeaconStatusLanguage } from "./language";

export function CiDevBeaconSectionStatus({
  context,
  routeHeadersRefreshing = false,
}: CiDevBeaconSectionStatusProps<CiNextContext>) {
  const requestContextHeaderName =
    context.config.appCoreConfig.app?.requestContextHeaderName ?? CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME;

  const requestHeaderEntries = Object.entries(context.headers ?? {}).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  const requestCookieEntries = Object.entries(context.cookies ?? {}).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1 border-b pb-4">
        <h3 className="text-lg font-semibold">Application Status</h3>

        <p className="text-muted-foreground text-sm">
          Runtime, resolved routing context, request headers, and cookies.
        </p>
      </header>

      <section aria-label="Operational overview">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <CiDevBeaconGeneralStatusCard context={context} />

          <CiDevBeaconTenantRouteCard context={context} />

          <CiDevBeaconStatusLanguage endpoint={context.config.appResolvedCoreConfig.languageDiagnosticsEndpoint} />
        </div>
      </section>

      <section aria-label="Request diagnostics">
        <div className="mb-3">
          <h4 className="text-sm font-semibold">Request Diagnostics</h4>

          <p className="text-muted-foreground mt-1 text-xs">Values available in the current CloudIgniter context.</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <CiDevBeaconDiagnosticsBox
            title="Request Headers"
            description={
              <>
                Includes only <code>x-ci-*</code> and <code>x-app-*</code> headers.
              </>
            }
            entries={requestHeaderEntries}
            pendingEntryNames={routeHeadersRefreshing ? [requestContextHeaderName] : undefined}
            emptyMessage={
              <>
                No <code>x-ci-*</code> or <code>x-app-*</code> headers were received.
              </>
            }
          />

          <CiDevBeaconDiagnosticsBox
            title="Request Cookies"
            description={
              <>
                Includes only <code>ci-*</code> and <code>app-*</code> cookies.
              </>
            }
            entries={requestCookieEntries}
            emptyMessage={
              <>
                No <code>ci-*</code> or <code>app-*</code> cookies were received.
              </>
            }
          />
        </div>
      </section>
    </div>
  );
}
