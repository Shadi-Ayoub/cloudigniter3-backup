import { ciCreateLambdaHandler } from "@ci-aws/lib";
import type { CiAppSyncResolverEvent } from "@ci-aws/types";
import type {
  CiCreateOrgUnitInput,
  CiGetOrgUnitByPathInterface,
  CiListOrgUnitsInput,
  CiUpdateOrgUnitInput,
} from "@cloudigniter/core/types";
import {
  ciCreateOrgUnit,
  ciGetOrgUnitByPath,
  ciListOrgUnits,
  ciUpdateOrgUnit,
  type CiCreateOrgUnitServiceInput,
  type CiUpdateOrgUnitServiceInput,
} from "../../../../lib/org-unit";
import { CI_ENV } from "../../env/env.keys";

const ORG_UNIT_ENV = [CI_ENV.CI_SYSTEM_TABLE_NAME] as const;

function claims(event: CiAppSyncResolverEvent): Record<string, unknown> {
  return (
    (event.identity as { claims?: Record<string, unknown> } | null)?.claims ?? {}
  );
}

function groups(event: CiAppSyncResolverEvent): string[] {
  const value = claims(event)["cognito:groups"];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
  } catch {
    // Cognito can serialize groups as comma-separated text.
  }
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function assertOrgUnitAdministrator(event: CiAppSyncResolverEvent): void {
  const actorGroups = groups(event);
  if (
    !actorGroups.includes("system-admin") &&
    !actorGroups.includes("system-super-admin")
  ) {
    throw new Error("Org Unit management requires system administrator privileges.");
  }
}

function actorId(event: CiAppSyncResolverEvent): string {
  const actorClaims = claims(event);
  const value =
    actorClaims.sub ?? actorClaims.username ?? actorClaims["cognito:username"];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("The authenticated actor could not be resolved.");
  }
  return value;
}

export const ciListOrgUnitsHandler = ciCreateLambdaHandler<
  CiListOrgUnitsInput,
  typeof ORG_UNIT_ENV
>({
  handlerName: "CI_LIST_ORG_UNITS_HANDLER",
  ciEnvVars: ORG_UNIT_ENV,
  validate: ({ event }) => assertOrgUnitAdministrator(event),
  run: ({ input, env, clientConfig }) =>
    ciListOrgUnits({ tableName: env.CI_SYSTEM_TABLE, clientConfig, input }),
});

export const ciCreateOrgUnitHandler = ciCreateLambdaHandler<
  CiCreateOrgUnitInput,
  typeof ORG_UNIT_ENV,
  CiCreateOrgUnitServiceInput
>({
  handlerName: "CI_CREATE_ORG_UNIT_HANDLER",
  ciEnvVars: ORG_UNIT_ENV,
  transformInput: ({ input, event }) => {
    assertOrgUnitAdministrator(event);
    return { ...input, actorId: actorId(event), now: new Date().toISOString() };
  },
  run: ({ input, env, clientConfig }) =>
    ciCreateOrgUnit({ tableName: env.CI_SYSTEM_TABLE, clientConfig, input }),
});

export const ciUpdateOrgUnitHandler = ciCreateLambdaHandler<
  CiUpdateOrgUnitInput,
  typeof ORG_UNIT_ENV,
  CiUpdateOrgUnitServiceInput
>({
  handlerName: "CI_UPDATE_ORG_UNIT_HANDLER",
  ciEnvVars: ORG_UNIT_ENV,
  transformInput: ({ input, event }) => {
    assertOrgUnitAdministrator(event);
    return { ...input, actorId: actorId(event), now: new Date().toISOString() };
  },
  run: ({ input, env, clientConfig }) =>
    ciUpdateOrgUnit({ tableName: env.CI_SYSTEM_TABLE, clientConfig, input }),
});

/** Minimal public routing lookup; it returns no management or tenant inventory. */
export const ciGetOrgUnitByPathHandler = ciCreateLambdaHandler<
  CiGetOrgUnitByPathInterface,
  typeof ORG_UNIT_ENV
>({
  handlerName: "CI_GET_ORG_UNIT_BY_PATH_HANDLER",
  ciEnvVars: ORG_UNIT_ENV,
  run: ({ input, env, clientConfig }) =>
    ciGetOrgUnitByPath({ tableName: env.CI_SYSTEM_TABLE, clientConfig, input }),
});
