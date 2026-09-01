import assert from "node:assert/strict";
import test from "node:test";

import {
  CI_ROOT_USER_IDENTITY_GROUP,
  CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE,
} from "@cloudigniter/core/lib";
import type { CiResponse } from "@cloudigniter/core/types";
import { Emberguard } from "@cloudigniter/emberguard";

import {
  ciDeleteEmberguardRoleAssignmentHandler,
  ciPutEmberguardRoleAssignmentHandler,
} from "../../src/server/backend/handlers/emberguard-handlers/ci-emberguard-access-handlers";
import type { CiAppSyncResolverEvent } from "../../src/types";

type StoredRoleAssignment = Parameters<Emberguard["putRoleAssignment"]>[0];

const managerAssignment: StoredRoleAssignment = {
  id: "manager-assignment",
  subjectId: "administrator-1",
  roleId: CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE,
  scope: { kind: "system" },
  propagation: "exact",
};

function resolverEvent(
  input: Record<string, unknown>,
  groups: readonly string[],
): CiAppSyncResolverEvent {
  return {
    arguments: { inputString: JSON.stringify(input) },
    identity: { claims: { "cognito:groups": groups } },
  } as unknown as CiAppSyncResolverEvent;
}

async function invokeWithAccessTable(
  invoke: () => Promise<CiResponse>,
): Promise<CiResponse> {
  const key = "CI_EMBERGUARD_ACCESS_TABLE";
  const previous = process.env[key];
  process.env[key] = "EmberguardAccess";
  try {
    return await invoke();
  } finally {
    if (previous === undefined) delete process.env[key];
    else process.env[key] = previous;
  }
}

function responseErrorMessage(response: CiResponse): string | undefined {
  if (response.ok) return undefined;
  const details = response.body.details;
  return details && typeof details === "object" && "message" in details
    ? String(details.message)
    : undefined;
}

test("requires the Root User group to grant the manager assignment", async () => {
  const response = await invokeWithAccessTable(() =>
    ciPutEmberguardRoleAssignmentHandler(
      resolverEvent({ assignment: managerAssignment }, ["system-super-admin"]),
    ),
  );

  assert.equal(response.ok, false);
  assert.equal(
    responseErrorMessage(response),
    "Only the Root User can grant the system-super-admin-manager role.",
  );
});

test("requires exact system scope for the manager assignment", async () => {
  for (const assignment of [
    {
      ...managerAssignment,
      scope: { kind: "global" as const },
    },
    {
      ...managerAssignment,
      propagation: "descendants" as const,
    },
  ]) {
    const response = await invokeWithAccessTable(() =>
      ciPutEmberguardRoleAssignmentHandler(
        resolverEvent({ assignment }, [
          CI_ROOT_USER_IDENTITY_GROUP,
          "system-super-admin",
        ]),
      ),
    );

    assert.equal(response.ok, false);
    assert.equal(
      responseErrorMessage(response),
      "The system-super-admin-manager role requires exact system scope.",
    );
  }
});

test("allows the Root User to grant the manager at exact system scope", async () => {
  const original = Emberguard.prototype.putRoleAssignment;
  let written: StoredRoleAssignment | undefined;
  Emberguard.prototype.putRoleAssignment = async (assignment) => {
    written = assignment;
  };

  try {
    const response = await invokeWithAccessTable(() =>
      ciPutEmberguardRoleAssignmentHandler(
        resolverEvent({ assignment: managerAssignment }, [
          CI_ROOT_USER_IDENTITY_GROUP,
          "system-super-admin",
        ]),
      ),
    );

    assert.equal(response.ok, true);
    assert.deepEqual(written, managerAssignment);
  } finally {
    Emberguard.prototype.putRoleAssignment = original;
  }
});

test("requires the Root User group to revoke the manager assignment", async () => {
  const originalList = Emberguard.prototype.listRoleAssignments;
  const originalDelete = Emberguard.prototype.deleteRoleAssignment;
  let deleted = false;
  Emberguard.prototype.listRoleAssignments = async () => [managerAssignment];
  Emberguard.prototype.deleteRoleAssignment = async () => {
    deleted = true;
  };

  try {
    const response = await invokeWithAccessTable(() =>
      ciDeleteEmberguardRoleAssignmentHandler(
        resolverEvent(
          {
            id: managerAssignment.id,
            subjectId: managerAssignment.subjectId,
          },
          ["system-super-admin"],
        ),
      ),
    );

    assert.equal(response.ok, false);
    assert.equal(
      responseErrorMessage(response),
      "Only the Root User can revoke the system-super-admin-manager role.",
    );
    assert.equal(deleted, false);
  } finally {
    Emberguard.prototype.listRoleAssignments = originalList;
    Emberguard.prototype.deleteRoleAssignment = originalDelete;
  }
});

test("allows the Root User to revoke the manager assignment", async () => {
  const originalList = Emberguard.prototype.listRoleAssignments;
  const originalDelete = Emberguard.prototype.deleteRoleAssignment;
  let deletedInput: { id: string; subjectId: string } | undefined;
  Emberguard.prototype.listRoleAssignments = async () => [managerAssignment];
  Emberguard.prototype.deleteRoleAssignment = async (input) => {
    deletedInput = input;
  };

  try {
    const response = await invokeWithAccessTable(() =>
      ciDeleteEmberguardRoleAssignmentHandler(
        resolverEvent(
          {
            id: managerAssignment.id,
            subjectId: managerAssignment.subjectId,
          },
          [CI_ROOT_USER_IDENTITY_GROUP, "system-super-admin"],
        ),
      ),
    );

    assert.equal(response.ok, true);
    assert.deepEqual(deletedInput, {
      id: managerAssignment.id,
      subjectId: managerAssignment.subjectId,
    });
  } finally {
    Emberguard.prototype.listRoleAssignments = originalList;
    Emberguard.prototype.deleteRoleAssignment = originalDelete;
  }
});

test("preserves system-super-admin grant and revoke protections", async () => {
  const systemSuperAssignment: StoredRoleAssignment = {
    ...managerAssignment,
    id: "system-super-assignment",
    roleId: "system-super-admin",
  };

  const grantResponse = await invokeWithAccessTable(() =>
    ciPutEmberguardRoleAssignmentHandler(
      resolverEvent({ assignment: systemSuperAssignment }, [
        CI_ROOT_USER_IDENTITY_GROUP,
      ]),
    ),
  );
  assert.equal(
    responseErrorMessage(grantResponse),
    "Only system-super-admin can grant the system-super-admin role.",
  );

  const originalList = Emberguard.prototype.listRoleAssignments;
  Emberguard.prototype.listRoleAssignments = async () => [
    systemSuperAssignment,
  ];
  try {
    const revokeResponse = await invokeWithAccessTable(() =>
      ciDeleteEmberguardRoleAssignmentHandler(
        resolverEvent(
          {
            id: systemSuperAssignment.id,
            subjectId: systemSuperAssignment.subjectId,
          },
          [CI_ROOT_USER_IDENTITY_GROUP],
        ),
      ),
    );
    assert.equal(
      responseErrorMessage(revokeResponse),
      "Only system-super-admin can revoke the system-super-admin role.",
    );
  } finally {
    Emberguard.prototype.listRoleAssignments = originalList;
  }
});
