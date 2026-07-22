import { cache } from "react";
import { headers, cookies } from "next/headers";
import { ciReadTenantFromHeaders } from "@cloudigniter/core/server";

import { ciNormalizeThrownError } from "@cloudigniter/core/lib";
import {
  ciAwsGetCurrentUser,
  ciGetCookies,
  ciGetEnvMode,
  ciGetHeaders,
  ciGetTenantContext,
} from "@cloudigniter/next/server";
import type {
  CiNextContext,
  CiServerErrorPayload,
} from "@cloudigniter/next/types";
import type { CiAmplifyOutputs } from "@cloudigniter/aws/types";
import { appGetAllServerConfig } from "@/kernel/server";
import { appGetSettings } from "@/kernel/server";

export const appBootstrap = cache(async () => {
  try {
    const tenantContext = await ciGetTenantContext();
    const config = await appGetAllServerConfig();

    const amplifyOutputs = config.appCoreConfig.providers?.aws?.amplify
      ?.amplifyOutputs as CiAmplifyOutputs;

    const user = await ciAwsGetCurrentUser(amplifyOutputs);

    const authMode = user.isAuthenticated
      ? ("userPool" as const)
      : config.appCoreConfig.data.publicAuthMode;

    const auth = {
      mode: authMode,
      user: {
        id: user.userId,
        authenticated: true,
        roles: ["DEVELOPER"],
      },
    };

    const envMode = ciGetEnvMode();

    const env = {
      mode: envMode,
    };

    // TBD
    // const settings = await ciGetSettings({
    //   authMode,
    //   tenantId: tenantContext.tenantId,
    //   userId: user.userId ?? undefined,
    //   include:
    //     authMode === "userPool" ? ["public", "private", "user"] : ["public"],
    //   userSettingIds: authMode === "userPool" ? ["notifications"] : [],
    // });

    const settings = await appGetSettings();
    const ciHeaders = await ciGetHeaders();
    const ciCookies = await ciGetCookies();

    const hds = await headers();
    const cks = await cookies();
    const tenant = ciReadTenantFromHeaders(hds, cks);

    const context = {
      config,
      settings,
      auth,
      env,
      tenant,
      ciHeaders,
      ciCookies,
    } as CiNextContext;

    return context;
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
