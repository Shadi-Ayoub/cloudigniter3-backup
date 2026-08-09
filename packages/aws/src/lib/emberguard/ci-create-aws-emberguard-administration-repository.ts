import type {
  CiAccessControlDefinition,
  CiSecurityAdministrationRepository,
  CiSecurityStoredRoleAssignment,
} from "@cloudigniter/emberguard/types";
import { ciAssertValidAccessControlDefinition } from "@cloudigniter/emberguard/lib";
import type { CiAwsEmberguardGraphqlOperations } from "../../types";

/** Returns true when a value is a non-null object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Checks the structural root of an access-control definition. */
function isAccessControlDefinition(
  value: unknown
): value is CiAccessControlDefinition {
  return (
    isRecord(value) &&
    Array.isArray(value.domains) &&
    Array.isArray(value.resources) &&
    Array.isArray(value.roles)
  );
}

/** Checks a provider assignment scope before exposing it to generic code. */
function isAssignmentScope(value: unknown): boolean {
  if (!isRecord(value) || typeof value.kind !== "string") {
    return false;
  }
  if (value.kind === "system" || value.kind === "global") {
    return true;
  }
  if (value.kind === "tenant") {
    return typeof value.tenantId === "string";
  }
  return (
    value.kind === "orgUnit" &&
    typeof value.tenantId === "string" &&
    typeof value.orgUnitId === "string"
  );
}

/** Checks the fields required by a stored role assignment. */
function isStoredRoleAssignment(
  value: unknown
): value is CiSecurityStoredRoleAssignment {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.subjectId === "string" &&
    typeof value.roleId === "string" &&
    (value.propagation === "exact" || value.propagation === "descendants") &&
    isAssignmentScope(value.scope) &&
    (value.expiresAt === undefined || typeof value.expiresAt === "string")
  );
}

/** Parses JSON strings while preserving already structured GraphQL data. */
function parseGraphqlData(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed;
  } catch (error) {
    throw new Error(
      `Unable to parse the EmberGuard response: ${String(error)}`
    );
  }
}

/** Extracts an operation body from an Amplify GraphQL response. */
function unwrapGraphqlBody(response: unknown): unknown {
  if (!isRecord(response)) {
    throw new Error("The EmberGuard provider returned an invalid response.");
  }
  const errors = response.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const message = errors
      .map((error) =>
        isRecord(error) && typeof error.message === "string"
          ? error.message
          : "Unknown GraphQL error"
      )
      .join("\n");
    throw new Error(message);
  }

  const parsed = parseGraphqlData(response.data);
  if (
    isRecord(parsed) &&
    typeof parsed.statusCode === "number" &&
    "body" in parsed
  ) {
    if (parsed.ok === false || parsed.statusCode >= 400) {
      const body = parsed.body;
      const message =
        isRecord(body) && typeof body.message === "string"
          ? body.message
          : isRecord(body) && typeof body.error === "string"
          ? body.error
          : "The EmberGuard data request failed.";
      throw new Error(message);
    }
    return parsed.body;
  }
  return parsed;
}

/** Reads a definition from a provider response body. */
function readDefinitionBody(
  response: unknown
): CiAccessControlDefinition | null {
  const body = unwrapGraphqlBody(response);
  if (!isRecord(body) || body.definition === undefined) {
    return null;
  }
  if (!isAccessControlDefinition(body.definition)) {
    throw new Error("The EmberGuard provider returned an invalid definition.");
  }
  ciAssertValidAccessControlDefinition(body.definition);
  return body.definition;
}

/** Reads role assignments from a provider response body. */
function readAssignmentsBody(
  response: unknown
): readonly CiSecurityStoredRoleAssignment[] {
  const body = unwrapGraphqlBody(response);
  if (!isRecord(body) || !Array.isArray(body.assignments)) {
    return [];
  }
  if (!body.assignments.every(isStoredRoleAssignment)) {
    throw new Error("The EmberGuard provider returned invalid role assignments.");
  }
  return body.assignments;
}

/**
 * Adapts CloudIgniter Amplify operations to the generic administration store.
 *
 * The generated application client remains application-owned; only its five
 * operation callbacks cross into this provider adapter.
 */
export function ciCreateAwsEmberguardAdministrationRepository(
  operations: CiAwsEmberguardGraphqlOperations
): CiSecurityAdministrationRepository {
  return {
    async getAccessControlDefinition() {
      return readDefinitionBody(await operations.getDefinition());
    },
    async saveAccessControlDefinition(definition) {
      unwrapGraphqlBody(
        await operations.saveDefinition(JSON.stringify({ definition }))
      );
    },
    async listRoleAssignments() {
      return readAssignmentsBody(await operations.listRoleAssignments());
    },
    async putRoleAssignment(assignment) {
      unwrapGraphqlBody(
        await operations.putRoleAssignment(JSON.stringify({ assignment }))
      );
    },
    async deleteRoleAssignment(input) {
      unwrapGraphqlBody(
        await operations.deleteRoleAssignment(JSON.stringify(input))
      );
    },
  };
}
