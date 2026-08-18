import { Emberguard } from "@cloudigniter/emberguard";
import type { CiAwsEmberguardDatabase } from "@cloudigniter/emberguard/providers/aws";
import {
  CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
  ciResponseError,
  ciResponseOk,
} from "@cloudigniter/core/lib";
import type {
  CiAccessControlDefinition,
  CiResponse,
} from "@cloudigniter/core/types";
import { Dynamodb } from "@ci-aws/lib";
import type { CiAppSyncResolverEvent } from "@ci-aws/types";

import { ciCreateAccessControlEmberguard } from "../../access-control";
import { CI_ENV } from "../../env/env.keys";

type CiEmberguardOperation =
  | "getDefinition"
  | "setDefinition"
  | "listRoleAssignments"
  | "putRoleAssignment"
  | "deleteRoleAssignment"
  | "listResourceInventory"
  | "putResourceInventory"
  | "listCustomDomains"
  | "putCustomDomain"
  | "deleteCustomDomain";

function parseInput(event: CiAppSyncResolverEvent): Record<string, unknown> {
  const value = event.arguments?.inputString;
  if (!value) return {};
  const parsed = JSON.parse(value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? parsed
    : {};
}

async function createEmberguard(): Promise<Emberguard | CiResponse> {
  const tableName = process.env[CI_ENV.CI_EMBERGUARD_ACCESS_TABLE_NAME];
  if (!tableName) {
    return await ciResponseError(
      500,
      `${CI_ENV.CI_EMBERGUARD_ACCESS_TABLE_NAME} is not configured.`
    );
  }

  const database = new Dynamodb({
    region: process.env[CI_ENV.CI_REGION] ?? process.env.AWS_REGION,
  });

  return ciCreateAccessControlEmberguard({
    database: database as unknown as CiAwsEmberguardDatabase,
    accessControlTableName: tableName,
  });
}

function getRecord<T>(input: Record<string, unknown>, key: string): T {
  const value = input[key];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Missing or invalid "${key}".`);
  }
  return value as T;
}

/** Reads trusted Cognito group claims supplied by AppSync. */
function getIdentityGroups(event: CiAppSyncResolverEvent): readonly string[] {
  const claims = (event.identity as { claims?: Record<string, unknown> } | null)
    ?.claims;
  const value = claims?.["cognito:groups"];
  if (Array.isArray(value)) {
    return value.filter((group): group is string => typeof group === "string");
  }
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((group): group is string => typeof group === "string")
      : value
          .split(",")
          .map((group) => group.trim())
          .filter(Boolean);
  } catch {
    return value
      .split(",")
      .map((group) => group.trim())
      .filter(Boolean);
  }
}

/** Produces a deterministic JSON representation for catalog comparisons. */
function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(
        ([key, nested]) => `${JSON.stringify(key)}:${stableSerialize(nested)}`
      )
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

/** Throws when a non-super administrator changes a platform-owned catalog entry. */
function assertCoreCatalogUnchanged(
  current: CiAccessControlDefinition,
  next: CiAccessControlDefinition
): void {
  for (const coreDomain of CI_DEFAULT_ACCESS_CONTROL_DEFINITION.domains) {
    const currentDomain = current.domains.find(
      (item) => item.id === coreDomain.id
    );
    const nextDomain = next.domains.find((item) => item.id === coreDomain.id);
    if (stableSerialize(currentDomain) !== stableSerialize(nextDomain)) {
      throw new Error(
        `Only system-super-admin can change core domain "${coreDomain.id}".`
      );
    }
  }

  for (const coreResource of CI_DEFAULT_ACCESS_CONTROL_DEFINITION.resources) {
    const currentResource = current.resources.find(
      (item) => item.id === coreResource.id
    );
    const nextResource = next.resources.find(
      (item) => item.id === coreResource.id
    );
    const withoutActions = (resource: typeof currentResource) =>
      resource ? { ...resource, actions: undefined } : undefined;
    if (
      stableSerialize(withoutActions(currentResource)) !==
      stableSerialize(withoutActions(nextResource))
    ) {
      throw new Error(
        `Only system-super-admin can change core resource "${coreResource.id}".`
      );
    }
    for (const coreAction of coreResource.actions) {
      const currentAction = currentResource?.actions.find(
        (item) => item.id === coreAction.id
      );
      const nextAction = nextResource?.actions.find(
        (item) => item.id === coreAction.id
      );
      if (stableSerialize(currentAction) !== stableSerialize(nextAction)) {
        throw new Error(
          `Only system-super-admin can change core action "${coreResource.id}.${coreAction.id}".`
        );
      }
    }
  }

  for (const coreRole of CI_DEFAULT_ACCESS_CONTROL_DEFINITION.roles) {
    const currentRole = current.roles.find((item) => item.id === coreRole.id);
    const nextRole = next.roles.find((item) => item.id === coreRole.id);
    if (stableSerialize(currentRole) !== stableSerialize(nextRole)) {
      throw new Error(
        `Only system-super-admin can change core role "${coreRole.id}".`
      );
    }
  }
}

export function ciCreateEmberguardAccessHandler(
  operation: CiEmberguardOperation
) {
  return async (event: CiAppSyncResolverEvent): Promise<CiResponse> => {
    try {
      const emberguard = await createEmberguard();
      if (!(emberguard instanceof Emberguard)) return emberguard;

      const input = parseInput(event);

      switch (operation) {
        case "getDefinition": {
          const initialized = await emberguard.ensureAccessControlState();
          const state = initialized.state;
          return ciResponseOk({
            definition: state.definition,
            roleCounters: state.roleCounters,
            revision: state.revision,
            created: initialized.created,
          });
        }

        case "setDefinition": {
          const definition = getRecord<CiAccessControlDefinition>(
            input,
            "definition"
          );
          if (!getIdentityGroups(event).includes("system-super-admin")) {
            assertCoreCatalogUnchanged(
              await emberguard.loadDefinition(),
              definition
            );
          }
          await emberguard.saveDefinition(definition);
          return ciResponseOk({ definition });
        }

        case "listRoleAssignments":
          return ciResponseOk({
            assignments: await emberguard.listRoleAssignments({
              subjectId: input.subjectId as string | undefined,
              tenantId: input.tenantId as string | undefined,
            }),
          });

        case "putRoleAssignment": {
          const assignment = getRecord<
            Parameters<Emberguard["putRoleAssignment"]>[0]
          >(input, "assignment");
          if (
            assignment.roleId === "system-super-admin" &&
            !getIdentityGroups(event).includes("system-super-admin")
          ) {
            throw new Error(
              "Only system-super-admin can grant the system-super-admin role."
            );
          }
          await emberguard.putRoleAssignment(assignment);
          return ciResponseOk({ assignment });
        }

        case "deleteRoleAssignment": {
          const subjectId = String(input.subjectId ?? "");
          const assignmentId = String(input.id ?? "");
          const existing = (
            await emberguard.listRoleAssignments({ subjectId })
          ).find((assignment) => assignment.id === assignmentId);
          if (
            existing?.roleId === "system-super-admin" &&
            !getIdentityGroups(event).includes("system-super-admin")
          ) {
            throw new Error(
              "Only system-super-admin can revoke the system-super-admin role."
            );
          }
          await emberguard.deleteRoleAssignment({
            id: assignmentId,
            subjectId,
          });
          return ciResponseOk({ deleted: true });
        }

        case "listResourceInventory":
          return ciResponseOk({
            records: await emberguard.listResourceInventory({
              tenantId: input.tenantId as string | undefined,
              domainId: input.domainId as string | undefined,
            }),
          });

        case "putResourceInventory": {
          const record = getRecord<
            Parameters<Emberguard["putResourceInventoryRecord"]>[0]
          >(input, "record");
          await emberguard.putResourceInventoryRecord(record);
          return ciResponseOk({ record });
        }

        case "listCustomDomains":
          return ciResponseOk({
            domains: await emberguard.listCustomDomains({
              tenantId: input.tenantId as string | undefined,
            }),
          });

        case "putCustomDomain": {
          const record = getRecord<
            Parameters<Emberguard["putCustomDomain"]>[0]
          >(input, "record");
          await emberguard.putCustomDomain(record);
          return ciResponseOk({ record });
        }

        case "deleteCustomDomain":
          await emberguard.deleteCustomDomain({
            id: String(input.id ?? ""),
            tenantId: input.tenantId as string | undefined,
          });
          return ciResponseOk({ deleted: true });
      }
    } catch (error) {
      return ciResponseError(400, "Emberguard access operation failed.", {
        details:
          error instanceof Error
            ? { name: error.name, message: error.message }
            : { message: String(error) },
      });
    }
  };
}

export const ciGetEmberguardDefinitionHandler =
  ciCreateEmberguardAccessHandler("getDefinition");
export const ciSetEmberguardDefinitionHandler =
  ciCreateEmberguardAccessHandler("setDefinition");
export const ciListEmberguardRoleAssignmentsHandler =
  ciCreateEmberguardAccessHandler("listRoleAssignments");
export const ciPutEmberguardRoleAssignmentHandler =
  ciCreateEmberguardAccessHandler("putRoleAssignment");
export const ciDeleteEmberguardRoleAssignmentHandler =
  ciCreateEmberguardAccessHandler("deleteRoleAssignment");
export const ciListEmberguardResourceInventoryHandler =
  ciCreateEmberguardAccessHandler("listResourceInventory");
export const ciPutEmberguardResourceInventoryHandler =
  ciCreateEmberguardAccessHandler("putResourceInventory");
export const ciListEmberguardCustomDomainsHandler =
  ciCreateEmberguardAccessHandler("listCustomDomains");
export const ciPutEmberguardCustomDomainHandler =
  ciCreateEmberguardAccessHandler("putCustomDomain");
export const ciDeleteEmberguardCustomDomainHandler =
  ciCreateEmberguardAccessHandler("deleteCustomDomain");
