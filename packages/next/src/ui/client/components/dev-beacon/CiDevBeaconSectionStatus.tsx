"use client";

import { useEffect, useState, type ReactNode } from "react";
import type {
  CiDevBeaconSectionStatusProps,
  CiDevTenantResolutionCheckup,
} from "@cloudigniter/core/types";

let cachedTenantResolutionCheckup: CiDevTenantResolutionCheckup | null = null;

let tenantResolutionCheckupPromise: Promise<CiDevTenantResolutionCheckup> | null =
  null;

async function ciGetTenantResolutionCheckup(): Promise<CiDevTenantResolutionCheckup> {
  if (cachedTenantResolutionCheckup) {
    return cachedTenantResolutionCheckup;
  }

  if (tenantResolutionCheckupPromise) {
    return tenantResolutionCheckupPromise;
  }

  tenantResolutionCheckupPromise = fetch(
    "/ci-internal/dev-beacon/tenant-resolution-checkup",
    {
      method: "GET",
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    },
  )
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `Tenant resolution checkup failed with HTTP ${response.status}.`,
        );
      }

      return (await response.json()) as CiDevTenantResolutionCheckup;
    })
    .then((result) => {
      cachedTenantResolutionCheckup = result;

      return result;
    })
    .catch((error) => {
      tenantResolutionCheckupPromise = null;

      throw error;
    });

  return tenantResolutionCheckupPromise;
}

export function CiDevBeaconSectionStatus({
  tenant,
}: CiDevBeaconSectionStatusProps) {
  const inferredTenantInfo = tenant ?? {
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

  const language = {
    locale: "en",
    dir: "ltr",
  };

  const [checkup, setCheckup] = useState<CiDevTenantResolutionCheckup | null>(
    cachedTenantResolutionCheckup,
  );

  const [checkupError, setCheckupError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    void ciGetTenantResolutionCheckup()
      .then((result) => {
        if (!isActive) {
          return;
        }

        setCheckup(result);
        setCheckupError(null);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setCheckupError(
          error instanceof Error
            ? error.message
            : "Tenant resolution checkup failed.",
        );
      });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1 border-b pb-4">
        <h3 className="text-lg font-semibold">Status</h3>

        <p className="text-sm text-muted-foreground">
          Runtime, resolved routing context, request headers, and cookies.
        </p>
      </header>

      <section aria-label="Operational overview">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold">Overview</h4>

          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            Source: {inferredTenantInfo.source}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <CiDevBeaconStatusCard title="System Status">
            <CiDevBeaconStatusRow label="Next.js Runtime" value="App Router" />

            <CiDevBeaconStatusRow
              label="Amplify Auth"
              value="OK"
              valueClassName="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            />

            <CiDevBeaconStatusRow
              label="Data Schema"
              value="Check"
              valueClassName="bg-amber-500/10 text-amber-700 dark:text-amber-400"
            />

            <CiDevBeaconStatusRow
              label="Tenant Resolution"
              value={
                checkupError
                  ? "Failed"
                  : checkup
                  ? `Passed · ${checkup.tenant.passed}/${checkup.tenant.total}`
                  : "Checking…"
              }
              valueClassName={
                checkupError || (checkup && checkup.tenant.failed > 0)
                  ? "bg-red-500/10 text-red-700 dark:text-red-400"
                  : checkup
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              }
            />

            <CiDevBeaconStatusRow
              label="Org Unit Resolution"
              value={
                checkupError
                  ? "Failed"
                  : checkup
                  ? `Passed · ${checkup.orgUnit.passed}/${checkup.orgUnit.total}`
                  : "Checking…"
              }
              valueClassName={
                checkupError || (checkup && checkup.orgUnit.failed > 0)
                  ? "bg-red-500/10 text-red-700 dark:text-red-400"
                  : checkup
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              }
            />
          </CiDevBeaconStatusCard>

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

          <CiDevBeaconStatusCard title="Language">
            <CiDevBeaconStatusRow label="Locale" value={language.locale} mono />

            <CiDevBeaconStatusRow label="Direction" value={language.dir} mono />

            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Source: i18n provider and CloudIgniter configuration.
            </p>
          </CiDevBeaconStatusCard>
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

function CiDevBeaconStatusCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm">
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>

      <div className="space-y-2">{children}</div>
    </section>
  );
}

function CiDevBeaconStatusRow({
  label,
  value,
  mono = false,
  allowWrap = false,
  valueClassName,
}: {
  label: string;
  value: string;
  mono?: boolean;
  allowWrap?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>

      <span
        className={[
          "max-w-[65%] rounded px-2 py-0.5 text-right text-xs",
          mono ? "bg-muted font-mono" : "bg-muted/70",
          allowWrap ? "break-all" : "truncate",
          valueClassName ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

function CiDevBeaconDiagnosticsBox({
  title,
  description,
  entries,
  emptyMessage,
}: {
  title: string;
  description: ReactNode;
  entries: Array<[string, string]>;
  emptyMessage: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <header className="flex items-start justify-between gap-3 border-b bg-muted/25 px-4 py-3">
        <div>
          <h5 className="text-sm font-semibold">{title}</h5>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-border">
          {entries.length}
        </span>
      </header>

      {entries.length > 0 ? (
        <div className="max-h-80 overflow-auto">
          <dl className="divide-y">
            {entries.map(([name, value]) => (
              <div
                key={name}
                className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-4 px-4 py-3"
              >
                <dt className="break-all font-mono text-xs text-muted-foreground">
                  {name}
                </dt>

                <dd className="break-all text-right font-mono text-xs text-foreground">
                  {value || "—"}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}
