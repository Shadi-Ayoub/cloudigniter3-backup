import "server-only";

import { ciParseGraphqlResponse } from "@cloudigniter/core/lib";
import { ciReadJsonSeederData } from "@cloudigniter/core/server";
import type {
  CiCleanupSeededTenantsInput,
  CiOrgUnitSeederDataItem,
  CiSeedTenantsInput,
  CiSeederDefinition,
  CiTenantSeederDataItem,
  CiTenantSeederExecutionResult,
} from "@cloudigniter/core/types";
import { appPrepareServerApiRequest } from "../../app-prepare-server-api-request";
import { appServerClient } from "../../app-server-client";

function requireOk(response: ReturnType<typeof ciParseGraphqlResponse>) {
  if (!response.ok) {
    const body = response.body as { error?: unknown };
    throw new Error(
      typeof body.error === "string" ? body.error : "Tenant seeder request failed.",
    );
  }
  return response.body as CiTenantSeederExecutionResult;
}

function inputString<T>(input: T): string {
  return JSON.stringify(appPrepareServerApiRequest({ input }));
}

function validateTenantFixture(value: unknown): CiTenantSeederDataItem {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Each tenant seeder item must be a JSON object.");
  }
  const item = value as Record<string, unknown>;
  for (const key of ["tenantId", "name", "slug"] as const) {
    if (typeof item[key] !== "string" || !item[key].trim()) {
      throw new Error(`Tenant seeder field "${key}" must be a non-empty string.`);
    }
  }
  const status = item.status;
  if (
    status !== undefined &&
    status !== "active" &&
    status !== "suspended" &&
    status !== "archived"
  ) {
    throw new Error(`Tenant "${String(item.tenantId)}" has an invalid status.`);
  }
  if (item.orgUnits !== undefined) {
    if (!Array.isArray(item.orgUnits)) {
      throw new Error(`Tenant "${String(item.tenantId)}" Org Units must be an array.`);
    }
    item.orgUnits = item.orgUnits.map(validateOrgUnitFixture);
  }
  return item as CiTenantSeederDataItem;
}

function validateOrgUnitFixture(value: unknown): CiOrgUnitSeederDataItem {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Each Org Unit seeder item must be a JSON object.");
  }
  const item = value as Record<string, unknown>;
  for (const key of ["orgUnitId", "name", "slug"] as const) {
    if (typeof item[key] !== "string" || !item[key].trim()) {
      throw new Error(`Org Unit seeder field "${key}" must be a non-empty string.`);
    }
  }
  if (
    !Array.isArray(item.tenantIds) ||
    item.tenantIds.length === 0 ||
    item.tenantIds.some((tenantId) => typeof tenantId !== "string" || !tenantId.trim())
  ) {
    throw new Error(`Org Unit "${String(item.orgUnitId)}" requires tenantIds.`);
  }
  if (
    item.status !== undefined &&
    item.status !== "active" &&
    item.status !== "suspended" &&
    item.status !== "archived"
  ) {
    throw new Error(`Org Unit "${String(item.orgUnitId)}" has an invalid status.`);
  }
  return item as CiOrgUnitSeederDataItem;
}

export async function appRunTenantSeeder(
  definition: CiSeederDefinition,
  operation: "seed" | "cleanup",
): Promise<CiTenantSeederExecutionResult> {
  if (
    definition.createApi !== "SeedTenants" ||
    definition.cleanupApi !== "CleanupSeededTenants"
  ) {
    throw new Error(
      `Seeder "${definition.id}" references an unsupported tenant API operation.`,
    );
  }
  if (operation === "seed") {
    const fixtures = (
      await ciReadJsonSeederData({ definition })
    ).map(validateTenantFixture);
    const input: CiSeedTenantsInput = {
      seederId: definition.id,
      items: fixtures,
    };
    const response = await appServerClient.mutations.SeedTenants(
      { inputString: inputString(input) },
      { authMode: "userPool" },
    );
    return requireOk(ciParseGraphqlResponse(response, true));
  }

  const input: CiCleanupSeededTenantsInput = {
    seederId: definition.id,
  };
  const response = await appServerClient.mutations.CleanupSeededTenants(
    { inputString: inputString(input) },
    { authMode: "userPool" },
  );
  return requireOk(ciParseGraphqlResponse(response, true));
}
