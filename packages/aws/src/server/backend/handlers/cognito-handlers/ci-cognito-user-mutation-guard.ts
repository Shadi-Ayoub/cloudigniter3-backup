import type { CognitoIdentityProviderClientConfig } from "@aws-sdk/client-cognito-identity-provider";
import type { Context } from "aws-lambda";

import {
  CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE,
  ciBuildTableKey,
  ciCanManageAdministrator,
  ciIsAdministratorUser,
} from "@cloudigniter/core/lib";
import type {
  CiAdministratorManagementOperation,
  CiAdministratorManagementSubject,
  CiErrorStatus,
  CiResponse,
  CiSecurityStoredRoleAssignment,
} from "@cloudigniter/core/types";

import {
  CI_COGNITO_ROOT_USER_GROUP,
  Dynamodb,
  ciGetCognitoUser,
} from "@ci-aws/lib";
import type { CICognitoUser, CiAppSyncResolverEvent } from "@ci-aws/types";

import { CI_ENV } from "../../env/env.keys";

const CI_COGNITO_ORDINARY_PROFILE_ATTRIBUTES = new Set([
  "address",
  "birthdate",
  "email",
  "email_verified",
  "family_name",
  "gender",
  "given_name",
  "locale",
  "middle_name",
  "name",
  "nickname",
  "phone_number",
  "phone_number_verified",
  "picture",
  "preferred_username",
  "profile",
  "updated_at",
  "website",
  "zoneinfo",
]);

/** Environment required to bind mutations and assignment reads to this deployment. */
export const CI_COGNITO_USER_MUTATION_ENV = [
  CI_ENV.CI_USER_POOL_ID,
  CI_ENV.CI_EMBERGUARD_ACCESS_TABLE_NAME,
] as const;

export type CiCognitoUserMutationKind =
  "create" | "update" | "set-enabled" | "set-password" | "delete";

export type CiCognitoUserMutationGuardInput = {
  event: CiAppSyncResolverEvent;
  /** Hard-binds the handler to the deployed user pool. */
  configuredUserPoolId: string;
  targetUserPoolId: string | undefined;
  targetUsername: string | undefined;
  kind: CiCognitoUserMutationKind;
  /** Present for create and whenever an update replaces group membership. */
  requestedRoleIds?: readonly string[];
  /** Attribute names changed by an update, used to isolate ordinary profile edits. */
  updateAttributeNames?: readonly string[];
  /** Desired enabled state for self-disable protection. */
  requestedEnabled?: boolean;
  accessControlTableName?: string;
  region?: string;
  now?: Date;
  clientConfig?: CognitoIdentityProviderClientConfig;
};

export type CiCognitoUserTargetLookup =
  | { status: "found"; user: CICognitoUser }
  | { status: "not-found" }
  | { status: "error"; statusCode: CiErrorStatus };

export type CiCognitoUserMutationGuardDependencies = {
  loadUser: (input: {
    userPoolId: string;
    username: string;
    clientConfig?: CognitoIdentityProviderClientConfig;
  }) => Promise<CiCognitoUserTargetLookup>;
  loadAssignments: (input: {
    subjectId: string;
    accessControlTableName?: string;
    region?: string;
  }) => Promise<readonly CiSecurityStoredRoleAssignment[]>;
};

export type CiCognitoUserMutationGuardDecision =
  | { allowed: true }
  | { allowed: false; statusCode: CiErrorStatus; reason: string };

const ALLOWED = { allowed: true } as const;

function denied(
  reason: string,
  statusCode: CiErrorStatus = 403,
): CiCognitoUserMutationGuardDecision {
  return { allowed: false, statusCode, reason };
}

function normalizeRoleIds(roleIds: readonly string[]): string[] {
  return Array.from(
    new Set(roleIds.map((roleId) => roleId.trim()).filter(Boolean)),
  );
}

/** Tests the exact, active assignment required for upward system-super management. */
export function ciHasActiveSystemSuperAdminManagementAssignment(
  assignments: readonly CiSecurityStoredRoleAssignment[],
  now = new Date(),
): boolean {
  const instant = now.valueOf();
  return assignments.some((assignment) => {
    const validFrom = assignment.validFrom
      ? Date.parse(assignment.validFrom)
      : Number.NEGATIVE_INFINITY;
    const expiresAt = assignment.expiresAt
      ? Date.parse(assignment.expiresAt)
      : Number.POSITIVE_INFINITY;
    return (
      assignment.roleId === CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE &&
      assignment.scope.kind === "system" &&
      assignment.propagation === "exact" &&
      validFrom <= instant &&
      instant < expiresAt
    );
  });
}

