"use client";

import type { CiNextContext } from "@cloudigniter/next/types";
import { CiDevBeaconProvidersStatusRow } from "./CiDevBeaconProvidersStatusRow";
import { CiDevBeaconCardRow } from "@ci-next/modules/dev/dev-beacon/client/components";

export interface CiDevBeaconProvidersStatusProps {
  context: CiNextContext;
}

export function CiDevBeaconProvidersStatusSegment({ context }: CiDevBeaconProvidersStatusProps) {
  const providers = context.config.appCoreConfig.providers ?? [];
  const isUsingAwsProvider = context.config.appCoreConfig.providers?.aws;

  const awsProviderStatusAmplifyOutputsOk = context.status?.providers?.aws?.amplifyOutputs?.check === true;

  const awsProviderStatusSchemasOk = context.status?.providers?.aws?.schema?.check === true;
  return (
    <>
      <CiDevBeaconProvidersStatusRow providers={providers} />

      {isUsingAwsProvider ? (
        <>
          <CiDevBeaconCardRow
            label="Amplify Outputs"
            value={awsProviderStatusAmplifyOutputsOk ? "OK" : "CHECK!"}
            valueClassName={
              awsProviderStatusAmplifyOutputsOk
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
            }
          />

          <CiDevBeaconCardRow
            label="Data Schema"
            value={awsProviderStatusSchemasOk ? "OK" : "CHECK!"}
            valueClassName={
              awsProviderStatusSchemasOk
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
            }
          />
        </>
      ) : null}
    </>
  );
}
