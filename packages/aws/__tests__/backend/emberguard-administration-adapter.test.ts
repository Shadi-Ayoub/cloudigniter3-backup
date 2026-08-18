import assert from "node:assert/strict";
import test from "node:test";

import {
  ciCreateAwsEmberguardAdministrationRepository,
  ciResolveAwsCognitoIdentityGroups,
} from "../../src/lib/emberguard";

/** Wraps a body in the response shape returned by Amplify custom operations. */
function response(body: unknown) {
  return {
    data: JSON.stringify({ ok: true, statusCode: 200, body }),
  };
}

test("adapts Amplify operations to the EmberGuard administration repository", async () => {
  const calls: string[] = [];
  let stateReads = 0;
  const repository = ciCreateAwsEmberguardAdministrationRepository({
    async getDefinition() {
      stateReads += 1;
      return response({
        definition: { domains: [], resources: [], roles: [] },
        roleCounters: {
          user: {
            permissionCount: 1,
            directUserCount: 2,
            inheritedUserCount: 3,
          },
        },
      });
    },
    async saveDefinition(inputString) {
      calls.push(inputString);
      return response({});
    },
    async listRoleAssignments() {
      return response({
        assignments: [
          {
            id: "assignment-1",
            subjectId: "user-1",
            roleId: "system-admin",
            scope: { kind: "system" },
            propagation: "exact",
          },
        ],
      });
    },
    async putRoleAssignment(inputString) {
      calls.push(inputString);
      return response({});
    },
    async deleteRoleAssignment(inputString) {
      calls.push(inputString);
      return response({});
    },
  });

  assert.deepEqual(await repository.getAccessControlDefinition(), {
    domains: [],
    resources: [],
    roles: [],
  });
  assert.deepEqual(await repository.getRoleCounters(), {
    user: {
      permissionCount: 1,
      directUserCount: 2,
      inheritedUserCount: 3,
    },
  });
  assert.equal(stateReads, 1);
  assert.equal(
    (await repository.listRoleAssignments())[0]?.roleId,
    "system-admin"
  );
  await repository.saveAccessControlDefinition({
    domains: [],
    resources: [],
    roles: [
      {
        id: "incident-role",
        title: "Incident role",
        precedence: 100,
        privileges: [],
        status: "suspended",
        statusChange: {
          changedAt: "2026-08-12T08:00:00.000Z",
          changedBy: "incident-commander",
          reason: "Investigating suspected compromise.",
        },
      },
    ],
  });
  await repository.putRoleAssignment({
    id: "assignment-2",
    subjectId: "user-2",
    roleId: "super-admin",
    scope: { kind: "system" },
    propagation: "exact",
  });
  assert.equal(calls.length, 2);
  assert.match(calls[0] ?? "", /suspended/);
  assert.match(calls[0] ?? "", /incident-commander/);
  assert.match(calls[1] ?? "", /super-admin/);
});

test("rejects non-canonical role assignment identifiers", async () => {
  const repository = ciCreateAwsEmberguardAdministrationRepository({
    async getDefinition() {
      return response({
        definition: { domains: [], resources: [], roles: [] },
      });
    },
    async saveDefinition() {
      return response({});
    },
    async listRoleAssignments() {
      return response({
        assignments: [
          {
            id: "assignment-1",
            subjectId: "user-1",
            roleId: "SYSTEM_ADMIN",
            scope: { kind: "system" },
            propagation: "exact",
          },
        ],
      });
    },
    async putRoleAssignment() {
      return response({});
    },
    async deleteRoleAssignment() {
      return response({});
    },
  });

  await assert.rejects(
    repository.listRoleAssignments(),
    /invalid role assignments/
  );
  await assert.rejects(
    repository.putRoleAssignment({
      id: "assignment-2",
      subjectId: "user-2",
      roleId: "SUPER_ADMIN",
      scope: { kind: "system" },
      propagation: "exact",
    }),
    /lowercase kebab case/
  );
});

test("extracts provider-neutral identity groups from Amplify outputs", () => {
  assert.deepEqual(
    ciResolveAwsCognitoIdentityGroups({
      auth: {
        groups: [
          { "system-super-admin": { precedence: 0 } },
          { "system-admin": { precedence: 1 } },
        ],
      },
    }),
    [
      { id: "system-super-admin", provider: "AWS", precedence: 0 },
      { id: "system-admin", provider: "AWS", precedence: 1 },
    ]
  );
});

test("migrates privilege titles missing from legacy persisted definitions", async () => {
  const repository = ciCreateAwsEmberguardAdministrationRepository({
    async getDefinition() {
      return response({
        definition: {
          domains: [{ id: "identity", title: "Identity" }],
          resources: [
            {
              id: "identity.users",
              domainId: "identity",
              title: "Users",
              actions: [{ id: "read", title: "Read users" }],
              scopeKinds: ["tenant"],
            },
          ],
          roles: [
            {
              id: "user",
              title: "Viewer",
              precedence: 50,
              privileges: [
                {
                  id: "read-users",
                  effect: "allow",
                  resource: "identity.users",
                  action: "read",
                  scopeKinds: ["tenant"],
                },
              ],
            },
          ],
        },
      });
    },
    async saveDefinition() {
      return response({});
    },
    async listRoleAssignments() {
      return response({ assignments: [] });
    },
    async putRoleAssignment() {
      return response({});
    },
    async deleteRoleAssignment() {
      return response({});
    },
  });

  const definition = await repository.getAccessControlDefinition();

  assert.equal(definition?.roles[0]?.id, "user");
  assert.equal(definition?.roles[0]?.privileges[0]?.title, "Read users");
});

test("rejects explicitly blank privilege titles instead of migrating them", async () => {
  let saveCalls = 0;
  const repository = ciCreateAwsEmberguardAdministrationRepository({
    async getDefinition() {
      return response({
        definition: { domains: [], resources: [], roles: [] },
      });
    },
    async saveDefinition() {
      saveCalls += 1;
      return response({});
    },
    async listRoleAssignments() {
      return response({ assignments: [] });
    },
    async putRoleAssignment() {
      return response({});
    },
    async deleteRoleAssignment() {
      return response({});
    },
  });

  await assert.rejects(
    repository.saveAccessControlDefinition({
      domains: [{ id: "identity", title: "Identity" }],
      resources: [
        {
          id: "identity.users",
          domainId: "identity",
          title: "Users",
          actions: [{ id: "read", title: "Read users" }],
          scopeKinds: ["tenant"],
        },
      ],
      roles: [
        {
          id: "viewer",
          title: "Viewer",
          precedence: 50,
          privileges: [
            {
              id: "read-users",
              title: " ",
              effect: "allow",
              resource: "identity.users",
              action: "read",
              scopeKinds: ["tenant"],
            },
          ],
        },
      ],
    }),
    /human-readable title/
  );
  assert.equal(saveCalls, 0);
});