/** Resolves every currently active assignment role without applying scope policy. */
export function ciResolveActiveAssignmentRoleIds(
  assignments: readonly CiSecurityStoredRoleAssignment[],
  now = new Date(),
): string[] {
  const instant = now.valueOf();
  return Array.from(
    new Set(
      assignments.flatMap((assignment) => {
        const validFrom = assignment.validFrom
          ? Date.parse(assignment.validFrom)
          : Number.NEGATIVE_INFINITY;
        const expiresAt = assignment.expiresAt
          ? Date.parse(assignment.expiresAt)
          : Number.POSITIVE_INFINITY;
        return validFrom <= instant && instant < expiresAt
          ? [assignment.roleId]
          : [];
      }),
    ),
  );
}

function resolveActorClaims(event: CiAppSyncResolverEvent): {
  username: string;
  sub?: string;
} | null {
  const identity = event.identity as {
    sub?: unknown;
    username?: unknown;
    claims?: Record<string, unknown>;
  } | null;
  const eventClaims = identity?.claims ?? {};
  const usernameCandidates = [
    identity?.username,
    eventClaims["cognito:username"],
    eventClaims.username,
  ];
  const username = usernameCandidates.find(
    (candidate): candidate is string =>
      typeof candidate === "string" && Boolean(candidate.trim()),
  );
  const subCandidate = identity?.sub ?? eventClaims.sub;

  if (!username) return null;
  return {
    username,
    ...(typeof subCandidate === "string" && subCandidate.trim()
      ? { sub: subCandidate }
      : {}),
  };
}

function targetSubject(
  user: CICognitoUser,
  assignmentRoleIds: readonly string[] = [],
): CiAdministratorManagementSubject {
  return {
    id: user.id,
    effectiveRoleIds: Array.from(
      new Set([...user.groups.map((group) => group.id), ...assignmentRoleIds]),
    ),
    isRootUser: user.isRootUser,
    canManageSystemSuperAdmins: false,
  };
}

function prospectiveTargetSubject(input: {
  username: string;
  requestedRoleIds: readonly string[];
}): CiAdministratorManagementSubject {
  return {
    id: input.username,
    effectiveRoleIds: normalizeRoleIds(input.requestedRoleIds),
    isRootUser: false,
    canManageSystemSuperAdmins: false,
  };
}

function authorizeAdministratorTarget(input: {
  actor: CiAdministratorManagementSubject;
  target: CiAdministratorManagementSubject;
  operation: CiAdministratorManagementOperation;
}): CiCognitoUserMutationGuardDecision {
  if (!ciIsAdministratorUser(input.target)) return ALLOWED;

  if (
    ciCanManageAdministrator({
      actor: input.actor,
      target: input.target,
      operation: input.operation,
    })
  ) {
    return ALLOWED;
  }

  if (input.target.isRootUser) {
    return denied(
      input.operation === "profile-edit"
        ? "Only the Root User owner may edit the Root User profile."
        : "The Root User account cannot be lifecycle-managed or have its authority changed.",
    );
  }

  return denied(
    "An administrator cannot manage an account with higher authority.",
  );
}

