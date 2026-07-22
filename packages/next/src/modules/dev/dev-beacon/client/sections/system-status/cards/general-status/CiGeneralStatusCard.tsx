"use client";

import { useEffect, useState } from "react";
import type { CiDevTenantResolutionCheckup } from "@cloudigniter/core/types";
import type { CiAmplifyOutputs } from "@cloudigniter/aws/types";
import {
  CiDevBeaconCardRowSeparator,
  CiDevBeaconStatusCard,
  CiDevBeaconStatusRow,
} from "../../components";
import type { CiNextContext } from "@ci-next/types";
import {
  CiDevBeaconProvidersStatusRow,
  CiDevBeaconResolutionCheckupModal,
} from "./components";
import { ciGetTenantResolutionCheckup } from "./helpers";
import type { CiDevResolutionCheckArea } from "./types";

interface CiDevBeaconGeneralStatusCardProps {
  context: CiNextContext;
}
export function CiDevBeaconGeneralStatusCard({
  context,
}: CiDevBeaconGeneralStatusCardProps) {
  let cachedTenantResolutionCheckup: CiDevTenantResolutionCheckup | null = null;

  const [checkupError, setCheckupError] = useState<string | null>(null);

  const [checkupReportArea, setCheckupReportArea] =
    useState<CiDevResolutionCheckArea | null>(null);

  const [checkup, setCheckup] = useState<CiDevTenantResolutionCheckup | null>(
    cachedTenantResolutionCheckup,
  );

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

  const platform = context.config.appCoreConfig.app?.platform ?? "UNKNOWN!";
  const platformVersion =
    context.config.appCoreConfig.app?.version ?? "UNKNOWN!";
  const isNextJs = platform == "Next.js";
  // const providers = Object.keys(context.config.appCoreConfig.providers ?? []);
  const providers = context.config.appCoreConfig.providers ?? [];
  const IsUsingAwsProvider = context.config.appCoreConfig.providers?.aws;

  return (
    <>
      <CiDevBeaconStatusCard title="System Status">
        <CiDevBeaconStatusRow label="Platform Name" value={platform} />

        {isNextJs && (
          <>
            <CiDevBeaconStatusRow
              label="Platform Version"
              value={platformVersion}
            />
            <CiDevBeaconStatusRow label="Platform Runtime" value="App Router" />
          </>
        )}

        <CiDevBeaconCardRowSeparator />

        <CiDevBeaconProvidersStatusRow providers={providers} />

        {IsUsingAwsProvider && (
          <CiDevBeaconStatusRow
            label="Amplify Auth"
            value="OK"
            valueClassName="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          />
        )}

        <CiDevBeaconStatusRow
          label="Data Schema"
          value="Check"
          valueClassName="bg-amber-500/10 text-amber-700 dark:text-amber-400"
        />

        <CiDevBeaconCardRowSeparator />

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
          onClick={checkup ? () => setCheckupReportArea("tenant") : undefined}
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
          onClick={checkup ? () => setCheckupReportArea("orgUnit") : undefined}
          clickTitle="Open Org Unit Resolution report"
        />
      </CiDevBeaconStatusCard>
      <CiDevBeaconResolutionCheckupModal
        area={checkupReportArea}
        checkup={checkup}
        onClose={() => setCheckupReportArea(null)}
      />
    </>
  );
}

export function checkAmplifyOutputs(amplifyConfig: CiAmplifyOutputs): boolean {
  if (amplifyConfig && amplifyConfig.Auth?.Cognito) {
    return true;
  }

  return false;
}
