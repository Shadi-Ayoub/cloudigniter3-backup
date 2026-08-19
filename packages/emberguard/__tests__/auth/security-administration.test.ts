import assert from "node:assert/strict";
import test from "node:test";

import {
  ciCreateAppAccessControl,
  ciBuildSecurityRoleCounters,
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
  let roleCounters = ciBuildSecurityRoleCounters(definition, assignments);
  const repository: CiSecurityAdministrationRepository = {
    async getAccessControlDefinition() {
      return definition;
    },
    async saveAccessControlDefinition(next) {
      definition = next;
      roleCounters = ciBuildSecurityRoleCounters(definition, assignments);
    },
    async getRoleCounters() {
      return roleCounters;
    },
    async listRoleAssignments() {
      return assignments;
    },
    async putRoleAssignment(assignment) {
      assignments.push(assignment);
      roleCounters = ciBuildSecurityRoleCounters(definition, assignments);
    },
    async deleteRoleAssignment(input) {
      const index = assignments.findIndex(
        (assignment) =>
          assignment.id === input.id && assignment.subjectId === input.subjectId
      );
      if (index >= 0) assignments.splice(index, 1);
      roleCounters = ciBuildSecurityRoleCounters(definition, assignments);
    },
  };
  return {
    repository,
    getDefinition: () => definition,
    getRoleCounters: () => roleCounters,
  };
}

test("system administrators manage application policy but not core roles", async () => {
  const initial = ciCreateAppAccessControl();
  const memory = createRepository(initial);
  const administration = ciCreateSecurityAdministration({
    actor: {
      id: "system-admin",
      authenticated: true,
      roleIds: ["system-admin"],
      primaryRole: "system-admin",
    },
    definition: initial,
    repository: memory.repository,
  });

  await assert.rejects(
    administration.saveRecord({
      kind: "role",
      id: "2Application_Admin",
      title: "Invalid application administrator",
      description: "Uses an invalid stable identifier.",
      precedence: 45,
      inherits: ["user"],
      privileges: [],
      permissionCount: 0,
      directUserCount: 0,
      inheritedUserCount: 0,
      origin: "application",
      locked: false,
    }),
    /lowercase kebab case/
  );

  await administration.saveRecord({
    kind: "role",
    id: "application-auditor",
    title: "Application auditor",
    description: "Reviews application-owned resources.",
    precedence: 45,
    inherits: ["user"],
    privileges: [],
    permissionCount: 0,
    directUserCount: 0,
    inheritedUserCount: 0,
    origin: "application",
    locked: false,
  });
  assert.equal(
    memory
      .getDefinition()
      .roles.some((role) => role.id === "application-auditor"),
    true
  );

  await assert.rejects(
    administration.saveRecord({
      kind: "permission",
      id: "Approve Invoices",
      title: "Approve invoices",
      description: "Uses an invalid stable identifier.",
      roleId: "application-auditor",
      effect: "allow",
      resource: "platform.dashboard",
      action: "read",
      scopeKinds: ["tenant"],
      sensitive: false,
      origin: "application",
      locked: false,
    }),
    /lowercase kebab case/
  );

  await administration.saveRecord({
    kind: "permission",
    id: "view-application-dashboard",
    title: "View application dashboard",
    description: "Allows the application dashboard to be viewed.",
    roleId: "application-auditor",
    effect: "allow",
    resource: "platform.dashboard",
    action: "read",
    scopeKinds: ["tenant"],
    sensitive: false,
    origin: "application",
    locked: false,
  });
  const savedPrivilege = memory
    .getDefinition()
    .roles.find((role) => role.id === "application-auditor")
    ?.privileges.find(
      (privilege) => privilege.id === "view-application-dashboard"
    );
  assert.equal(savedPrivilege?.title, "View application dashboard");
  assert.equal(
    administration
      .buildRecords(memory.getDefinition(), [], memory.getRoleCounters())
      .permission.find((permission) => permission.id === savedPrivilege?.id)
      ?.title,
    "View application dashboard"
  );
  const applicationRole = administration
    .buildRecords(memory.getDefinition(), [], memory.getRoleCounters())
    .role.find((role) => role.id === "application-auditor");
  assert.ok(applicationRole);
  assert.equal(applicationRole.privileges.length, 1);

  await administration.saveRecord({
    ...applicationRole,
    privileges: [],
    permissionCount: 0,
  });
  assert.deepEqual(
    memory
      .getDefinition()
      .roles.find((role) => role.id === "application-auditor")?.privileges,
    []
  );

  await administration.saveRecord({
    ...applicationRole,
    privileges: [savedPrivilege!],
    permissionCount: 1,
  });
  assert.equal(
    memory
      .getDefinition()
      .roles.find((role) => role.id === "application-auditor")?.privileges[0]
      ?.title,
    "View application dashboard"
  );
  await assert.rejects(
    administration.saveRecord({
      ...administration
        .buildRecords(memory.getDefinition(), [], memory.getRoleCounters())
        .permission.find((permission) => permission.id === savedPrivilege?.id)!,
      title: " ",
    }),
    /display name/
  );

  const coreOverrideAccess = memory
    .getDefinition()
    .roles.find((role) => role.id === "system-super-admin")
    ?.privileges.find((privilege) => privilege.id === "override-core-access-control");
  assert.ok(coreOverrideAccess);
  await assert.rejects(
    administration.saveRecord({
      ...applicationRole,
      privileges: [coreOverrideAccess],
      permissionCount: 1,
    }),
    /Only system-super-admin/
  );

  const coreRole = administration
    .buildRecords(memory.getDefinition(), [], memory.getRoleCounters())
    .role.find((role) => role.id === "system-admin");
  assert.ok(coreRole);
  await assert.rejects(
    administration.saveRecord({ ...coreRole, title: "Changed system role" }),
    /Only a system super administrator/
  );
});

