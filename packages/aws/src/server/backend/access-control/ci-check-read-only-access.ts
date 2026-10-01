import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
  ciBuildTableKey,
  ciBuildTableKeys,
  ciCreateAuthorizer,
  ciCreateAuthorizationSubject,
  ciCreateRoleAssignments,
  ciMigrateLegacyPrivilegeTitles,
  ciCreateAppAccessControl,
  ciMergeAccessControlDefinitions,
} from "@cloudigniter/core/lib";
import type {
  CiAccessControlDefinition,
  CiAccessControlLayer,
  CiAccessRequirement,
  CiSecurityStoredRoleAssignment,
} from "@cloudigniter/core/types";
import type { CiAppSyncResolverEvent } from "../../../types";
import { CI_ENV } from "../env/env.keys";

/**
 * Adds the forced read-only veto to legacy group/target guards. This does not
 * grant access: callers must retain their existing authorization checks.
 * Reads current policy and subject assignments from strongly consistent keys.
 */
export async function ciCheckReadOnlyAccess(
  event: CiAppSyncResolverEvent,
  requirements: readonly CiAccessRequirement[],
  client = DynamoDBDocumentClient.from(
    new DynamoDBClient({
      region: process.env[CI_ENV.CI_REGION] ?? process.env.AWS_REGION,
    }),
  ),
): Promise<void> {
  return ciAuthorizeAwsAccess(event, requirements, {}, client);
}

/** Shared fresh-policy reader; module calls require an actual allow in addition to read-only vetoes. */
export async function ciAuthorizeAwsAccess(
  event: CiAppSyncResolverEvent,
  requirements: readonly CiAccessRequirement[],
  options: { extension?: CiAccessControlLayer; roleIds?: readonly string[]; requireAllow?: boolean },
  client: DynamoDBDocumentClient,
): Promise<void> {
  const identity = event.identity as {
    sub?: string;
    claims?: Record<string, unknown>;
  } | null;
  const claims = identity?.claims ?? {};
  const id = identity?.sub ?? claims.sub;
  if (typeof id !== "string" || !id) {
    throw new Error(
      "Authenticated identity is required to check read-only access.",
    );
  }
  const table = process.env[CI_ENV.CI_EMBERGUARD_ACCESS_TABLE_NAME];
  if (!table)
    throw new Error("EmberGuard authorization storage is not configured.");

  let groups: unknown = claims["cognito:groups"];
  if (typeof groups === "string") {
    const text = groups;
    try {
      groups = JSON.parse(text);
    } catch {
      groups = text.split(",").map((value) => value.trim());
    }
  }
  const roleIds = Array.isArray(groups)
    ? groups.filter((value): value is string => typeof value === "string")
    : [];
  const stored = await client.send(
    new GetCommand({
      TableName: table,
      Key: ciBuildTableKeys({
        partition: ["EMBERGUARD", "ACCESS_CONTROL"],
        sort: ["DEFINITION", "ACTIVE"],
      }),
      ConsistentRead: true,
    }),
  );
  const definition: CiAccessControlDefinition = stored.Item
    ? stored.Item.state?.definition
    : CI_DEFAULT_ACCESS_CONTROL_DEFINITION;
  if (!definition) throw new Error("Invalid EmberGuard authorization catalog.");
  const effective = options.extension
    ? ciMergeAccessControlDefinitions(ciCreateAppAccessControl(options.extension), definition)
    : definition;
  const authorizer = ciCreateAuthorizer(
    ciMigrateLegacyPrivilegeTitles(
      effective,
      CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
    ),
  );
  const assignments: CiSecurityStoredRoleAssignment[] = [];
  let cursor: Record<string, unknown> | undefined;
  let pages = 0;
  do {
    const page = await client.send(
      new QueryCommand({
        TableName: table,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": ciBuildTableKey(
            "EMBERGUARD",
            "SUBJECT",
            id,
            "ROLE_ASSIGNMENTS",
          ),
        },
        ConsistentRead: true,
        Limit: 100,
        ExclusiveStartKey: cursor,
      }),
    );
    assignments.push(
      ...((page.Items ?? []) as CiSecurityStoredRoleAssignment[]),
    );
    cursor = page.LastEvaluatedKey;
    if (++pages > 20)
      throw new Error("Too many EmberGuard authorization assignments.");
  } while (cursor);
  const subject = ciCreateAuthorizationSubject({ id, authenticated: true }, [
    ...ciCreateRoleAssignments(options.roleIds ?? [], { kind: "system" }, "exact"),
    ...ciCreateRoleAssignments(roleIds, { kind: "system" }, "exact"),
    ...ciCreateRoleAssignments(roleIds, { kind: "global" }, "descendants"),
    ...assignments.filter((assignment) => assignment.subjectId === id),
  ]);
  for (const requirement of requirements) {
    // User management exposes system/global authority over the same directory.
    const scopeKinds =
      requirement.resource === "identity.users"
        ? (["system", "global"] as const)
        : (["system"] as const);
    for (const kind of scopeKinds) {
      const decision = authorizer.authorize({
        subject,
        scope: { kind },
        ...requirement,
      });
      if (options.requireAllow && !decision.allowed)
        throw new Error(`Module access denied: ${decision.reason}.`);
      if (decision.reason === "read-only") {
        throw new Error(
          `Read-only access blocks ${requirement.resource}.${requirement.action}.`,
        );
      }
      if (
        [
          "unknown-resource",
          "unknown-action",
          "unsupported-scope",
          "unauthenticated",
          "suspended-domain",
          "suspended-resource",
        ].includes(decision.reason)
      ) {
        throw new Error(
          `EmberGuard cannot authorize this write: ${decision.reason}.`,
        );
      }
    }
  }
}
