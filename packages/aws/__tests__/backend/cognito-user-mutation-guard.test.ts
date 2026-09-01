import assert from "node:assert/strict";
import test from "node:test";

import { CI_COGNITO_ROOT_USER_GROUP } from "@ci-aws/lib";
import type { CICognitoUser, CiAppSyncResolverEvent } from "@ci-aws/types";
import { CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE } from "@cloudigniter/core/lib";
import type {
  CiResponse,
  CiSecurityStoredRoleAssignment,
} from "@cloudigniter/core/types";
import type { Context } from "aws-lambda";

import {
  ciAuthorizeCognitoUserMutation,
  ciHasActiveSystemSuperAdminManagementAssignment,
  ciProtectCognitoUserMutationHandler,
  ciResolveActiveAssignmentRoleIds,
  type CiCognitoUserMutationGuardDependencies,
  type CiCognitoUserMutationGuardInput,
} from "../../src/server/backend/handlers/cognito-handlers/ci-cognito-user-mutation-guard";

const USER_POOL_ID = "me-central-1_test";

function resolverEvent(input: {
  username?: string;
  sub?: string;
  claimedGroups?: readonly string[];
  inputString?: string;
}): CiAppSyncResolverEvent {
  return {
    arguments: { inputString: input.inputString ?? "{}" },
    identity: {
      username: input.username,
      sub: input.sub,
      claims: {
        ...(input.username ? { "cognito:username": input.username } : {}),
        ...(input.sub ? { sub: input.sub } : {}),
        ...(input.claimedGroups
          ? { "cognito:groups": [...input.claimedGroups] }
          : {}),
      },
    },
    request: { headers: { authorization: "secret-token" } },
  } as unknown as CiAppSyncResolverEvent;
}

function cognitoUser(input: {
  id: string;
  username: string;
  roles?: readonly string[];
  isRootUser?: boolean;
  enabled?: boolean;
}): CICognitoUser {
  return {
    id: input.id,
    username: input.username,
    enabled: input.enabled ?? true,
    status: "CONFIRMED",
    identityProvider: {
      id: "cognito-user-pool",
      label: "Amazon Cognito",
      kind: "native",
    },
    attributes: { sub: input.id },
    isRootUser: input.isRootUser ?? false,
    groups: (input.roles ?? []).map((id) => ({ id })),
  };
}

function guardDependencies(input: {
  users: readonly CICognitoUser[];
  delegatedActorIds?: readonly string[];
  errorUsernames?: readonly string[];
  assignmentsBySubject?: Readonly<
    Record<string, readonly CiSecurityStoredRoleAssignment[]>
  >;
}) {
  const users = new Map(input.users.map((user) => [user.username, user]));
  const delegated = new Set(input.delegatedActorIds ?? []);
  const errors = new Set(input.errorUsernames ?? []);
  const loadedUsernames: string[] = [];

  const dependencies: CiCognitoUserMutationGuardDependencies = {
    loadUser: async ({ username }) => {
      loadedUsernames.push(username);
      if (errors.has(username)) return { status: "error", statusCode: 500 };
      const user = users.get(username);
      return user ? { status: "found", user } : { status: "not-found" };
    },
    loadAssignments: async ({ subjectId }) => [
      ...(input.assignmentsBySubject?.[subjectId] ?? []),
      ...(delegated.has(subjectId)
        ? [
            storedAssignment({
              id: `delegate-${subjectId}`,
              subjectId,
              roleId: CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE,
              scope: { kind: "system" },
              propagation: "exact",
            }),
          ]
        : []),
    ],
  };

  return { dependencies, loadedUsernames };
}

function storedAssignment(
  input: Partial<CiSecurityStoredRoleAssignment> &
    Pick<CiSecurityStoredRoleAssignment, "id" | "subjectId" | "roleId">,
): CiSecurityStoredRoleAssignment {
  return {
    scope: { kind: "system" },
    propagation: "exact",
    ...input,
  };
}

function guardInput(
  input: Partial<CiCognitoUserMutationGuardInput> &
    Pick<CiCognitoUserMutationGuardInput, "event" | "kind">,
): CiCognitoUserMutationGuardInput {
  return {
    configuredUserPoolId: USER_POOL_ID,
    targetUserPoolId: USER_POOL_ID,
    targetUsername: "target",
    ...input,
  };
}

