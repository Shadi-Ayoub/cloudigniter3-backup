"use client";

import { TooltipProvider } from "@cloudigniter/ui/client";
import type { CiNextContext } from "@ci-next/types";

import {
  CiDevBeaconCardRowSeparator,
  CiDevBeaconCardTitle,
  CiDevBeaconCardRow,
} from "@ci-next/modules/dev/dev-beacon/client/components";
import {
  CiDevBeaconAuthenticationStatusSegment,
  CiDevBeaconProvidersStatusSegment,
  CiDevBeaconResolutionCheckupSegment,
} from "./components";

export interface CiGeneralStatusCardProps {
  context: CiNextContext;
}

export function CiDevBeaconGeneralDiagnisticsCard({ context }: CiGeneralStatusCardProps) {
  const appCoreConfig = context.config.appCoreConfig;

  const platform = appCoreConfig.app?.platform ?? "UNKNOWN!";
  const platformVersion = appCoreConfig.app?.version ?? "UNKNOWN!";
  const isNextJs = platform === "Next.js";

  const currentUser = context.auth?.user;

  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={100}>
      <section className="bg-card rounded-lg border p-4 shadow-sm">
        <CiDevBeaconCardTitle
          className="mb-3"
          title="General Diagnostics"
          description="Platform, provider, authentication, and request-resolution status."
          tooltip={
            <>
              Shows the resolved application platform, configured providers, current authentication state, and tenant
              and organizational-unit resolution diagnostics. Select a resolution result to inspect its detailed report.
            </>
          }
          tooltipAriaLabel="About general details and diagnostics"
        />

        <div className="space-y-2">
          <CiDevBeaconCardRow
            label="Platform Name"
            value={platform}
            url={context.config.appCoreConfig.app?.url}
            tooltip="The application framework or platform detected from the resolved CloudIgniter configuration."
          />

          {isNextJs ? (
            <>
              <CiDevBeaconCardRow
                label="Platform Version"
                value={platformVersion}
                url={context.config.appCoreConfig.app?.github}
                tooltip={<>The installed platform version currently used by the CloudIgniter application template.</>}
              />

              <CiDevBeaconCardRow label="Platform Runtime" value="App Router" />
            </>
          ) : null}

          <CiDevBeaconCardRowSeparator />

          <CiDevBeaconProvidersStatusSegment context={context} />

          <CiDevBeaconCardRowSeparator />

          <CiDevBeaconAuthenticationStatusSegment currentUser={currentUser} />

          <CiDevBeaconCardRowSeparator />

          <CiDevBeaconResolutionCheckupSegment />
        </div>
      </section>
    </TooltipProvider>
  );
}

// "use client";

// import { useEffect, useState } from "react";
// import type { CiDevTenantResolutionCheckup } from "@cloudigniter/core/types";
// import { CiDevBeaconCardRowSeparator, CiDevBeaconStatusCard, CiDevBeaconCardRow } from "../../components";
// import type { CiNextContext } from "@ci-next/types";
// import { TooltipProvider } from "@cloudigniter/ui/client";
// import { CiDevBeaconProvidersStatusRow, CiDevBeaconResolutionCheckupModal } from "./components";
// import { ciGetTenantResolutionCheckup } from "./helpers";
// import type { CiDevResolutionCheckArea } from "./types";

// interface CiDevBeaconGeneralStatusCardProps {
//   context: CiNextContext;
// }
// export function CiDevBeaconGeneralStatusCard({ context }: CiDevBeaconGeneralStatusCardProps) {
//   let cachedTenantResolutionCheckup: CiDevTenantResolutionCheckup | null = null;

//   const [checkupError, setCheckupError] = useState<string | null>(null);

//   const [checkupReportArea, setCheckupReportArea] = useState<CiDevResolutionCheckArea | null>(null);

//   const [checkup, setCheckup] = useState<CiDevTenantResolutionCheckup | null>(cachedTenantResolutionCheckup);

//   useEffect(() => {
//     let isActive = true;

//     setCheckupError(null);

//     void ciGetTenantResolutionCheckup()
//       .then((result) => {
//         if (!isActive) {
//           return;
//         }

//         setCheckup(result);
//         setCheckupError(null);
//       })
//       .catch((error: unknown) => {
//         if (!isActive) {
//           return;
//         }

//         console.error("Tenant resolution checkup failed:", error);

//         setCheckupError(error instanceof Error ? error.message : "Tenant resolution checkup failed.");
//       });

