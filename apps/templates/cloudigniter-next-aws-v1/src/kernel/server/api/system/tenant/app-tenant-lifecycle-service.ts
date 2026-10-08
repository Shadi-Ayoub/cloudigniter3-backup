import "server-only";

import { ciParseGraphqlResponse } from "@cloudigniter/core/lib";
import type {
  CiDeleteTenantInput,
  CiListTenantsInput,
  CiListTenantsResult,
  CiPurgeTenantInput,
  CiRestoreTenantInput,
  CiSetTenantStatusInput,
  CiTenantHtmlTableRow,
  CiTenantLifecycleResult,
} from "@cloudigniter/core/types";
import { appPrepareServerApiRequest } from "../../app-prepare-server-api-request";
import { appServerClient } from "../../app-server-client";

type TenantOperationKind = "queries" | "mutations";

function requireTenantOperation<
  TOperation extends (...args: never[]) => unknown,
>(kind: TenantOperationKind, name: string): TOperation {
  const operations = appServerClient[kind] as Record<string, unknown>;
  const operation = operations[name];

  if (typeof operation !== "function") {
    const available = Object.keys(operations).sort().join(", ") || "none";
    throw new Error(
      `The deployed Amplify backend does not expose ${kind}.${name}. Restart or deploy the template sandbox so schema-tenant.ts is applied and amplify_outputs.json is regenerated. Available ${kind}: ${available}.`,
    );
  }

  return operation.bind(operations) as TOperation;
}

function requireOk<T>(response: ReturnType<typeof ciParseGraphqlResponse>): T {
  if (!response.ok) {
    const body = response.body as { error?: unknown };
    throw new Error(
      typeof body.error === "string"
        ? body.error
        : "Tenant lifecycle request failed.",
    );
  }
  return response.body as T;
}

function inputString<T>(input: T): string {
  return JSON.stringify(appPrepareServerApiRequest({ input }));
}

export async function appListTenantRecords(
  input: CiListTenantsInput,
): Promise<CiListTenantsResult> {
  const listTenants = requireTenantOperation<
    typeof appServerClient.queries.ListTenants
  >("queries", "ListTenants");
  const response = await listTenants(
    { inputString: inputString(input) },
    { authMode: "userPool" },
  );
  return requireOk<CiListTenantsResult>(ciParseGraphqlResponse(response, true));
}

export async function appDeleteTenantRecord(
  input: CiDeleteTenantInput,
): Promise<CiTenantHtmlTableRow> {
  const deleteTenant = requireTenantOperation<
    typeof appServerClient.mutations.DeleteTenant
  >("mutations", "DeleteTenant");
  const response = await deleteTenant(
    { inputString: inputString(input) },
    { authMode: "userPool" },
  );
  return requireOk<CiTenantLifecycleResult>(
    ciParseGraphqlResponse(response, true),
  ).tenant;
}

export async function appRestoreTenantRecord(
  input: CiRestoreTenantInput,
): Promise<CiTenantHtmlTableRow> {
  const restoreTenant = requireTenantOperation<
    typeof appServerClient.mutations.RestoreTenant
  >("mutations", "RestoreTenant");
  const response = await restoreTenant(
    { inputString: inputString(input) },
    { authMode: "userPool" },
  );
  return requireOk<CiTenantLifecycleResult>(
    ciParseGraphqlResponse(response, true),
  ).tenant;
}

export async function appPurgeTenantRecord(
  input: CiPurgeTenantInput,
): Promise<void> {
  const purgeTenant = requireTenantOperation<
    typeof appServerClient.mutations.PurgeTenant
  >("mutations", "PurgeTenant");
  const response = await purgeTenant(
    { inputString: inputString(input) },
    { authMode: "userPool" },
  );
  requireOk(ciParseGraphqlResponse(response, true));
}

export async function appSetTenantStatus(
  input: CiSetTenantStatusInput,
): Promise<CiTenantHtmlTableRow> {
  const setTenantStatus = requireTenantOperation<
    typeof appServerClient.mutations.SetTenantStatus
  >("mutations", "SetTenantStatus");
  const response = await setTenantStatus(
    { inputString: inputString(input) },
    { authMode: "userPool" },
  );
  return requireOk<CiTenantLifecycleResult>(
    ciParseGraphqlResponse(response, true),
  ).tenant;
}
