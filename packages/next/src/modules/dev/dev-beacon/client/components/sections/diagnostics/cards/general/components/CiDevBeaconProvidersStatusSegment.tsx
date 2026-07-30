"use client";

import type { CiNextContext } from "@cloudigniter/next/types";

import { CiDevBeaconCardRow } from "@ci-next/modules/dev/dev-beacon/client/components";

import { CiDevBeaconAmplifyOutputsStatusRow } from "./CiDevBeaconAmplifyOutputsStatusRow";
import { CiDevBeaconProvidersStatusRow } from "./CiDevBeaconProvidersStatusRow";

export interface CiDevBeaconProvidersStatusProps {
  context: CiNextContext;
}

export function CiDevBeaconProvidersStatusSegment({ context }: CiDevBeaconProvidersStatusProps) {
  const providers = context.config.appCoreConfig.providers ?? [];
  const awsProvider = context.config.appCoreConfig.providers?.aws;

  const awsProviderStatusAmplifyOutputsOk = context.status?.providers?.aws?.amplifyOutputs?.check === true;

  const awsProviderStatusSchemasOk = context.status?.providers?.aws?.schema?.check === true;

  const amplifyOutputs = awsProvider?.amplify?.amplifyOutputs;

  return (
    <>
      <CiDevBeaconProvidersStatusRow providers={providers} />

      {awsProvider ? (
        <>
          <CiDevBeaconAmplifyOutputsStatusRow
            amplifyOutputs={amplifyOutputs}
            isOk={awsProviderStatusAmplifyOutputsOk}
          />

          <CiDevBeaconCardRow
            label="Data Schema"
            value={awsProviderStatusSchemasOk ? "OK" : "CHECK!"}
            valueClassName={
              awsProviderStatusSchemasOk
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
            }
            tooltip={<>Indicates whether the application's data schema was loaded and resolved successfully.</>}
          />
        </>
      ) : null}
    </>
  );
}
