import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import {
  ciAwsGetCurrentUser,
  ciGetRequestContext,
} from "@cloudigniter/next/server";
import outputs from "@/../amplify_outputs.json";
import { appSettingsManager } from "./app-settings-manager";

/** Request-cached and independent from appBootstrap/next-intl to avoid bootstrap recursion. */
export const appGetSettings = cache(async () => {
  const [requestContext, user, cookieStore] = await Promise.all([
    ciGetRequestContext(),
    ciAwsGetCurrentUser(outputs),
    cookies(),
  ]);
  const tenant = requestContext?.tenant;
  if (!tenant || (tenant.scope === "tenant" && !tenant.id))
    throw new Error("Settings require a resolved request tenant.");
  const manager = appSettingsManager(
    {
      id: user.userId,
      authenticated: user.isAuthenticated,
    },
    undefined,
    tenant.scope === "tenant"
      ? { scope: "tenant", tenantId: tenant.id! }
      : { scope: tenant.scope },
  );
  return manager.loadRequest(
    requestContext?.route?.settings,
    Object.fromEntries(
      cookieStore.getAll().map((cookie) => [cookie.name, cookie.value]),
    ),
  );
});