test("builds stable unique-user counters from stored assignment relationships", () => {
  const definition = ciCreateAppAccessControl({
    roles: [
      {
        id: "department-reviewer",
        title: "Department reviewer",
        precedence: 40,
        inherits: ["user"],
        privileges: [],
      },
      {
        id: "department-manager",
        title: "Department manager",
        precedence: 30,
        inherits: ["department-reviewer"],
        privileges: [],
      },
      {
        id: "paused-reviewer",
        title: "Paused reviewer",
        precedence: 50,
        inherits: ["user"],
        privileges: [],
        status: "suspended",
        statusChange: {
          changedAt: "2026-08-13T10:00:00.000Z",
          changedBy: "system-admin",
          reason: "Temporary access review.",
        },
      },
    ],
  });
  const memory = createRepository(definition);
  const administration = ciCreateSecurityAdministration({
    actor: {
      id: "system-admin",
      authenticated: true,
      roleIds: ["system-admin"],
      primaryRole: "system-admin",
    },
    definition,
    repository: memory.repository,
    clock: () => new Date("2026-08-13T12:00:00.000Z"),
  });
  const assignments: CiSecurityStoredRoleAssignment[] = [
    {
      id: "assignment-1",
      subjectId: "alice",
      roleId: "user",
      scope: { kind: "tenant", tenantId: "tenant-1" },
      propagation: "exact",
    },
    {
      id: "assignment-2",
      subjectId: "alice",
      roleId: "department-manager",
      scope: { kind: "tenant", tenantId: "tenant-1" },
      propagation: "exact",
    },
    {
      id: "assignment-3",
      subjectId: "bob",
      roleId: "department-reviewer",
      scope: { kind: "tenant", tenantId: "tenant-1" },
      propagation: "exact",
    },
    {
      id: "assignment-4",
      subjectId: "bob",
      roleId: "department-reviewer",
      scope: { kind: "tenant", tenantId: "tenant-2" },
      propagation: "exact",
    },
    {
      id: "assignment-5",
      subjectId: "carol",
      roleId: "department-manager",
      scope: { kind: "tenant", tenantId: "tenant-1" },
      propagation: "descendants",
    },
    {
      id: "assignment-expired",
      subjectId: "dave",
      roleId: "department-manager",
      scope: { kind: "tenant", tenantId: "tenant-1" },
      propagation: "exact",
      expiresAt: "2026-08-13T11:59:59.000Z",
    },
    {
      id: "assignment-future",
      subjectId: "erin",
      roleId: "department-manager",
      scope: { kind: "tenant", tenantId: "tenant-1" },
      propagation: "exact",
      validFrom: "2026-08-13T12:00:01.000Z",
    },
    {
      id: "assignment-suspended",
      subjectId: "frank",
      roleId: "paused-reviewer",
      scope: { kind: "tenant", tenantId: "tenant-1" },
      propagation: "exact",
    },
    {
      id: "assignment-unknown",
      subjectId: "grace",
      roleId: "unknown-role",
      scope: { kind: "tenant", tenantId: "tenant-1" },
      propagation: "exact",
    },
  ];

  const roles = administration.buildRecords(
    definition,
    assignments,
    ciBuildSecurityRoleCounters(definition, assignments)
  ).role;
  const user = roles.find((role) => role.id === "user");
  const reviewer = roles.find((role) => role.id === "department-reviewer");
  const manager = roles.find((role) => role.id === "department-manager");
  const pausedReviewer = roles.find((role) => role.id === "paused-reviewer");

  assert.deepEqual([user?.directUserCount, user?.inheritedUserCount], [1, 4]);
  assert.deepEqual(
    [reviewer?.directUserCount, reviewer?.inheritedUserCount],
    [1, 4]
  );
  assert.deepEqual(
    [manager?.directUserCount, manager?.inheritedUserCount],
    [4, 0]
  );
  assert.deepEqual(
    [pausedReviewer?.directUserCount, pausedReviewer?.inheritedUserCount],
    [1, 0]
  );

  const withoutManager = {
    ...definition,
    roles: definition.roles.filter((role) => role.id !== "department-manager"),
  };
  assert.equal(
    ciBuildSecurityRoleCounters(withoutManager, assignments)[
      "department-reviewer"
    ]?.inheritedUserCount,
    0
  );

  const detachedManager = {
    ...definition,
    roles: definition.roles.map((role) =>
      role.id === "department-manager" ? { ...role, inherits: [] } : role
    ),
  };
  assert.equal(
    ciBuildSecurityRoleCounters(detachedManager, assignments)[
      "department-reviewer"
    ]?.inheritedUserCount,
    0
  );
});