test("uses refreshed Cognito authority instead of stale actor group claims", async () => {
  const actor = cognitoUser({
    id: "actor-sub",
    username: "actor",
    roles: ["admin"],
  });
  const target = cognitoUser({
    id: "target-sub",
    username: "target",
    roles: ["super-admin"],
  });
  const { dependencies, loadedUsernames } = guardDependencies({
    users: [actor, target],
  });

  const decision = await ciAuthorizeCognitoUserMutation(
    guardInput({
      event: resolverEvent({
        username: "actor",
        sub: "actor-sub",
        claimedGroups: ["system-super-admin"],
      }),
      kind: "set-password",
    }),
    dependencies,
  );

  assert.equal(decision.allowed, false);
  assert.match(decision.allowed ? "" : decision.reason, /higher authority/i);
  assert.deepEqual(loadedUsernames, ["actor", "target"]);
});

test("checks both current and prospective authority for create and update", async () => {
  const actor = cognitoUser({
    id: "actor-sub",
    username: "actor",
    roles: ["admin"],
  });
  const ordinaryTarget = cognitoUser({
    id: "target-sub",
    username: "target",
    roles: ["user"],
  });
  const higherTarget = cognitoUser({
    id: "higher-sub",
    username: "higher",
    roles: ["super-admin"],
  });
  const { dependencies } = guardDependencies({
    users: [actor, ordinaryTarget, higherTarget],
    assignmentsBySubject: {
      "target-sub": [
        storedAssignment({
          id: "target-system-admin",
          subjectId: "target-sub",
          roleId: "system-admin",
        }),
      ],
    },
  });
  const event = resolverEvent({ username: "actor", sub: "actor-sub" });

  const createPeer = await ciAuthorizeCognitoUserMutation(
    guardInput({
      event,
      kind: "create",
      targetUsername: "new-admin",
      requestedRoleIds: ["admin"],
    }),
    dependencies,
  );
  const createHigher = await ciAuthorizeCognitoUserMutation(
    guardInput({
      event,
      kind: "create",
      targetUsername: "new-super",
      requestedRoleIds: ["super-admin"],
    }),
    dependencies,
  );
  const promoteTarget = await ciAuthorizeCognitoUserMutation(
    guardInput({
      event,
      kind: "update",
      requestedRoleIds: ["system-super-admin"],
      updateAttributeNames: [],
    }),
    dependencies,
  );
  const demoteHigher = await ciAuthorizeCognitoUserMutation(
    guardInput({
      event,
      kind: "update",
      targetUsername: "higher",
      requestedRoleIds: ["admin"],
      updateAttributeNames: [],
    }),
    dependencies,
  );
  const assignedHigherTarget = await ciAuthorizeCognitoUserMutation(
    guardInput({
      event,
      kind: "update",
      targetUsername: "target",
      updateAttributeNames: ["given_name"],
    }),
    dependencies,
  );

  assert.equal(createPeer.allowed, true);
  assert.equal(createHigher.allowed, false);
  assert.equal(promoteTarget.allowed, false);
  assert.equal(demoteHigher.allowed, false);
  assert.equal(assignedHigherTarget.allowed, false);
});

test("includes active administrator assignments in actor authority", async () => {
  const actor = cognitoUser({
    id: "assigned-actor-sub",
    username: "assigned-actor",
    roles: ["user"],
  });
  const { dependencies } = guardDependencies({
    users: [actor],
    assignmentsBySubject: {
      "assigned-actor-sub": [
        storedAssignment({
          id: "assigned-admin",
          subjectId: "assigned-actor-sub",
          roleId: "admin",
        }),
      ],
    },
  });

  const decision = await ciAuthorizeCognitoUserMutation(
    guardInput({
      event: resolverEvent({
        username: "assigned-actor",
        sub: "assigned-actor-sub",
      }),
      kind: "create",
      targetUsername: "new-admin",
      requestedRoleIds: ["admin"],
    }),
    dependencies,
  );

  assert.equal(decision.allowed, true);
});

test("does not elevate global Cognito authority from a tenant assignment", async () => {
  const actor = cognitoUser({
    id: "tenant-actor-sub",
    username: "tenant-actor",
    roles: ["user"],
  });
  const { dependencies } = guardDependencies({
    users: [actor],
    assignmentsBySubject: {
      "tenant-actor-sub": [
        storedAssignment({
          id: "tenant-admin",
          subjectId: "tenant-actor-sub",
          roleId: "admin",
          scope: { kind: "tenant", tenantId: "tenant-a" },
        }),
      ],
    },
  });

  const decision = await ciAuthorizeCognitoUserMutation(
    guardInput({
      event: resolverEvent({
        username: "tenant-actor",
        sub: "tenant-actor-sub",
      }),
      kind: "create",
      targetUsername: "new-admin",
      requestedRoleIds: ["admin"],
    }),
    dependencies,
  );

  assert.equal(decision.allowed, false);
  assert.match(
    decision.allowed ? "" : decision.reason,
    /administrator privileges/i,
  );
});

