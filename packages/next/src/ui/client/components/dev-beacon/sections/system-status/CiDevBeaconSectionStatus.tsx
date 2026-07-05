"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type {
  CiDevBeaconSectionStatusProps,
  CiDevTenantResolutionCheckup,
} from "@cloudigniter/core/types";

import { Button } from "@ci-next/ui/client";
import { CiDevBeaconStatusLanguage } from "./language/CiDevBeaconStatusLanguage";

type CiDevResolutionCheckArea =
  CiDevTenantResolutionCheckup["checks"][number]["area"];

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
  languageDiagnosticsEndpoint,
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

  const [checkup, setCheckup] = useState<CiDevTenantResolutionCheckup | null>(
    cachedTenantResolutionCheckup,
  );

  const [checkupError, setCheckupError] = useState<string | null>(null);

  const [checkupReportArea, setCheckupReportArea] =
    useState<CiDevResolutionCheckArea | null>(null);

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
              onClick={
                checkup ? () => setCheckupReportArea("tenant") : undefined
              }
              clickTitle="Open Tenant Resolution report"
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
              onClick={
                checkup ? () => setCheckupReportArea("orgUnit") : undefined
              }
              clickTitle="Open Org Unit Resolution report"
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

          <div className="border-t pt-5">
            <CiDevBeaconStatusLanguage endpoint={languageDiagnosticsEndpoint} />
          </div>
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

      <CiDevBeaconResolutionCheckupModal
        area={checkupReportArea}
        checkup={checkup}
        onClose={() => setCheckupReportArea(null)}
      />
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
  onClick,
  clickTitle,
}: {
  label: string;
  value: string;
  mono?: boolean;
  allowWrap?: boolean;
  valueClassName?: string;
  onClick?: () => void;
  clickTitle?: string;
}) {
  const valueClasses = [
    "max-w-[65%] rounded px-2 py-0.5 text-right text-xs",
    mono ? "bg-muted font-mono" : "bg-muted/70",
    allowWrap ? "break-all" : "truncate",
    onClick ? "cursor-pointer appearance-none border-0" : "",
    valueClassName ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>

      {onClick ? (
        <button
          type="button"
          className={valueClasses}
          title={clickTitle ?? value}
          onClick={onClick}
        >
          {value}
        </button>
      ) : (
        <span className={valueClasses} title={value}>
          {value}
        </span>
      )}
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

function CiDevBeaconResolutionCheckupModal({
  area,
  checkup,
  onClose,
}: {
  area: CiDevResolutionCheckArea | null;
  checkup: CiDevTenantResolutionCheckup | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const activeElementRef = useRef<HTMLElement | null>(null);

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

  useEffect(() => {
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

    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      activeElementRef.current?.focus();
      activeElementRef.current = null;
    };
  }, [onClose, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-2147483647 flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ci-dev-beacon-resolution-checkup-title"
        aria-describedby="ci-dev-beacon-resolution-checkup-description"
        tabIndex={-1}
        className="relative z-10 flex h-[min(48rem,calc(100dvh-2rem))] w-[min(110rem,calc(100vw-2rem))] max-w-none flex-col overflow-hidden rounded-xl border bg-background text-foreground shadow-2xl outline-none"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b px-6 py-5">
          <div>
            <h2
              id="ci-dev-beacon-resolution-checkup-title"
              className="text-base font-semibold"
            >
              {title}
            </h2>

            <p
              id="ci-dev-beacon-resolution-checkup-description"
              className="mt-1 text-sm text-muted-foreground"
            >
              {summary
                ? `${summary.passed} passed · ${summary.failed} failed · ${summary.total} total`
                : "Resolution probe report."}
            </p>
          </div>

          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          <div className="space-y-3">
            {checks.map((check) => (
              <article key={check.id} className="rounded-lg border bg-card p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h5 className="text-sm font-semibold">{check.label}</h5>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {check.message}
                    </p>
                  </div>

                  <span
                    className={[
                      "shrink-0 rounded px-2 py-0.5 text-xs font-medium",
                      check.state === "passed"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : check.state === "failed"
                        ? "bg-red-500/10 text-red-700 dark:text-red-400"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                    ].join(" ")}
                  >
                    {check.state}
                  </span>
                </div>

                {check.pathname ? (
                  <div className="mt-3 rounded-md border bg-muted/30 px-3 py-2">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Probe Pathname
                    </div>

                    <code className="mt-1 block break-all font-mono text-xs text-foreground">
                      {check.pathname}
                    </code>
                  </div>
                ) : null}

                <dl className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div>
                    <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Expected
                    </dt>

                    <dd className="max-h-52 overflow-auto overscroll-contain rounded bg-muted/60 p-3">
                      <pre className="whitespace-pre-wrap break-all font-mono text-xs">
                        {ciFormatResolutionCheckValue(check.expected)}
                      </pre>
                    </dd>
                  </div>

                  <div>
                    <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Actual
                    </dt>

                    <dd className="max-h-52 overflow-auto overscroll-contain rounded bg-muted/60 p-3">
                      <pre className="whitespace-pre-wrap break-all font-mono text-xs">
                        {ciFormatResolutionCheckValue(check.actual)}
                      </pre>
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ciFormatResolutionCheckValue(
  value: Record<string, unknown> | undefined,
): string {
  return value ? JSON.stringify(value, null, 2) : "—";
}
