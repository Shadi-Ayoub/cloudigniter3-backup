import { cache } from "react";

import {
  ciGetCookies,
  ciGetHeaders,
  ciGetTenantContext,
} from "@cloudigniter/next/server";
import { ciAwsGetCurrentUser } from "@cloudigniter/next/server";
import { ciNormalizeThrownError } from "@cloudigniter/core/lib";
import type { CiServerErrorPayload } from "@cloudigniter/next/types";
import type { CiAmplifyOutputs } from "@cloudigniter/aws/types";

// import { appBootstrap } from "@/kernel/server";
// import { ciGetSettings } from "@/kernel/api/server";
import { ciGetServerStatus } from "./ci-get-server-status";
import { appGetServerAllConfig } from "@/kernel/server";

////
import type { CiPageCoreConfig } from "@cloudigniter/core/types";
import type { CiSettings, CiSystemStatus } from "@cloudigniter/core/types";
import type { CiNextPageConfig } from "@cloudigniter/next/types";

import { ciPrepareConfig } from "./ci-prepare-config";

import outputs from "@/../amplify_outputs.json";

const amplifyOutputs = outputs as CiAmplifyOutputs;

export const appBootstrap = cache(async () => {
  try {
    const tenantContext = await ciGetTenantContext();
    const config = await appGetServerAllConfig();
    const user = await ciAwsGetCurrentUser(amplifyOutputs);

    const authMode = user.isAuthenticated
      ? ("userPool" as const)
      : config.data.publicAuthMode;

    // const settings = await ciGetSettings({
    //   authMode,
    //   tenantId: tenantContext.tenantId,
    //   userId: user.userId ?? undefined,
    //   include:
    //     authMode === "userPool" ? ["public", "private", "user"] : ["public"],
    //   userSettingIds: authMode === "userPool" ? ["notifications"] : [],
    // });

    const settings = {};

    const status = await ciGetServerStatus(settings, amplifyOutputs);
    const ciHeaders = await ciGetHeaders();
    const ciCookies = await ciGetCookies();

    // return await _ciBootstrap(config, settings, ciHeaders, ciCookies, status);

    let pageConfig: CiNextPageConfig;

    if (settings !== undefined && status !== undefined) {
      pageConfig = ciPrepareConfig(
        config,
        settings,
        ciHeaders,
        ciCookies,
        status,
      );
    } else {
      pageConfig = ciPrepareConfig(config);
    }

    return pageConfig;
  } catch (error) {
    const errorObj = ciNormalizeThrownError(error);

    if (errorObj.message === "NEXT_REDIRECT") {
      throw error;
    }

    throw new Error(
      JSON.stringify({
        title: "Bootstrapping CloudIgniter failed!",
        message: errorObj.message,
        severity: "critical",
        showRetry: true,
      } satisfies CiServerErrorPayload),
    );
  }
});