test("protects Root ownership and every account-lifecycle operation", async () => {
  const root = cognitoUser({
    id: "root-sub",
    username: "root",
    roles: ["system-super-admin"],
    isRootUser: true,
  });
  const { dependencies } = guardDependencies({ users: [root] });
  const event = resolverEvent({ username: "root", sub: "root-sub" });

  const ordinaryProfileEdit = await ciAuthorizeCognitoUserMutation(
    guardInput({
      event,
      kind: "update",
      targetUsername: "root",
      updateAttributeNames: ["given_name", "family_name", "locale"],
    }),
    dependencies,
  );
  const privilegedAttributeEdit = await ciAuthorizeCognitoUserMutation(
    guardInput({
      event,
      kind: "update",
      targetUsername: "root",
      updateAttributeNames: ["custom:authority"],
    }),
    dependencies,
  );

  assert.equal(ordinaryProfileEdit.allowed, true);
  assert.equal(privilegedAttributeEdit.allowed, false);

  for (const kind of ["delete", "set-enabled", "set-password"] as const) {
    const decision = await ciAuthorizeCognitoUserMutation(
      guardInput({
        event,
        kind,
        targetUsername: "root",
        ...(kind === "set-enabled" ? { requestedEnabled: true } : {}),
      }),
      dependencies,
    );
    assert.equal(decision.allowed, false, kind);
    assert.match(decision.allowed ? "" : decision.reason, /Root User/i);
  }
});

test("honors only persisted delegation and rejects reserved Cognito groups", async () => {
  const actor = cognitoUser({
    id: "actor-sub",
    username: "actor",
    roles: ["admin", CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE],
  });
  const systemSuper = cognitoUser({
    id: "target-sub",
    username: "target",
    roles: ["system-super-admin"],
  });
  const event = resolverEvent({ username: "actor", sub: "actor-sub" });
  const withoutAssignment = guardDependencies({ users: [actor, systemSuper] });
  const withAssignment = guardDependencies({
    users: [actor, systemSuper],
    delegatedActorIds: ["actor-sub"],
  });

  const deniedWithoutAssignment = await ciAuthorizeCognitoUserMutation(
    guardInput({ event, kind: "set-enabled", requestedEnabled: false }),
    withoutAssignment.dependencies,
  );
  const allowedWithAssignment = await ciAuthorizeCognitoUserMutation(
    guardInput({ event, kind: "set-enabled", requestedEnabled: false }),
    withAssignment.dependencies,
  );
  assert.equal(deniedWithoutAssignment.allowed, false);
  assert.equal(allowedWithAssignment.allowed, true);

  for (const reservedRole of [
    CI_COGNITO_ROOT_USER_GROUP,
    CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE,
  ]) {
    const decision = await ciAuthorizeCognitoUserMutation(
      guardInput({
        event,
        kind: "create",
        targetUsername: "new-user",
        requestedRoleIds: [reservedRole],
      }),
      withAssignment.dependencies,
    );
    assert.equal(decision.allowed, false, reservedRole);
    assert.match(
      decision.allowed ? "" : decision.reason,
      /reserved|assignment-only/i,
    );
  }
});

test("denies disabled actors and administrator self-disable or self-delete", async () => {
  const disabledActor = cognitoUser({
    id: "disabled-sub",
    username: "disabled",
    roles: ["system-super-admin"],
    enabled: false,
  });
  const actor = cognitoUser({
    id: "actor-sub",
    username: "actor",
    roles: ["system-admin"],
  });
  const { dependencies } = guardDependencies({ users: [disabledActor, actor] });

  const disabledDecision = await ciAuthorizeCognitoUserMutation(
    guardInput({
      event: resolverEvent({ username: "disabled", sub: "disabled-sub" }),
      kind: "create",
      targetUsername: "new-user",
      requestedRoleIds: ["user"],
    }),
    dependencies,
  );
  assert.equal(disabledDecision.allowed, false);
  assert.match(
    disabledDecision.allowed ? "" : disabledDecision.reason,
    /disabled/i,
  );

  for (const kind of ["delete", "set-enabled"] as const) {
    const decision = await ciAuthorizeCognitoUserMutation(
      guardInput({
        event: resolverEvent({ username: "actor", sub: "actor-sub" }),
        kind,
        targetUsername: "actor",
        ...(kind === "set-enabled" ? { requestedEnabled: false } : {}),
      }),
      dependencies,
    );
    assert.equal(decision.allowed, false, kind);
    assert.match(decision.allowed ? "" : decision.reason, /own account/i);
  }
});