test("suspends and restores application roles with transition metadata", async () => {
  const initial = ciCreateAppAccessControl({
    roles: [
      {
        id: "application-auditor",
        title: "Application auditor",
        precedence: 45,
        inherits: ["user"],
        privileges: [],
      },
    ],
  });
  const memory = createRepository(initial);
  const administration = ciCreateSecurityAdministration({
    actor: {
      id: "incident-commander",
      authenticated: true,
      roleIds: ["system-admin"],
      primaryRole: "system-admin",
    },
    definition: initial,
    repository: memory.repository,
    clock: () => new Date("2026-08-12T08:00:00.000Z"),
  });

  await assert.rejects(
    administration.setRoleStatus({
      roleId: "application-auditor",
      status: "suspended",
      reason: " ",
    }),
    /reason is required/
  );

  await administration.setRoleStatus({
    roleId: "application-auditor",
    status: "suspended",
    reason: "Investigating a suspected credential compromise.",
  });
  const suspended = memory
    .getDefinition()
    .roles.find((role) => role.id === "application-auditor");
  assert.equal(suspended?.status, "suspended");
  assert.deepEqual(suspended?.statusChange, {
    changedAt: "2026-08-12T08:00:00.000Z",
    changedBy: "incident-commander",
    reason: "Investigating a suspected credential compromise.",
  });
  assert.equal(
    administration
      .buildRecords(memory.getDefinition(), [], memory.getRoleCounters())
      .role.find((role) => role.id === "application-auditor")?.status,
    "suspended"
  );

  await administration.setRoleStatus({
    roleId: "application-auditor",
    status: "active",
    reason: "Investigation completed and access approved.",
  });
  assert.equal(
    memory
      .getDefinition()
      .roles.find((role) => role.id === "application-auditor")?.status,
    "active"
  );
});

