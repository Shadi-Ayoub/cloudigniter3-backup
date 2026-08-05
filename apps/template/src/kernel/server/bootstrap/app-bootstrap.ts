import { cache } from "react";

import type { CiAmplifyOutputs } from "@cloudigniter/aws/types";
import {
  ciNormalizeThrownError,
  ciResolvePrimaryRole,
} from "@cloudigniter/core/lib";
import {
  ciAwsGetCurrentUser,
  ciGetCookies,
  ciGetEnvMode,
  ciGetHeaders,
  ciGetRequestContext,
} from "@cloudigniter/next/server";
import type { CiNextContext, CiNextStatus, CiServerErrorPayload } from "@cloudigniter/next/types";

import { appGetAllServerConfig, appGetSettings, ciIsAmplifyOutputsOk, ciIsSchemaOk } from "@/kernel/server";

export const appBootstrap = cache(async (): Promise<CiNextContext> => {
  try {
    /*
     * This runs after Proxy has created and forwarded the unified
     * CloudIgniter request-context header.
     *
     * appGetAllServerConfig() may therefore safely use getLocale()
     * and getMessages().
     */
    const config = await appGetAllServerConfig();

    /*
     * Read the complete context produced by Proxy:
     *
     * - schemaVersion
     * - tenant
     * - orgUnit
     * - featurePathname
     * - route
     */
    const requestContext = await ciGetRequestContext();

    if (!requestContext) {
      throw new Error("The CloudIgniter request context was not forwarded by Proxy.");
    }

    const amplifyOutputs = config.appCoreConfig.providers?.aws?.amplify?.amplifyOutputs as CiAmplifyOutputs;

    const [currentUser, settings, requestHeaders, requestCookies] = await Promise.all([
      ciAwsGetCurrentUser(amplifyOutputs),
      appGetSettings(),
      ciGetHeaders(),
      ciGetCookies(),
    ]);

    const roles = [...(currentUser.groups ?? [])];
    const auth: CiNextContext["auth"] = {
      mode: currentUser.isAuthenticated ? "userPool" : config.appCoreConfig.data.publicAuthMode,
      user: {
        id: currentUser.userId,
        authenticated: currentUser.isAuthenticated,
        roles,
        primaryRole: ciResolvePrimaryRole(roles),
        ...(currentUser.isAuthenticated
          ? {
              email: currentUser.email,
              emailVerified: currentUser.emailVerified,
              displayName: currentUser.displayName,
              username: currentUser.username,
              signInId: currentUser.signInId,
              authFlow: currentUser.authFlow,
              sessionExpiresAt: currentUser.sessionExpiresAt,
              accessToken: currentUser.accessToken,
              idToken: currentUser.idToken,
            }
          : {}),
      },
    };

    const envMode = ciGetEnvMode();

    if (!envMode) {
      throw new Error("Unable to resolve the application environment mode.");
    }

    const env: CiNextContext["env"] = {
      mode: envMode,
    };

    // TBD
    // const settings = await ciGetSettings({
    //   authMode: auth.mode,
    //   tenantId: requestContext.tenant?.id || undefined,
    //   userId: currentUser.userId ?? undefined,
    //   include:
    //     auth.mode === "userPool"
    //       ? ["public", "private", "user"]
    //       : ["public"],
    //   userSettingIds:
    //     auth.mode === "userPool" ? ["notifications"] : [],
    // });

    const status: CiNextStatus = {
      providers: {
        aws: {
          amplifyOutputs: {
            check: ciIsAmplifyOutputsOk(),
          },
          schema: {
            check: ciIsSchemaOk(),
          },
        },
      },
    };

    const context: CiNextContext = {
      /*
       * Includes tenant, orgUnit, featurePathname, route,
       * schemaVersion, and any future CiRequestContext fields.
       */
      ...requestContext,

      config,
      settings,
      auth,
      env,
      headers: requestHeaders,
      cookies: requestCookies,
      status,
    };

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