const defaultDependencies: CiCognitoUserMutationGuardDependencies = {
  loadUser: async ({ userPoolId, username, clientConfig }) => {
    const result = await ciGetCognitoUser({
      cognito: { UserPoolId: userPoolId, Username: username },
      CognitoClientConfig: clientConfig,
    });

    if (result.ok) return { status: "found", user: result.body };
    if (result.statusCode === 404) return { status: "not-found" };
    return { status: "error", statusCode: result.statusCode };
  },
  loadAssignments: async ({ subjectId, accessControlTableName, region }) => {
    const tableName =
      accessControlTableName?.trim() ||
      process.env[CI_ENV.CI_EMBERGUARD_ACCESS_TABLE_NAME]?.trim();
    if (!tableName) {
      throw new Error("EmberGuard assignment storage is not configured.");
    }

    const database = new Dynamodb({ region });
    const initialized = await database.initialize();
    if (!initialized.ok) {
      throw new Error(
        "EmberGuard assignment storage could not be initialized.",
      );
    }
    const assignments: CiSecurityStoredRoleAssignment[] = [];
    const seenPaginationKeys = new Set<string>();
    let exclusiveStartKey: Record<string, unknown> | undefined;

    try {
      do {
        const result = await database.queryItems<
          CiSecurityStoredRoleAssignment & Record<string, unknown>
        >({
          TableName: tableName,
          KeyConditionExpression: "PK = :pk",
          ExpressionAttributeValues: {
            ":pk": ciBuildTableKey(
              "EMBERGUARD",
              "SUBJECT",
              subjectId,
              "ROLE_ASSIGNMENTS",
            ),
          },
          ConsistentRead: true,
          ...(exclusiveStartKey
            ? { ExclusiveStartKey: exclusiveStartKey }
            : {}),
        });
        if (!result.ok) {
          throw new Error("EmberGuard assignments could not be queried.");
        }
        assignments.push(...result.body.items);

        const nextKey = result.body.lastEvaluatedKey;
        if (nextKey) {
          const signature = JSON.stringify(nextKey);
          if (seenPaginationKeys.has(signature)) {
            throw new Error("EmberGuard assignment pagination repeated a key.");
          }
          seenPaginationKeys.add(signature);
        }
        exclusiveStartKey = nextKey;
      } while (exclusiveStartKey);
    } finally {
      database.destroy();
    }

    return assignments;
  },
};

/**
 * Authorizes a direct Cognito mutation against trusted actor claims and the
 * target's current Cognito groups before the mutating service is invoked.
 */
