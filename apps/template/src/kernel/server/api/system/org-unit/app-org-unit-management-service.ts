import "server-only";

import { ciParseGraphqlResponse } from "@cloudigniter/core/lib";
import type {
  CiCreateOrgUnitInput,
  CiListOrgUnitsInput,
  CiListOrgUnitsResult,
  CiOrgUnitManagementRow,
  CiOrgUnitMutationResult,
  CiUpdateOrgUnitInput,
} from "@cloudigniter/core/types";
import { appPrepareServerApiRequest } from "../../app-prepare-server-api-request";
import { appServerClient } from "../../app-server-client";

function inputString<T>(input: T): string {
  return JSON.stringify(appPrepareServerApiRequest({ input }));
}

function requireOk<T>(response: ReturnType<typeof ciParseGraphqlResponse>): T {
  if (!response.ok) {
    const body = response.body as { error?: unknown; details?: { message?: unknown } };
    throw new Error(
      typeof body.details?.message === "string"
        ? body.details.message
        : typeof body.error === "string"
          ? body.error
          : "Org Unit request failed.",
    );
  }
  return response.body as T;
}

export async function appListOrgUnitRecords(
  input: CiListOrgUnitsInput,
): Promise<CiListOrgUnitsResult> {
  const response = await appServerClient.queries.ListOrgUnits(
    { inputString: inputString(input) },
    { authMode: "userPool" },
  );
  return requireOk<CiListOrgUnitsResult>(ciParseGraphqlResponse(response, true));
}

export async function appCreateOrgUnitRecord(
  input: CiCreateOrgUnitInput,
): Promise<CiOrgUnitManagementRow> {
  const response = await appServerClient.mutations.CreateOrgUnit(
    { inputString: inputString(input) },
    { authMode: "userPool" },
  );
  return requireOk<CiOrgUnitMutationResult>(
    ciParseGraphqlResponse(response, true),
  ).orgUnit;
}

export async function appUpdateOrgUnitRecord(
  input: CiUpdateOrgUnitInput,
): Promise<CiOrgUnitManagementRow> {
  const response = await appServerClient.mutations.UpdateOrgUnit(
    { inputString: inputString(input) },
    { authMode: "userPool" },
  );
  const orgUnit = requireOk<CiOrgUnitMutationResult>(
    ciParseGraphqlResponse(response, true),
  ).orgUnit;
  if (input.parentId !== undefined) {
    const requestedParentId = input.parentId?.trim() || null;
    if (orgUnit.parentId !== requestedParentId) {
      throw new Error(
        "The deployed Org Unit backend did not persist the requested parent. Deploy the current sandbox backend and try the move again.",
      );
    }
  }
  return orgUnit;
}