test("creates, sorts, suspends, and restores resource domains", async () => {
  const initial = ciCreateAppAccessControl();
  const memory = createRepository(initial);
  const administration = ciCreateSecurityAdministration({
    actor: {
      id: "incident-commander",
      authenticated: true,
      roleIds: ["system-admin"],
      primaryRole: "system-admin",
    },
    definition: initial,
    repository: memory.repository,
    clock: () => new Date("2026-08-18T09:30:00.000Z"),
  });

  await assert.rejects(
    administration.createResourceDomain({
      id: "2Billing_Operations",
      title: "Billing operations",
    }),
    /lowercase kebab case/
  );

  await administration.createResourceDomain({
    id: "billing-operations",
    title: "Accounting",
    description: "Billing and invoice resources.",
  });
  const created = memory
    .getDefinition()
    .domains.find((domain) => domain.id === "billing-operations");
  assert.deepEqual(created, {
    id: "billing-operations",
    title: "Accounting",
    description: "Billing and invoice resources.",
    status: "active",
  });
  assert.equal(
    administration.buildResourceDomains(memory.getDefinition())[0]?.id,
    "billing-operations"
  );

  await administration.setResourceDomainStatus({
    domainId: "billing-operations",
    status: "suspended",
    reason: "Pause authorization while billing controls are reviewed.",
  });
  const suspended = memory
    .getDefinition()
    .domains.find((domain) => domain.id === "billing-operations");
  assert.equal(suspended?.status, "suspended");
  assert.deepEqual(suspended?.statusChange, {
    changedAt: "2026-08-18T09:30:00.000Z",
    changedBy: "incident-commander",
    reason: "Pause authorization while billing controls are reviewed.",
  });

  await assert.rejects(
    administration.saveRecord({
      kind: "resource",
      id: "billing.invoices",
      title: "Invoices",
      status: "active",
      domainId: "billing-operations",
      actions: ["read"],
      scopeKinds: ["tenant"],
      sensitiveActionCount: 0,
      origin: "application",
      locked: false,
    }),
    /suspended and cannot accept new resources/
  );

  await administration.setResourceDomainStatus({
    domainId: "billing-operations",
    status: "active",
    reason: "Billing controls were approved.",
  });
  assert.equal(
    memory
      .getDefinition()
      .domains.find((domain) => domain.id === "billing-operations")?.status,
    "active"
  );

  await administration.saveRecord({
    kind: "resource",
    id: "billing.invoices",
    title: "Invoices",
    status: "active",
    domainId: "billing-operations",
    actions: ["read", "approve"],
    scopeKinds: ["tenant"],
    sensitiveActionCount: 0,
    origin: "application",
    locked: false,
  });
  await administration.setResourceStatus({
    resourceId: "billing.invoices",
    status: "suspended",
    reason: "Contain invoice authorization during the review.",
  });
  const suspendedResource = memory
    .getDefinition()
    .resources.find((resource) => resource.id === "billing.invoices");
  assert.equal(suspendedResource?.status, "suspended");
  assert.deepEqual(suspendedResource?.statusChange, {
    changedAt: "2026-08-18T09:30:00.000Z",
    changedBy: "incident-commander",
    reason: "Contain invoice authorization during the review.",
  });
  assert.deepEqual(
    suspendedResource?.actions.map((action) => action.id),
    ["read", "approve"]
  );

  await administration.setResourceStatus({
    resourceId: "billing.invoices",
    status: "active",
    reason: "Invoice authorization controls were approved.",
  });
  assert.equal(
    memory
      .getDefinition()
      .resources.find((resource) => resource.id === "billing.invoices")?.status,
    "active"
  );

  const restoredResourceRecord = administration
    .buildRecords(memory.getDefinition(), [], memory.getRoleCounters())
    .resource.find((record) => record.id === "billing.invoices");
  assert.ok(restoredResourceRecord);
  await administration.saveRecord(
    { ...restoredResourceRecord, status: "suspended" },
    "Exercise the generic-save lifecycle delegation."
  );
  assert.deepEqual(
    memory
      .getDefinition()
      .resources.find((resource) => resource.id === "billing.invoices")
      ?.statusChange,
    {
      changedAt: "2026-08-18T09:30:00.000Z",
      changedBy: "incident-commander",
      reason: "Exercise the generic-save lifecycle delegation.",
    }
  );
});

