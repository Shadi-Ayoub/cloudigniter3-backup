import { randomUUID } from "node:crypto";
import { ciCreateLambdaHandler } from "@ci-aws/lib";
import {
  ciCleanupSeededTenants,
  ciDeleteTenant,
  ciListTenants,
  ciPurgeTenant,
  ciRestoreTenant,
  ciSeedTenants,
  ciSetTenantStatus,
  type CiDeleteTenantServiceInput,
  type CiPurgeTenantServiceInput,
  type CiRestoreTenantServiceInput,
  type CiSeedTenantsServiceInput,
  type CiSetTenantStatusServiceInput,
} from "../../../../lib/tenant";
import type { CiAppSyncResolverEvent } from "@ci-aws/types";
import type {
  CiCleanupSeededTenantsInput,
  CiDeleteTenantInput,
  CiListTenantsInput,
  CiPurgeTenantInput,
  CiRestoreTenantInput,
  CiSeedTenantsInput,
  CiSetTenantStatusInput,
} from "@cloudigniter/core/types";
import { CI_ENV } from "../../env/env.keys";

const TENANT_ENV = [CI_ENV.CI_SYSTEM_TABLE_NAME] as const;

function getClaims(event: CiAppSyncResolverEvent): Record<string, unknown> {
  return (
    (event.identity as { claims?: Record<string, unknown> } | null)?.claims ??
    {}
  );
}

function getGroups(event: CiAppSyncResolverEvent): string[] {
  const value = getClaims(event)["cognito:groups"];
  if (Array.isArray(value))
    return value.filter((item): item is string => typeof item === "string");
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed))
      return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    // Cognito may serialize this claim as a comma-separated string.
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function assertTenantAdministrator(event: CiAppSyncResolverEvent): void {
  const groups = getGroups(event);
  if (
    !groups.includes("system-admin") &&
    !groups.includes("system-super-admin")
  ) {
    throw new Error(
      "Tenant lifecycle operations require system administrator privileges.",
    );
  }
}

function assertDeveloperInDevelopment(
  event: CiAppSyncResolverEvent,
  envMode: string,
): void {
  if (envMode !== "development" || !getGroups(event).includes("developer")) {
    throw new Error(
      "Seeder operations require an authenticated developer in development mode.",
    );
  }
}

function assertTenantReader(
  event: CiAppSyncResolverEvent,
  envMode: string,
): void {
  const groups = getGroups(event);
  if (
    groups.includes("system-admin") ||
    groups.includes("system-super-admin") ||
    (envMode === "development" && groups.includes("developer"))
  ) {
    return;
  }
  throw new Error(
    "Tenant reads require system administrator privileges or development-mode developer access.",
  );
}

function getActorId(event: CiAppSyncResolverEvent): string {
  const claims = getClaims(event);
  const actorId = claims.sub ?? claims.username ?? claims["cognito:username"];
  if (typeof actorId !== "string" || !actorId.trim()) {
    throw new Error("The authenticated actor could not be resolved.");
  }
  return actorId;
}

function lifecycleContext(event: CiAppSyncResolverEvent) {
  assertTenantAdministrator(event);
  return {
    actorId: getActorId(event),
    operationId: randomUUID(),
    now: new Date().toISOString(),
  };
}

export const ciListTenantsHandler = ciCreateLambdaHandler<
  CiListTenantsInput,
  typeof TENANT_ENV
>({
  handlerName: "CI_LIST_TENANTS_HANDLER",
  ciEnvVars: TENANT_ENV,
  validate: ({ event, env }) => assertTenantReader(event, env.CI_ENV_MODE),
  run: ({ input, env, clientConfig }) =>
    ciListTenants({
      tableName: env.CI_SYSTEM_TABLE,
      clientConfig,
      input,
    }),
});

export const ciSeedTenantsHandler = ciCreateLambdaHandler<
  CiSeedTenantsInput,
  typeof TENANT_ENV,
  CiSeedTenantsServiceInput
>({
  handlerName: "CI_SEED_TENANTS_HANDLER",
  ciEnvVars: TENANT_ENV,
  transformInput: ({ input, event, env }) => {
    assertDeveloperInDevelopment(event, env.CI_ENV_MODE);
    return {
      ...input,
      actorId: getActorId(event),
      now: new Date().toISOString(),
    };
  },
  run: ({ input, env, clientConfig }) =>
    ciSeedTenants({ tableName: env.CI_SYSTEM_TABLE, clientConfig, input }),
});

export const ciCleanupSeededTenantsHandler = ciCreateLambdaHandler<
  CiCleanupSeededTenantsInput,
  typeof TENANT_ENV
>({
  handlerName: "CI_CLEANUP_SEEDED_TENANTS_HANDLER",
  ciEnvVars: TENANT_ENV,
  validate: ({ event, env }) =>
    assertDeveloperInDevelopment(event, env.CI_ENV_MODE),
  run: ({ input, env, clientConfig }) =>
    ciCleanupSeededTenants({
      tableName: env.CI_SYSTEM_TABLE,
      clientConfig,
      input,
    }),
});

export const ciDeleteTenantHandler = ciCreateLambdaHandler<
  CiDeleteTenantInput,
  typeof TENANT_ENV,
  CiDeleteTenantServiceInput
>({
  handlerName: "CI_DELETE_TENANT_HANDLER",
  ciEnvVars: TENANT_ENV,
  transformInput: ({ input, event }) => ({
    ...input,
    ...lifecycleContext(event),
  }),
  run: ({ input, env, clientConfig }) =>
    ciDeleteTenant({ tableName: env.CI_SYSTEM_TABLE, clientConfig, input }),
});

export const ciRestoreTenantHandler = ciCreateLambdaHandler<
  CiRestoreTenantInput,
  typeof TENANT_ENV,
  CiRestoreTenantServiceInput
>({
  handlerName: "CI_RESTORE_TENANT_HANDLER",
  ciEnvVars: TENANT_ENV,
  transformInput: ({ input, event }) => ({
    ...input,
    ...lifecycleContext(event),
  }),
  run: ({ input, env, clientConfig }) =>
    ciRestoreTenant({ tableName: env.CI_SYSTEM_TABLE, clientConfig, input }),
});

export const ciPurgeTenantHandler = ciCreateLambdaHandler<
  CiPurgeTenantInput,
  typeof TENANT_ENV,
  CiPurgeTenantServiceInput
>({
  handlerName: "CI_PURGE_TENANT_HANDLER",
  ciEnvVars: TENANT_ENV,
  transformInput: ({ input, event }) => ({
    ...input,
    ...lifecycleContext(event),
  }),
  run: ({ input, env, clientConfig }) =>
    ciPurgeTenant({ tableName: env.CI_SYSTEM_TABLE, clientConfig, input }),
});

export const ciSetTenantStatusHandler = ciCreateLambdaHandler<
  CiSetTenantStatusInput,
  typeof TENANT_ENV,
  CiSetTenantStatusServiceInput
>({
  handlerName: "CI_SET_TENANT_STATUS_HANDLER",
  ciEnvVars: TENANT_ENV,
  transformInput: ({ input, event }) => {
    const context = lifecycleContext(event);
    return {
      ...input,
      actorId: context.actorId,
      now: context.now,
    };
  },
  run: ({ input, env, clientConfig }) =>
    ciSetTenantStatus({
      tableName: env.CI_SYSTEM_TABLE,
      clientConfig,
      input,
    }),
});