//     return () => {
//       isActive = false;
//     };
//   }, []);

//   const platform = context.config.appCoreConfig.app?.platform ?? "UNKNOWN!";
//   const platformVersion = context.config.appCoreConfig.app?.version ?? "UNKNOWN!";
//   const isNextJs = platform == "Next.js";
//   // const providers = Object.keys(context.config.appCoreConfig.providers ?? []);
//   const providers = context.config.appCoreConfig.providers ?? [];
//   const IsUsingAwsProvider = context.config.appCoreConfig.providers?.aws;

//   const awsProviderStatusAmplifyOutputsOk = IsUsingAwsProvider
//     ? context.status?.providers?.aws?.amplifyOutputs?.check
//     : false;

//   const awsProviderStatusSchemasOk = IsUsingAwsProvider ? context.status?.providers?.aws?.schema?.check : false;

//   const user = {
//     id: context.auth.user.id as string,
//     authenticated: context.auth.user.authenticated,
//     roles: context.auth.user.roles,
//   };

//   return (
//     <TooltipProvider delayDuration={300} skipDelayDuration={100}>
//       <CiDevBeaconStatusCard title="General Details & Diagnostics">
//         <CiDevBeaconCardRow
//           label="Platform Name"
//           value={platform}
//           tooltip="The application framework or platform detected from the resolved CloudIgniter configuration."
//         />

//         {isNextJs && (
//           <>
//             <CiDevBeaconCardRow label="Platform Version" value={platformVersion} />
//             <CiDevBeaconCardRow label="Platform Runtime" value="App Router" />
//           </>
//         )}

//         <CiDevBeaconCardRowSeparator />

//         <CiDevBeaconProvidersStatusRow providers={providers} />

//         {IsUsingAwsProvider && (
//           <>
//             <CiDevBeaconCardRow
//               label="Amplify Outputs"
//               value={awsProviderStatusAmplifyOutputsOk ? `OK` : `CHECK!`}
//               valueClassName={
//                 awsProviderStatusAmplifyOutputsOk
//                   ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
//                   : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
//               }
//             />

//             <CiDevBeaconCardRow
//               label="Data Schema"
//               value={awsProviderStatusSchemasOk ? `OK` : `CHECK!`}
//               valueClassName={
//                 awsProviderStatusSchemasOk
//                   ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
//                   : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
//               }
//             />
//           </>
//         )}

//         <CiDevBeaconCardRowSeparator />

//         <CiDevBeaconCardRow label="Current User ID" value={user.id ?? "—"} />
//         <CiDevBeaconCardRow
//           label="Is Authenticated"
//           value={user.authenticated ? `YES` : `NO`}
//           valueClassName={
//             user.authenticated
//               ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
//               : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
//           }
//         />
//         <CiDevBeaconCardRow label="Current User Roles" value={user.roles.length == 0 ? "—" : user.roles} />

//         <CiDevBeaconCardRowSeparator />

//         <CiDevBeaconCardRow
//           label="Tenant Resolution"
//           value={
//             checkupError ? `Failed` : checkup ? `Passed ${checkup.tenant.passed}/${checkup.tenant.total}` : "Checking…"
//           }
//           valueClassName={
//             checkupError || (checkup && checkup.tenant.failed > 0)
//               ? "bg-red-500/10 text-red-700 dark:text-red-400"
//               : checkup
//               ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
//               : "bg-muted text-muted-foreground"
//           }
//           onClick={checkup ? () => setCheckupReportArea("tenant") : undefined}
//           clickTitle="Open Tenant Resolution report"
//         />

//         <CiDevBeaconCardRow
//           label="Org Unit Resolution"
//           value={
//             checkupError
//               ? "Failed"
//               : checkup
//               ? `Passed ${checkup.orgUnit.passed}/${checkup.orgUnit.total}`
//               : "Checking…"
//           }
//           valueClassName={
//             checkupError || (checkup && checkup.orgUnit.failed > 0)
//               ? "bg-red-500/10 text-red-700 dark:text-red-400"
//               : checkup
//               ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
//               : "bg-muted text-muted-foreground"
//           }
//           onClick={checkup ? () => setCheckupReportArea("orgUnit") : undefined}
//           clickTitle="Open Org Unit Resolution report"
//         />
//       </CiDevBeaconStatusCard>
//       <CiDevBeaconResolutionCheckupModal
//         area={checkupReportArea}
//         checkup={checkup}
//         onClose={() => setCheckupReportArea(null)}
//       />
//     </TooltipProvider>
//   );
// }