test("protects core and break-glass roles from unsafe suspension", async () => {
  const initial = ciCreateAppAccessControl();
  const memory = createRepository(initial);
  const systemAdmin = ciCreateSecurityAdministration({
    actor: {
      id: "system-admin",
      authenticated: true,
      roleIds: ["system-admin"],
      primaryRole: "system-admin",
    },
    definition: initial,
    repository: memory.repository,
  });
  await assert.rejects(
    systemAdmin.setRoleStatus({
      roleId: "user",
      status: "suspended",
      reason: "Incident response.",
    }),
    /system super administrator/
  );

  const superAdmin = ciCreateSecurityAdministration({
    actor: {
      id: "break-glass-operator",
      authenticated: true,
      roleIds: ["system-super-admin"],
      primaryRole: "system-super-admin",
    },
    definition: initial,
    repository: memory.repository,
  });
  await assert.rejects(
    superAdmin.setRoleStatus({
      roleId: "system-super-admin",
      status: "suspended",
      reason: "Unsafe test.",
    }),
    /break-glass role cannot be suspended/
  );
  await assert.rejects(
    superAdmin.setResourceStatus({
      resourceId: "platform.authorization",
      status: "suspended",
      reason: "Unsafe test.",
    }),
    /recovery resources cannot be suspended/
  );
});

test("rechecks mutation authority against the persisted role status", async () => {
  const configured = ciCreateAppAccessControl({
    roles: [
      {
        id: "application-auditor",
        title: "Application auditor",
        precedence: 45,
        privileges: [],
      },
    ],
  });
  const persisted: CiAccessControlDefinition = {
    ...configured,
    roles: configured.roles.map((role) =>
      role.id === "system-admin"
        ? {
            ...role,
            status: "suspended" as const,
            statusChange: {
              changedAt: "2026-08-12T08:00:00.000Z",
              changedBy: "incident-commander",
              reason: "Administrative account investigation.",
            },
          }
        : role
    ),
  };
  const memory = createRepository(persisted);
  const administration = ciCreateSecurityAdministration({
    actor: {
      id: "suspended-admin",
      authenticated: true,
      roleIds: ["system-admin"],
      primaryRole: "system-admin",
    },
    definition: configured,
    repository: memory.repository,
  });

  await assert.rejects(
    administration.setRoleStatus({
      roleId: "application-auditor",
      status: "suspended",
      reason: "Unauthorized follow-up.",
    }),
    /cannot manage application access control/
  );
});

test("identity-group drift compares the relative order of mapped groups", () => {
  const definition = ciCreateAppAccessControl();
  const memory = createRepository(definition);
  const administration = ciCreateSecurityAdministration({
    actor: {
      id: "super-admin",
      authenticated: true,
      roleIds: ["system-super-admin"],
      primaryRole: "system-super-admin",
    },
    definition,
    repository: memory.repository,
    identityGroups: [
      { id: "UNRELATED_PROVIDER_GROUP", provider: "AWS", precedence: 0 },
      { id: "system-super-admin", provider: "AWS", precedence: 1 },
      { id: "system-admin", provider: "AWS", precedence: 2 },
    ],
  });

  const groups = administration.buildRecords(
    definition,
    [],
    ciBuildSecurityRoleCounters(definition, [])
  )["identity-group"];
  assert.equal(groups[0]?.status, "unmapped");
  assert.equal(groups[1]?.status, "mapped");
  assert.equal(groups[2]?.status, "mapped");
});

test("migrates missing titles from legacy persisted privileges on read", async () => {
  const configured = ciCreateAppAccessControl();
  const legacy = structuredClone(configured);
  const legacyPrivilege = legacy.roles[0]?.privileges[0] as
    | { id: string; title?: string }
    | undefined;
  assert.ok(legacyPrivilege);
  delete legacyPrivilege.title;

  const memory = createRepository(legacy);
  const administration = ciCreateSecurityAdministration({
    actor: {
      id: "system-admin",
      authenticated: true,
      roleIds: ["system-admin"],
      primaryRole: "system-admin",
    },
    definition: configured,
    repository: memory.repository,
  });

  const migrated = await administration.loadDefinition();

  assert.equal(
    migrated.roles[0]?.privileges[0]?.title,
    "View application dashboard"
  );
  assert.equal(legacyPrivilege.title, undefined);
});
