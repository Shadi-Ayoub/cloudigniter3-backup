"use client";

import type { CiDevBeaconSectionStatusProps } from "@cloudigniter/core/types";
import type { CiNextContext } from "@ci-next/types";
import { CiDevBeaconGeneralStatusCard } from "./cards";
import { CiDevBeaconStatusLanguage } from "./language";
import {
  CiDevBeaconDiagnosticsBox,
  CiDevBeaconStatusCard,
  CiDevBeaconStatusRow,
} from "./components";

const CI_ROUTE_DERIVED_HEADER_NAMES = [
  "x-ci-feature-pathname",
  "x-ci-route-namespace",
  "x-ci-route-pathname",
] as const;

export function CiDevBeaconSectionStatus({
  pathname,
  context,
  routeHeadersRefreshing = false,
}: CiDevBeaconSectionStatusProps<CiNextContext>) {
  const inferredTenantInfo = context.tenant ?? {
    source: "headers" as const,
    scope: "system" as const,
  };

  const forwardedHeaderEntries = Object.entries(
    inferredTenantInfo.forwardedHeaders ?? {},
  ).sort(([left], [right]) => left.localeCompare(right));

  const forwardedCookieEntries = Object.entries(
    inferredTenantInfo.forwardedCookies ?? {},
  ).sort(([left], [right]) => left.localeCompare(right));

  const tenantDisplayValue =
    inferredTenantInfo.name ??
    inferredTenantInfo.slug ??
    inferredTenantInfo.id ??
    "—";

  const hasDistinctTenantId =
    Boolean(inferredTenantInfo.id) &&
    inferredTenantInfo.id !== inferredTenantInfo.slug;

  const hasDistinctTenantSlug =
    Boolean(inferredTenantInfo.slug) &&
    inferredTenantInfo.slug !== inferredTenantInfo.id;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1 border-b pb-4">
        <h3 className="text-lg font-semibold">Status</h3>

        <p className="text-sm text-muted-foreground">
          Runtime, resolved routing context, request headers, and cookies.
        </p>
      </header>

      <section aria-label="Operational overview">
        {/* <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold">Overview</h4>

          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            Source: {inferredTenantInfo.source}
          </span>
        </div> */}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <CiDevBeaconGeneralStatusCard context={context} />
          <CiDevBeaconStatusCard title="Tenant & Routing Context">
            <CiDevBeaconStatusRow
              label="Tenant"
              value={tenantDisplayValue}
              mono={!inferredTenantInfo.name}
            />

            <CiDevBeaconStatusRow
              label="Scope"
              value={inferredTenantInfo.scope}
            />

            <CiDevBeaconStatusRow
              label="Mode"
              value={inferredTenantInfo.mode ?? "—"}
              mono
            />

            <CiDevBeaconStatusRow
              label="Status"
              value={inferredTenantInfo.status ?? "—"}
            />

            {hasDistinctTenantSlug ? (
              <CiDevBeaconStatusRow
                label="Route Slug"
                value={inferredTenantInfo.slug ?? "—"}
                mono
              />
            ) : null}

            {hasDistinctTenantId ? (
              <CiDevBeaconStatusRow
                label="Tenant ID"
                value={inferredTenantInfo.id ?? "—"}
                mono
              />
            ) : null}

            <div className="my-3 border-t" />

            <CiDevBeaconStatusRow
              label="Org Unit"
              value={inferredTenantInfo.orgUnitPath ?? "—"}
              mono
              allowWrap
            />

            <CiDevBeaconStatusRow
              label="Feature Route"
              value={inferredTenantInfo.featurePathname ?? "—"}
              mono
              allowWrap
            />

            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Resolved by proxy and forwarded to the current request.
            </p>
          </CiDevBeaconStatusCard>
          <CiDevBeaconStatusLanguage
            endpoint={
              context.config.appResolvedCoreConfig.languageDiagnosticsEndpoint
            }
          />
        </div>
      </section>

      <section aria-label="Request diagnostics">
        <div className="mb-3">
          <h4 className="text-sm font-semibold">Request Diagnostics</h4>

          <p className="mt-1 text-xs text-muted-foreground">
            Values visible to the current Server Component request.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <CiDevBeaconDiagnosticsBox
            title="Forwarded Request Headers"
            description={
              <>
                Includes only <code>x-ci-*</code> and <code>x-app-*</code>{" "}
                headers.
              </>
            }
            entries={forwardedHeaderEntries}
            pendingEntryNames={
              routeHeadersRefreshing ? CI_ROUTE_DERIVED_HEADER_NAMES : undefined
            }
            emptyMessage={
              <>
                No <code>x-ci-*</code> or <code>x-app-*</code> headers were
                received.
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
            entries={forwardedCookieEntries}
            emptyMessage={
              <>
                No <code>ci-*</code> or <code>app-*</code> cookies were
                received.
              </>
            }
          />
        </div>
      </section>
    </div>
  );
}
