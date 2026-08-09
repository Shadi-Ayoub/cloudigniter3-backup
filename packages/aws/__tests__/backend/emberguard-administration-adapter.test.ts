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
  const repository = ciCreateAwsEmberguardAdministrationRepository({
    async getDefinition() {
      return response({
        definition: { domains: [], resources: [], roles: [] },
      });
    },
    async saveDefinition(inputString) {
      calls.push(inputString);
      return response({});
    },
    async listRoleAssignments() {
      return response({ assignments: [] });
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
  assert.deepEqual(await repository.listRoleAssignments(), []);
  await repository.saveAccessControlDefinition({
    domains: [],
    resources: [],
    roles: [],
  });
  assert.equal(calls.length, 1);
});

test("extracts provider-neutral identity groups from Amplify outputs", () => {
  assert.deepEqual(
    ciResolveAwsCognitoIdentityGroups({
      auth: {
        groups: [
          { SYSTEM_SUPER_ADMIN: { precedence: 0 } },
          { SYSTEM_ADMIN: { precedence: 1 } },
        ],
      },
    }),
    [
      { id: "SYSTEM_SUPER_ADMIN", provider: "AWS", precedence: 0 },
      { id: "SYSTEM_ADMIN", provider: "AWS", precedence: 1 },
    ]
  );
});
