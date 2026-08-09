import assert from "node:assert/strict";
import test from "node:test";

import {
  ciCreateAppAccessControl,
  ciCreateSecurityAdministration,
} from "@ci-emberguard/lib";
import type {
  CiAccessControlDefinition,
  CiSecurityAdministrationRepository,
  CiSecurityStoredRoleAssignment,
} from "@ci-emberguard/types";

/** Creates an in-memory repository for administration behavior tests. */
function createRepository(initial: CiAccessControlDefinition) {
  let definition = initial;
  const assignments: CiSecurityStoredRoleAssignment[] = [];
  const repository: CiSecurityAdministrationRepository = {
    async getAccessControlDefinition() {
      return definition;
    },
    async saveAccessControlDefinition(next) {
      definition = next;
    },
    async listRoleAssignments() {
      return assignments;
    },
    async putRoleAssignment(assignment) {
      assignments.push(assignment);
    },
    async deleteRoleAssignment(input) {
      const index = assignments.findIndex(
        (assignment) =>
          assignment.id === input.id && assignment.subjectId === input.subjectId
      );
      if (index >= 0) assignments.splice(index, 1);
    },
  };
  return { repository, getDefinition: () => definition };
}

test("system administrators manage application policy but not core roles", async () => {
  const initial = ciCreateAppAccessControl();
  const memory = createRepository(initial);
  const administration = ciCreateSecurityAdministration({
    actor: {
      id: "system-admin",
      authenticated: true,
      roleIds: ["SYSTEM_ADMIN"],
      primaryRole: "SYSTEM_ADMIN",
    },
    definition: initial,
    repository: memory.repository,
  });

  await administration.saveRecord({
    kind: "role",
    id: "APPLICATION_AUDITOR",
    title: "Application auditor",
    description: "Reviews application-owned resources.",
    precedence: 45,
    inherits: ["USER"],
    permissionCount: 0,
    origin: "application",
    locked: false,
  });
  assert.equal(
    memory
      .getDefinition()
      .roles.some((role) => role.id === "APPLICATION_AUDITOR"),
    true
  );

  const coreRole = administration
    .buildRecords(memory.getDefinition())
    .role.find((role) => role.id === "SYSTEM_ADMIN");
  assert.ok(coreRole);
  await assert.rejects(
    administration.saveRecord({ ...coreRole, title: "Changed system role" }),
    /Only a system super administrator/
  );
});

test("identity-group drift compares the relative order of mapped groups", () => {
  const definition = ciCreateAppAccessControl();
  const memory = createRepository(definition);
  const administration = ciCreateSecurityAdministration({
    actor: {
      id: "super-admin",
      authenticated: true,
      roleIds: ["SYSTEM_SUPER_ADMIN"],
      primaryRole: "SYSTEM_SUPER_ADMIN",
    },
    definition,
    repository: memory.repository,
    identityGroups: [
      { id: "UNRELATED_PROVIDER_GROUP", provider: "AWS", precedence: 0 },
      { id: "SYSTEM_SUPER_ADMIN", provider: "AWS", precedence: 1 },
      { id: "SYSTEM_ADMIN", provider: "AWS", precedence: 2 },
    ],
  });

  const groups = administration.buildRecords(definition)["identity-group"];
  assert.equal(groups[0]?.status, "unmapped");
  assert.equal(groups[1]?.status, "mapped");
  assert.equal(groups[2]?.status, "mapped");
});