export async function ciAuthorizeCognitoUserMutation(
  input: CiCognitoUserMutationGuardInput,
  dependencies: CiCognitoUserMutationGuardDependencies = defaultDependencies,
): Promise<CiCognitoUserMutationGuardDecision> {
  const userPoolId = input.targetUserPoolId?.trim();
  const username = input.targetUsername?.trim();

  if (!userPoolId || !username) {
    return denied("UserPoolId and Username are required.", 400);
  }
  const configuredUserPoolId = input.configuredUserPoolId.trim();
  if (!configuredUserPoolId) {
    return denied("The managed Cognito user pool is not configured.", 500);
  }
  if (userPoolId !== configuredUserPoolId) {
    return denied("The target user pool is not managed by this handler.");
  }

  const actorClaims = resolveActorClaims(input.event);
  if (!actorClaims) {
    return denied("Authenticated Cognito actor claims are required.", 401);
  }

  const requestedRoleIds = input.requestedRoleIds
    ? normalizeRoleIds(input.requestedRoleIds)
    : undefined;
  if (requestedRoleIds?.includes(CI_COGNITO_ROOT_USER_GROUP)) {
    return denied(
      `The reserved group "${CI_COGNITO_ROOT_USER_GROUP}" may only be managed by Root User bootstrap.`,
    );
  }
  if (requestedRoleIds?.includes(CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE)) {
    return denied(
      `The role "${CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE}" is assignment-only and cannot be stored as a Cognito group.`,
    );
  }

  const actorLookup = await dependencies.loadUser({
    userPoolId,
    username: actorClaims.username,
    clientConfig: input.clientConfig,
  });
  if (actorLookup.status === "error") {
    return denied(
      "The authenticated Cognito actor could not be resolved safely.",
      actorLookup.statusCode,
    );
  }
  if (actorLookup.status === "not-found") {
    return denied("The authenticated Cognito actor was not found.", 401);
  }
  if (actorClaims.sub && actorLookup.user.id !== actorClaims.sub) {
    return denied("Authenticated Cognito actor claims do not match.", 401);
  }
  if (!actorLookup.user.enabled) {
    return denied("The authenticated Cognito actor is disabled.");
  }

  let actorAssignments: readonly CiSecurityStoredRoleAssignment[];
  try {
    actorAssignments = await dependencies.loadAssignments({
      subjectId: actorLookup.user.id,
      accessControlTableName: input.accessControlTableName,
      region: input.region,
    });
  } catch {
    return denied(
      "Administrator assignment authority could not be resolved safely.",
      500,
    );
  }
  const now = input.now ?? new Date();
  const actor = targetSubject(
    actorLookup.user,
    ciResolveActiveAssignmentRoleIds(
      actorAssignments.filter(
        (assignment) =>
          assignment.scope.kind === "system" ||
          assignment.scope.kind === "global",
      ),
      now,
    ),
  );
  actor.canManageSystemSuperAdmins =
    ciHasActiveSystemSuperAdminManagementAssignment(actorAssignments, now);
  if (!ciIsAdministratorUser(actor)) {
    return denied("Administrator privileges are required.");
  }

  if (input.kind === "create") {
    const prospectiveTarget = prospectiveTargetSubject({
      username,
      requestedRoleIds: requestedRoleIds ?? [],
    });
    return authorizeAdministratorTarget({
      actor,
      target: prospectiveTarget,
      operation: "account-management",
    });
  }

  const lookup =
    actorClaims.username === username
      ? actorLookup
      : await dependencies.loadUser({
          userPoolId,
          username,
          clientConfig: input.clientConfig,
        });

  if (lookup.status === "error") {
    return denied(
      "The target Cognito account could not be resolved safely.",
      lookup.statusCode,
    );
  }
  if (lookup.status === "not-found") {
    return input.kind === "delete"
      ? ALLOWED
      : denied("The target Cognito account was not found.", 404);
  }

  let targetAssignments: readonly CiSecurityStoredRoleAssignment[];
  try {
    targetAssignments =
      actor.id === lookup.user.id
        ? actorAssignments
        : await dependencies.loadAssignments({
            subjectId: lookup.user.id,
            accessControlTableName: input.accessControlTableName,
            region: input.region,
          });
  } catch {
    return denied(
      "Target administrator assignment authority could not be resolved safely.",
      500,
    );
  }

  const operation: CiAdministratorManagementOperation =
    input.kind === "update" &&
    requestedRoleIds === undefined &&
    (input.updateAttributeNames ?? []).every((attributeName) =>
      CI_COGNITO_ORDINARY_PROFILE_ATTRIBUTES.has(attributeName),
    )
      ? "profile-edit"
      : "account-management";
  const currentDecision = authorizeAdministratorTarget({
    actor,
    target: targetSubject(
      lookup.user,
      ciResolveActiveAssignmentRoleIds(targetAssignments, now),
    ),
    operation,
  });
  if (!currentDecision.allowed) return currentDecision;

  if (
    actor.id === lookup.user.id &&
    (input.kind === "delete" ||
      (input.kind === "set-enabled" && input.requestedEnabled === false))
  ) {
    return denied("Administrators cannot disable or delete their own account.");
  }

  if (input.kind === "update" && requestedRoleIds !== undefined) {
    return authorizeAdministratorTarget({
      actor,
      target: prospectiveTargetSubject({ username, requestedRoleIds }),
      operation: "account-management",
    });
  }

  return ALLOWED;
}

/** Removes mutation arguments, identity claims, and request headers from debug output. */
function protectedMutationEvent(
  event: CiAppSyncResolverEvent,
): CiAppSyncResolverEvent {
  return {
    ...event,
    arguments: { ...event.arguments, inputString: "[REDACTED]" },
    identity: null,
    ...(event.request ? { request: { ...event.request, headers: {} } } : {}),
  };
}

/**
 * Wraps standardized handlers so passwords and identity claims are never
 * echoed through response parameters or AWS debug-event metadata.
 */
export function ciProtectCognitoUserMutationHandler(
  handler: (
    event: CiAppSyncResolverEvent,
    context: Context,
  ) => Promise<CiResponse>,
) {
  return async (
    event: CiAppSyncResolverEvent,
    context: Context,
  ): Promise<CiResponse> => {
    const response = await handler(event, context);
    const responseWithDebug = response as CiResponse & {
      debug?: Record<string, unknown>;
    };
    return {
      ...response,
      ...(Object.hasOwn(response, "parameter")
        ? { parameter: "[REDACTED]" }
        : {}),
      debug: {
        ...(responseWithDebug.debug ?? {}),
        event: protectedMutationEvent(event),
      },
    } as unknown as CiResponse;
  };
}