test("fails closed on pool, identity, and Cognito lookup mismatches", async () => {
  const actor = cognitoUser({
    id: "actor-sub",
    username: "actor",
    roles: ["system-admin"],
  });
  const { dependencies, loadedUsernames } = guardDependencies({
    users: [actor],
    errorUsernames: ["broken"],
  });
  const event = resolverEvent({ username: "actor", sub: "actor-sub" });

  const wrongPool = await ciAuthorizeCognitoUserMutation(
    guardInput({
      event,
      kind: "delete",
      targetUserPoolId: "me-central-1_other",
    }),
    dependencies,
  );
  assert.equal(wrongPool.allowed, false);
  assert.deepEqual(loadedUsernames, []);

  const claimMismatch = await ciAuthorizeCognitoUserMutation(
    guardInput({
      event: resolverEvent({ username: "actor", sub: "different-sub" }),
      kind: "create",
      targetUsername: "new-user",
      requestedRoleIds: ["user"],
    }),
    dependencies,
  );
  assert.equal(claimMismatch.allowed, false);

  const lookupFailure = await ciAuthorizeCognitoUserMutation(
    guardInput({ event, kind: "set-password", targetUsername: "broken" }),
    dependencies,
  );
  assert.equal(lookupFailure.allowed, false);
  assert.equal(lookupFailure.allowed ? 200 : lookupFailure.statusCode, 500);

  const missingDelete = await ciAuthorizeCognitoUserMutation(
    guardInput({ event, kind: "delete", targetUsername: "missing" }),
    dependencies,
  );
  const missingUpdate = await ciAuthorizeCognitoUserMutation(
    guardInput({ event, kind: "update", targetUsername: "missing" }),
    dependencies,
  );
  assert.equal(missingDelete.allowed, true);
  assert.equal(missingUpdate.allowed, false);
  assert.equal(missingUpdate.allowed ? 200 : missingUpdate.statusCode, 404);

  const assignmentFailure = await ciAuthorizeCognitoUserMutation(
    guardInput({
      event,
      kind: "create",
      targetUsername: "new-user",
      requestedRoleIds: ["user"],
    }),
    {
      ...dependencies,
      loadAssignments: async () => {
        throw new Error("DynamoDB unavailable");
      },
    },
  );
  assert.equal(assignmentFailure.allowed, false);
  assert.equal(
    assignmentFailure.allowed ? 200 : assignmentFailure.statusCode,
    500,
  );
});

test("recognizes only active exact system-scoped manager assignments", () => {
  const assignment = (
    overrides: Partial<CiSecurityStoredRoleAssignment> = {},
  ): CiSecurityStoredRoleAssignment =>
    storedAssignment({
      id: "assignment-1",
      subjectId: "actor-sub",
      roleId: CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE,
      ...overrides,
    });
  const now = new Date("2026-09-01T10:00:00.000Z");

  assert.equal(
    ciHasActiveSystemSuperAdminManagementAssignment([assignment()], now),
    true,
  );
  assert.equal(
    ciHasActiveSystemSuperAdminManagementAssignment(
      [assignment({ expiresAt: now.toISOString() })],
      now,
    ),
    false,
  );
  assert.equal(
    ciHasActiveSystemSuperAdminManagementAssignment(
      [assignment({ validFrom: "2026-09-01T11:00:00.000Z" })],
      now,
    ),
    false,
  );
  assert.equal(
    ciHasActiveSystemSuperAdminManagementAssignment(
      [assignment({ scope: { kind: "global" } })],
      now,
    ),
    false,
  );
  assert.equal(
    ciHasActiveSystemSuperAdminManagementAssignment(
      [assignment({ propagation: "descendants" })],
      now,
    ),
    false,
  );
  assert.deepEqual(
    ciResolveActiveAssignmentRoleIds(
      [
        assignment({ roleId: "admin" }),
        assignment({ roleId: "admin" }),
        assignment({
          roleId: "system-admin",
          expiresAt: now.toISOString(),
        }),
      ],
      now,
    ),
    ["admin"],
  );
});

test("redacts mutation arguments, claims, headers, and response parameters", async () => {
  const password = "Never-Echo-This-Password!";
  const event = resolverEvent({
    username: "actor",
    sub: "actor-sub",
    inputString: JSON.stringify({ password }),
  });
  const inner = async (): Promise<CiResponse> =>
    ({
      ok: false,
      statusCode: 400,
      body: { error: "Rejected" },
      parameter: event.arguments.inputString,
      debug: { event },
    }) as CiResponse;
  const protectedHandler = ciProtectCognitoUserMutationHandler(inner);
  const response = await protectedHandler(event, {} as Context);
  const serialized = JSON.stringify(response);

  assert.equal(serialized.includes(password), false);
  assert.equal(serialized.includes("secret-token"), false);
  assert.equal(serialized.includes("actor-sub"), false);
  assert.equal(response.parameter, "[REDACTED]");
  const debug = (response as CiResponse & { debug?: { event?: unknown } })
    .debug;
  assert.equal(
    (debug?.event as CiAppSyncResolverEvent).arguments.inputString,
    "[REDACTED]",
  );
});
