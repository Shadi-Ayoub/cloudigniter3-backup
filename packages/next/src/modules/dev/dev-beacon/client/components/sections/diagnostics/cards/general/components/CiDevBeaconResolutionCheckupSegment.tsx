"use client";

import { useEffect, useState } from "react";
import type { CiDevTenantResolutionCheckup } from "@cloudigniter/core/types";
import { CiDevBeaconCardRow } from "@ci-next/modules/dev/dev-beacon/client/components";
import { CiDevBeaconResolutionCheckupModal } from "../components";
import { ciGetTenantResolutionCheckup } from "../helpers";
import type { CiDevResolutionCheckArea } from "../types";

let cachedTenantResolutionCheckup: CiDevTenantResolutionCheckup | null = null;

export function CiDevBeaconResolutionCheckupSegment() {
  const [checkupError, setCheckupError] = useState<string | null>(null);
  const [checkupReportArea, setCheckupReportArea] = useState<CiDevResolutionCheckArea | null>(null);

  const [checkup, setCheckup] = useState<CiDevTenantResolutionCheckup | null>(() => cachedTenantResolutionCheckup);

  useEffect(() => {
    let isActive = true;

    setCheckupError(null);

    void ciGetTenantResolutionCheckup()
      .then((result) => {
        if (!isActive) {
          return;
        }

        cachedTenantResolutionCheckup = result;

        setCheckup(result);
        setCheckupError(null);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        console.error("Tenant resolution checkup failed:", error);

        setCheckupError(error instanceof Error ? error.message : "Tenant resolution checkup failed.");
      });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <>
      <CiDevBeaconCardRow
        label="Tenant Resolution"
        value={
          checkupError ? "Failed" : checkup ? `Passed ${checkup.tenant.passed}/${checkup.tenant.total}` : "Checking…"
        }
        valueClassName={
          checkupError || (checkup && checkup.tenant.failed > 0)
            ? "bg-red-500/10 text-red-700 dark:text-red-400"
            : checkup
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "bg-muted text-muted-foreground"
        }
        onClick={checkup ? () => setCheckupReportArea("tenant") : undefined}
        clickTitle="Open Tenant Resolution report"
      />

      <CiDevBeaconCardRow
        label="Org Unit Resolution"
        value={
          checkupError ? "Failed" : checkup ? `Passed ${checkup.orgUnit.passed}/${checkup.orgUnit.total}` : "Checking…"
        }
        valueClassName={
          checkupError || (checkup && checkup.orgUnit.failed > 0)
            ? "bg-red-500/10 text-red-700 dark:text-red-400"
            : checkup
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "bg-muted text-muted-foreground"
        }
        onClick={checkup ? () => setCheckupReportArea("orgUnit") : undefined}
        clickTitle="Open Org Unit Resolution report"
      />
      <CiDevBeaconResolutionCheckupModal
        area={checkupReportArea}
        checkup={checkup}
        onClose={() => setCheckupReportArea(null)}
      />
    </>
  );
}
