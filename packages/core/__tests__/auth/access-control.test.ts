import assert from "node:assert/strict";
import test from "node:test";

import {
  CI_ACCESS_CONTROL_KEBAB_IDENTIFIER_PATTERN,
  CI_ADMINISTRATOR_AUTHORITY_RANKS,
  CI_ADMINISTRATOR_ROLES,
  CI_CORE_ROLES_BY_PRECEDENCE,
  CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
  CI_ROOT_USER_IDENTITY_GROUP,
  CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE,
  ciApplyCoreAccessControlOverrides,
  ciCanAll,
  ciCanAny,
  ciCanManageAdministrator,
  ciCanOverrideCoreAccessControl,
  ciCreateAppAccessControl,
  ciCreateAppAuthorizer,
  ciCreateAuthorizationSubject,
  ciCreateAuthorizer,
  ciCreateCoreAccessControlOverride,
  ciCreateCoreAccessControl,
  ciCreateRoleAssignment,
  ciCreateRoleAssignmentsFromIdentityGroups,
  ciCreateSecurityAdministration,
  ciCreateScopedPrivilege,
  ciDefineAccessControl,
  ciFormatPermission,
  ciGlobalAccessScope,
  ciGetAccessControlEntryOrigin,
  ciIsCoreAccessControlEntry,
  ciIsAdministratorRole,
  ciIsAdministratorUser,
  ciIsAccessControlKebabIdentifier,
  ciMatchesAuthorizationPattern,
  ciMatchesPermission,
  ciMergeAccessControlDefinitions,
  ciOrgUnitAccessScope,
  ciOrgUnitContextAccessScope,
  ciParsePermission,
  ciResolveIdentityGroupRoles,
  ciResolveAdministratorAuthorityRank,
  ciResolvePrimaryRole,
  ciSystemAccessScope,
  ciTenantAccessScope,
  ciValidateAccessControlDefinition,
} from "@ci-core/lib";
import type {
  CiAccessControlDefinition,
  CiAdministratorManagementSubject,
  CiAuthorizationSubject,
  CiEmberguardConfig,
  CiPrivilege,
  CiRoleDefinition,
} from "@ci-core/types";

const definition = ciDefineAccessControl({
  domains: [
    { id: "identity", title: "Identity" },
    { id: "platform", title: "Platform" },
  ],
  resources: [
    {
      id: "identity.users",
      domainId: "identity",
      title: "Users",
      actions: [
        { id: "read", title: "Read users" },
        { id: "update", title: "Update users" },
        { id: "delete", title: "Delete users", sensitive: true },
      ],
      scopeKinds: ["global", "tenant", "orgUnit"],
    },
    {
      id: "platform.settings",
      domainId: "platform",
      title: "Platform settings",
      actions: [
        { id: "read", title: "Read settings" },
        { id: "update", title: "Update settings", sensitive: true },
      ],
      scopeKinds: ["system"],
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
          title: "Read users",
          effect: "allow",
          resource: "identity.users",
          action: "read",
          scopeKinds: ["global", "tenant", "orgUnit"],
        },
      ],
    },
    {
      id: "editor",
      title: "Editor",
      precedence: 40,
      inherits: ["viewer"],
      privileges: [
        {
          id: "update-users",
          title: "Update users",
          effect: "allow",
          resource: "identity.users",
          action: "update",
          scopeKinds: ["global", "tenant", "orgUnit"],
        },
      ],
    },
    {
      id: "blocked-editor",
      title: "Blocked editor",
      precedence: 60,
      privileges: [
        {
          id: "deny-user-updates",
          title: "Deny user updates",
          effect: "deny",
          resource: "identity.users",
          action: "update",
          scopeKinds: ["global", "tenant", "orgUnit"],
        },
      ],
    },
    {
      id: "system-admin",
      title: "System administrator",
      precedence: 0,
      privileges: [
        {
          id: "all-access",
          title: "All access",
          effect: "allow",
          resource: "*",
          action: "*",
          scopeKinds: ["system", "global", "tenant", "orgUnit"],
        },
      ],
    },
  ],
} as const satisfies CiAccessControlDefinition);

test("exposes access-control kebab identifier validation through core", () => {
  assert.equal(
    CI_ACCESS_CONTROL_KEBAB_IDENTIFIER_PATTERN,
    "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$",
  );
  assert.equal(ciIsAccessControlKebabIdentifier("invoice-approver"), true);
  assert.equal(ciIsAccessControlKebabIdentifier("2_invoice approver"), false);
});

test("exposes lowercase kebab IDs for every core role", () => {
  assert.deepEqual(CI_CORE_ROLES_BY_PRECEDENCE, [
    "system-super-admin",
    "system-admin",
    "super-admin",
    "admin",
    "developer",
    "user",
  ]);
  assert.equal(ciResolvePrimaryRole(["user", "admin"]), "admin");
  assert.equal(ciResolvePrimaryRole(["ADMIN"]), null);
  assert.throws(
    () => ciCreateRoleAssignment("ADMIN", ciSystemAccessScope(), "exact"),
    /lowercase kebab case/,
  );
});

/** Creates a provider-neutral subject for administrator policy tests. */
function administratorSubject(
  id: string,
  effectiveRoleIds: readonly string[],
  isRootUser = false,
  canManageSystemSuperAdmins = false,
): CiAdministratorManagementSubject {
  return {
    id,
    effectiveRoleIds,
    isRootUser,
    canManageSystemSuperAdmins,
  };
}

test("defines administrator authority independently from role precedence", () => {
  assert.deepEqual(CI_ADMINISTRATOR_ROLES, [
    "admin",
    "super-admin",
    "system-admin",
    "system-super-admin",
  ]);
  assert.deepEqual(CI_ADMINISTRATOR_AUTHORITY_RANKS, {
    admin: 1,
    "super-admin": 2,
    "system-admin": 3,
    "system-super-admin": 4,
  });
  assert.equal(CI_ROOT_USER_IDENTITY_GROUP, "cloudigniter-root-user");
  assert.equal(
    CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE,
    "system-super-admin-manager",
  );
  assert.equal(
    CI_CORE_ROLES_BY_PRECEDENCE.map(String).includes(
      CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE,
    ),
    false,
  );

  assert.equal(ciIsAdministratorRole("admin"), true);
  assert.equal(ciIsAdministratorRole("ADMIN"), false);
  assert.equal(
    ciIsAdministratorRole(CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE),
    false,
  );
  assert.equal(
    ciIsAdministratorUser(administratorSubject("admin-1", ["admin"])),
    true,
  );
  assert.equal(
    ciIsAdministratorUser(
      administratorSubject("delegate-1", [CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE]),
    ),
    false,
  );
  assert.equal(
    ciIsAdministratorUser(administratorSubject("root-1", [], true)),
    true,
  );
  assert.equal(
    ciResolveAdministratorAuthorityRank([
      "user",
      "admin",
      "system-admin",
      CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE,
    ]),
    3,
  );
  assert.equal(ciResolveAdministratorAuthorityRank(["user"]), null);
});

test("enforces the administrator target-authority matrix", () => {
  for (const [actorIndex, actorRole] of CI_ADMINISTRATOR_ROLES.entries()) {
    for (const [targetIndex, targetRole] of CI_ADMINISTRATOR_ROLES.entries()) {
      assert.equal(
        ciCanManageAdministrator({
          actor: administratorSubject(`actor-${actorRole}`, [actorRole]),
          target: administratorSubject(`target-${targetRole}`, [targetRole]),
          operation: "account-management",
        }),
        actorIndex >= targetIndex,
        `${actorRole} managing ${targetRole}`,
      );
    }
  }

  assert.equal(
    ciCanManageAdministrator({
      actor: administratorSubject("admin-1", ["admin"]),
      target: administratorSubject("user-1", ["user"]),
      operation: "account-management",
    }),
    false,
  );
});

test("protects Root and applies only the explicit system-super delegation", () => {
  const root = administratorSubject("root-1", [], true);
  const otherRoot = administratorSubject(
    "root-2",
    ["system-super-admin"],
    true,
  );
  const systemSuperAdmin = administratorSubject("system-super-1", [
    "system-super-admin",
  ]);
  const delegatedAdmin = administratorSubject(
    "admin-1",
    ["admin", CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE],
    false,
    true,
  );
  const unvalidatedIdentityGroupAdmin = administratorSubject("admin-2", [
    "admin",
    CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE,
  ]);

  assert.equal(
    ciCanManageAdministrator({
      actor: root,
      target: systemSuperAdmin,
      operation: "account-management",
    }),
    true,
  );
  assert.equal(
    ciCanManageAdministrator({
      actor: root,
      target: root,
      operation: "profile-edit",
    }),
    true,
  );
  assert.equal(
    ciCanManageAdministrator({
      actor: root,
      target: root,
      operation: "account-management",
    }),
    false,
  );
  assert.equal(
    ciCanManageAdministrator({
      actor: root,
      target: otherRoot,
      operation: "profile-edit",
    }),
    false,
  );
  assert.equal(
    ciCanManageAdministrator({
      actor: delegatedAdmin,
      target: systemSuperAdmin,
      operation: "account-management",
    }),
    true,
  );
  assert.equal(
    ciCanManageAdministrator({
      actor: unvalidatedIdentityGroupAdmin,
      target: systemSuperAdmin,
      operation: "account-management",
    }),
    false,
  );
  assert.equal(
    ciCanManageAdministrator({
      actor: delegatedAdmin,
      target: root,
      operation: "profile-edit",
    }),
    false,
  );
  assert.equal(
    ciCanManageAdministrator({
      actor: administratorSubject(
        "delegate-only",
        [CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE],
        false,
        true,
      ),
      target: systemSuperAdmin,
      operation: "account-management",
    }),
    false,
  );
});

test("rejects non-kebab role and privilege IDs through the core validator", () => {
  const invalidIdentifiers = {
    ...definition,
    roles: [
      {
        ...definition.roles[0],
        id: "2_InvoiceApprover",
        privileges: [
          { ...definition.roles[0].privileges[0], id: "Read Invoices" },
        ],
      },
    ],
  } satisfies CiAccessControlDefinition;
  const issues = ciValidateAccessControlDefinition(invalidIdentifiers);

  assert.equal(
    issues.some(
      (issue) =>
        issue.code === "invalid-identifier" && issue.path === "roles[0].id",
    ),
    true,
  );
  assert.equal(
    issues.some(
      (issue) =>
        issue.code === "invalid-identifier" &&
        issue.path === "roles[0].privileges[0].id",
    ),
    true,
  );
});

/** Creates the minimal authenticated user used by subject adapter tests. */
function authenticatedUser(): { id: string; authenticated: true } {
  return { id: "user-1", authenticated: true };
}

/** Creates an authorization subject from a list of role assignments. */
function subject(
  roleAssignments: CiAuthorizationSubject["roleAssignments"],
  directPrivileges: CiAuthorizationSubject["directPrivileges"] = [],
): CiAuthorizationSubject {
  return ciCreateAuthorizationSubject(
    authenticatedUser(),
    roleAssignments,
    directPrivileges,
  );
}

test("formats, parses, and matches dot-delimited permissions", () => {
  assert.equal(
    ciFormatPermission("identity.users", "read"),
    "identity.users.read",
  );
  assert.deepEqual(ciParsePermission("identity.users.read"), {
    resource: "identity.users",
    action: "read",
  });
  assert.equal(
    ciMatchesPermission("identity.*.*", "identity.users.delete"),
    true,
  );
  assert.equal(
    ciMatchesPermission("forum.posts.*", "forum.posts.comments.delete"),
    true,
  );
  assert.equal(
    ciMatchesPermission("identity.users.read", "identity.users.update"),
    false,
  );
  assert.equal(
    ciMatchesAuthorizationPattern("identity.*", "identity.users.profile"),
    true,
  );
  assert.equal(
    ciMatchesAuthorizationPattern("identity.*.read", "identity.users.read"),
    true,
  );
  assert.equal(
    ciMatchesAuthorizationPattern(
      "identity.*.read",
      "identity.users.profile.read",
    ),
    false,
  );
});

test("inherits role privileges and propagates a tenant assignment to Org Units", () => {
  const authorizer = ciCreateAuthorizer(definition);
  const tenant = ciTenantAccessScope("tenant-a");
  const orgUnit = ciOrgUnitAccessScope("tenant-a", "finance");
  const actor = subject([
    ciCreateRoleAssignment("editor", tenant, "descendants"),
  ]);

  const inherited = authorizer.authorize({
    subject: actor,
    resource: "identity.users",
    action: "read",
    scope: orgUnit,
  });

  assert.equal(inherited.allowed, true);
  assert.equal(inherited.matches[0]?.assignedRoleId, "editor");
  assert.equal(inherited.matches[0]?.privilegeRoleId, "viewer");
  assert.equal(
    authorizer.can({
      subject: actor,
      resource: "identity.users",
      action: "update",
      scope: orgUnit,
    }),
    true,
  );
});

test("suspended roles grant no access and interrupt inherited privileges", () => {
  const suspendedDefinition: CiAccessControlDefinition = {
    ...definition,
    roles: definition.roles.map((role) =>
      role.id === "viewer"
        ? {
            ...role,
            status: "suspended" as const,
            statusChange: {
              changedAt: "2026-08-12T08:00:00.000Z",
              changedBy: "incident-commander",
              reason: "Investigating compromised viewer credentials.",
            },
          }
        : role,
    ),
  };
  const authorizer = ciCreateAuthorizer(suspendedDefinition);
  const tenant = ciTenantAccessScope("tenant-a");

  const suspendedDecision = authorizer.authorize({
    subject: subject([ciCreateRoleAssignment("viewer", tenant, "descendants")]),
    resource: "identity.users",
    action: "read",
    scope: tenant,
  });
  assert.equal(suspendedDecision.allowed, false);
  assert.equal(suspendedDecision.reason, "suspended-role");
  assert.deepEqual(suspendedDecision.evaluatedRoleIds, []);

  const editor = subject([
    ciCreateRoleAssignment("editor", tenant, "descendants"),
  ]);
  assert.equal(
    authorizer.can({
      subject: editor,
      resource: "identity.users",
      action: "update",
      scope: tenant,
    }),
    true,
  );
  assert.equal(
    authorizer.authorize({
      subject: editor,
      resource: "identity.users",
      action: "read",
      scope: tenant,
    }).reason,
    "no-matching-privilege",
  );
});

test("suspended resource domains deny every resource while preserving the catalog", () => {
  const suspendedDefinition: CiAccessControlDefinition = {
    ...definition,
    domains: definition.domains.map((domain) =>
      domain.id === "identity"
        ? {
            ...domain,
            status: "suspended" as const,
            statusChange: {
              changedAt: "2026-08-18T08:00:00.000Z",
              changedBy: "incident-commander",
              reason: "Contain identity operations during an incident.",
            },
          }
        : domain,
    ),
  };
  const authorizer = ciCreateAuthorizer(suspendedDefinition);
  const tenant = ciTenantAccessScope("tenant-a");
  const decision = authorizer.authorize({
    subject: subject([ciCreateRoleAssignment("editor", tenant, "descendants")]),
    resource: "identity.users",
    action: "update",
    scope: tenant,
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "suspended-domain");
  assert.equal(
    suspendedDefinition.resources.some(
      (resource) => resource.id === "identity.users",
    ),
    true,
  );
});

test("suspended resources deny access while preserving actions and privileges", () => {
  const suspendedDefinition: CiAccessControlDefinition = {
    ...definition,
    resources: definition.resources.map((resource) =>
      resource.id === "identity.users"
        ? {
            ...resource,
            status: "suspended" as const,
            statusChange: {
              changedAt: "2026-08-18T10:00:00.000Z",
              changedBy: "incident-commander",
              reason: "Contain user administration during an incident.",
            },
          }
        : resource,
    ),
  };
  const authorizer = ciCreateAuthorizer(suspendedDefinition);
  const tenant = ciTenantAccessScope("tenant-a");
  const decision = authorizer.authorize({
    subject: subject([ciCreateRoleAssignment("editor", tenant, "descendants")]),
    resource: "identity.users",
    action: "update",
    scope: tenant,
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "suspended-resource");
  assert.equal(
    suspendedDefinition.resources.find(
      (resource) => resource.id === "identity.users",
    )?.actions.length,
    definition.resources.find((resource) => resource.id === "identity.users")
      ?.actions.length,
  );

  const suspendedParent: CiAccessControlDefinition = {
    ...suspendedDefinition,
    domains: suspendedDefinition.domains.map((domain) =>
      domain.id === "identity"
        ? {
            ...domain,
            status: "suspended" as const,
            statusChange: {
              changedAt: "2026-08-18T10:05:00.000Z",
              changedBy: "incident-commander",
              reason: "Escalate containment to the complete identity domain.",
            },
          }
        : domain,
    ),
  };
  assert.equal(
    ciCreateAuthorizer(suspendedParent).authorize({
      subject: subject([
        ciCreateRoleAssignment("editor", tenant, "descendants"),
      ]),
      resource: "identity.users",
      action: "update",
      scope: tenant,
    }).reason,
    "suspended-domain",
  );
});

test("keeps exact and tenant scopes isolated", () => {
  const authorizer = ciCreateAuthorizer(definition);
  const actor = subject([
    ciCreateRoleAssignment("viewer", ciTenantAccessScope("tenant-a"), "exact"),
  ]);

  const orgDecision = authorizer.authorize({
    subject: actor,
    resource: "identity.users",
    action: "read",
    scope: ciOrgUnitAccessScope("tenant-a", "finance"),
  });
  const otherTenantDecision = authorizer.authorize({
    subject: actor,
    resource: "identity.users",
    action: "read",
    scope: ciTenantAccessScope("tenant-b"),
  });

  assert.equal(orgDecision.reason, "no-role-assignment");
  assert.equal(otherTenantDecision.reason, "no-role-assignment");
});

test("propagates Org Unit grants only through the supplied ancestor chain", () => {
  const authorizer = ciCreateAuthorizer(definition);
  const actor = subject([
    ciCreateRoleAssignment(
      "viewer",
      ciOrgUnitAccessScope("tenant-a", "division"),
      "descendants",
    ),
  ]);

  assert.equal(
    authorizer.can({
      subject: actor,
      resource: "identity.users",
      action: "read",
      scope: ciOrgUnitAccessScope("tenant-a", "team", ["division"]),
    }),
    true,
  );
  assert.equal(
    authorizer.can({
      subject: actor,
      resource: "identity.users",
      action: "read",
      scope: ciOrgUnitAccessScope("tenant-a", "other-team", ["other-division"]),
    }),
    false,
  );
});

test("builds descendant authorization scope from authoritative Org Unit context", () => {
  const scope = ciOrgUnitContextAccessScope({
    id: "payroll",
    tenantId: "tenant-a",
    parentId: "people",
    ancestorOrgUnitIds: ["headquarters", "shared-services", "people"],
    slug: "payroll",
    path: "/shared-services/people/payroll",
    status: "active",
  });

  assert.deepEqual(scope, {
    kind: "orgUnit",
    tenantId: "tenant-a",
    orgUnitId: "payroll",
    ancestorOrgUnitIds: ["headquarters", "shared-services", "people"],
  });
  assert.equal(
    ciCreateAuthorizer(definition).can({
      subject: subject([
        ciCreateRoleAssignment(
          "viewer",
          ciOrgUnitAccessScope("tenant-a", "headquarters"),
          "descendants",
        ),
      ]),
      resource: "identity.users",
      action: "read",
      scope,
    }),
    true,
  );
});

test("uses deny-overrides by default and can use highest role precedence", () => {
  const tenant = ciTenantAccessScope("tenant-a");
  const actor = subject([
    ciCreateRoleAssignment("editor", tenant, "exact"),
    ciCreateRoleAssignment("blocked-editor", tenant, "exact"),
  ]);
  const request = {
    subject: actor,
    resource: "identity.users",
    action: "update",
    scope: tenant,
  } as const;
  const emberguardConfig = {
    accessControl: {
      combiningAlgorithm: "highest-precedence",
    },
  } as const satisfies CiEmberguardConfig;

  const safeDecision = ciCreateAuthorizer(definition).authorize(request);
  const precedenceDecision = ciCreateAuthorizer(
    definition,
    emberguardConfig.accessControl,
  ).authorize(request);

  assert.equal(safeDecision.allowed, false);
  assert.equal(safeDecision.reason, "explicit-deny");
  assert.equal(precedenceDecision.allowed, true);
  assert.equal(precedenceDecision.decidingMatches[0]?.assignedRoleId, "editor");
});

test("treats direct privileges as the highest tier in precedence mode", () => {
  const tenant = ciTenantAccessScope("tenant-a");
  const directAllow: CiPrivilege = {
    id: "temporary-update-exception",
    title: "Temporary update exception",
    effect: "allow",
    resource: "identity.users",
    action: "update",
    scopeKinds: ["tenant"],
  };
  const actor = subject(
    [ciCreateRoleAssignment("blocked-editor", tenant, "exact")],
    [ciCreateScopedPrivilege(directAllow, tenant, "exact")],
  );
  const request = {
    subject: actor,
    resource: "identity.users",
    action: "update",
    scope: tenant,
  } as const;

  assert.equal(ciCreateAuthorizer(definition).can(request), false);
  assert.equal(
    ciCreateAuthorizer(definition, {
      combiningAlgorithm: "highest-precedence",
    }).can(request),
    true,
  );
});

test("excludes expired and not-yet-active grants using an injectable clock", () => {
  const tenant = ciTenantAccessScope("tenant-a");
  const authorizer = ciCreateAuthorizer(definition, {
    clock: () => new Date("2026-08-04T12:00:00.000Z"),
  });
  const actor = subject([
    ciCreateRoleAssignment("viewer", tenant, "exact", {
      expiresAt: "2026-08-04T12:00:00.000Z",
    }),
    ciCreateRoleAssignment("editor", tenant, "exact", {
      validFrom: "2026-08-04T12:00:01.000Z",
    }),
  ]);

  assert.equal(
    authorizer.authorize({
      subject: actor,
      resource: "identity.users",
      action: "read",
      scope: tenant,
    }).reason,
    "no-role-assignment",
  );
});

test("denies unknown requests and unauthenticated subjects by default", () => {
  const authorizer = ciCreateAuthorizer(definition);
  const tenant = ciTenantAccessScope("tenant-a");
  const actor = subject([ciCreateRoleAssignment("viewer", tenant, "exact")]);

  assert.equal(
    authorizer.authorize({
      subject: actor,
      resource: "missing",
      action: "read",
      scope: tenant,
    }).reason,
    "unknown-resource",
  );
  assert.equal(
    authorizer.authorize({
      subject: actor,
      resource: "identity.users",
      action: "publish",
      scope: tenant,
    }).reason,
    "unknown-action",
  );
  assert.equal(
    authorizer.authorize({
      subject: { ...actor, id: null, authenticated: false },
      resource: "identity.users",
      action: "read",
      scope: tenant,
    }).reason,
    "unauthenticated",
  );
});

test("keeps system grants separate from global cross-tenant grants", () => {
  const authorizer = ciCreateAuthorizer(definition);
  const systemActor = subject([
    ciCreateRoleAssignment(
      "system-admin",
      ciSystemAccessScope(),
      "descendants",
    ),
  ]);
  const exactGlobalActor = subject([
    ciCreateRoleAssignment("system-admin", ciGlobalAccessScope(), "exact"),
  ]);
  const propagatedGlobalActor = subject([
    ciCreateRoleAssignment(
      "system-admin",
      ciGlobalAccessScope(),
      "descendants",
    ),
  ]);

  assert.equal(
    authorizer.can({
      subject: systemActor,
      resource: "platform.settings",
      action: "update",
      scope: ciSystemAccessScope(),
    }),
    true,
  );
  assert.equal(
    authorizer.can({
      subject: systemActor,
      resource: "identity.users",
      action: "delete",
      scope: ciTenantAccessScope("tenant-a"),
    }),
    false,
  );
  assert.equal(
    authorizer.can({
      subject: exactGlobalActor,
      resource: "identity.users",
      action: "delete",
      scope: ciGlobalAccessScope(),
    }),
    true,
  );
  assert.equal(
    authorizer.can({
      subject: propagatedGlobalActor,
      resource: "identity.users",
      action: "delete",
      scope: ciOrgUnitAccessScope("tenant-b", "finance"),
    }),
    true,
  );
  assert.equal(
    authorizer.can({
      subject: exactGlobalActor,
      resource: "identity.users",
      action: "delete",
      scope: ciTenantAccessScope("tenant-a"),
    }),
    false,
  );
  assert.equal(
    authorizer.can({
      subject: propagatedGlobalActor,
      resource: "identity.users",
      action: "delete",
      scope: ciTenantAccessScope("tenant-a"),
    }),
    true,
  );
  assert.equal(
    authorizer.can({
      subject: propagatedGlobalActor,
      resource: "platform.settings",
      action: "update",
      scope: ciSystemAccessScope(),
    }),
    false,
  );
});

test("supports any/all capability checks and rejects empty requirement batches", () => {
  const authorizer = ciCreateAuthorizer(definition);
  const tenant = ciTenantAccessScope("tenant-a");
  const actor = subject([ciCreateRoleAssignment("viewer", tenant, "exact")]);
  const requirements = [
    { resource: "identity.users", action: "read" },
    { resource: "identity.users", action: "update" },
  ];

  assert.equal(
    authorizer.canAny({ subject: actor, scope: tenant, requirements }),
    true,
  );
  assert.equal(
    authorizer.canAll({ subject: actor, scope: tenant, requirements }),
    false,
  );
  assert.equal(
    authorizer.canAny({ subject: actor, scope: tenant, requirements: [] }),
    false,
  );
  assert.equal(
    authorizer.canAll({ subject: actor, scope: tenant, requirements: [] }),
    false,
  );
  assert.equal(
    ciCanAny({ subject: actor, scope: tenant, requirements }, definition),
    true,
  );
  assert.equal(
    ciCanAll({ subject: actor, scope: tenant, requirements }, definition),
    false,
  );
});

test("returns structured validation errors and non-blocking wildcard warnings", () => {
  assert.equal(
    ciValidateAccessControlDefinition(definition).some(
      (issue) =>
        issue.code === "broad-wildcard" && issue.severity === "warning",
    ),
    true,
  );

  const invalid: CiAccessControlDefinition = {
    domains: [],
    resources: [
      {
        id: "unknown.resource",
        domainId: "missing",
        title: "Unknown",
        actions: [],
        scopeKinds: [],
      },
    ],
    roles: [
      { id: "a", title: "A", precedence: 1, inherits: ["b"], privileges: [] },
      { id: "b", title: "B", precedence: 2, inherits: ["a"], privileges: [] },
    ],
  };
  const issues = ciValidateAccessControlDefinition(invalid);

  assert.equal(
    issues.some((issue) => issue.code === "unknown-domain"),
    true,
  );
  assert.equal(
    issues.some((issue) => issue.code === "empty-list"),
    true,
  );
  assert.equal(
    issues.some((issue) => issue.code === "role-cycle"),
    true,
  );

  const untitledPrivilege = {
    ...definition,
    roles: definition.roles.map((role, index) =>
      index === 0
        ? {
            ...role,
            privileges: role.privileges.map((privilege, privilegeIndex) =>
              privilegeIndex === 0 ? { ...privilege, title: " " } : privilege,
            ),
          }
        : role,
    ),
  };
  assert.equal(
    ciValidateAccessControlDefinition(untitledPrivilege).some(
      (issue) =>
        issue.code === "invalid-title" && issue.path.endsWith(".title"),
    ),
    true,
  );

  const suspendedWithoutMetadata: CiAccessControlDefinition = {
    ...definition,
    roles: definition.roles.map((role, index) =>
      index === 0 ? { ...role, status: "suspended" as const } : role,
    ),
  };
  assert.equal(
    ciValidateAccessControlDefinition(suspendedWithoutMetadata).some(
      (issue) => issue.code === "invalid-role-status",
    ),
    true,
  );

  const suspendedPlatformDomain: CiAccessControlDefinition = {
    ...definition,
    domains: definition.domains.map((domain) =>
      domain.id === "platform"
        ? {
            ...domain,
            status: "suspended" as const,
            statusChange: {
              changedAt: "2026-08-18T10:00:00.000Z",
              changedBy: "system-super-admin",
              reason: "Unsafe recovery-path test.",
            },
          }
        : domain,
    ),
  };
  assert.equal(
    ciValidateAccessControlDefinition(suspendedPlatformDomain).some(
      (issue) =>
        issue.code === "invalid-domain-status" &&
        issue.message.includes("recovery path"),
    ),
    true,
  );

  const suspendedRecoveryResource: CiAccessControlDefinition = {
    ...CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
    resources: CI_DEFAULT_ACCESS_CONTROL_DEFINITION.resources.map((resource) =>
      resource.id === "platform.authorization"
        ? {
            ...resource,
            status: "suspended" as const,
            statusChange: {
              changedAt: "2026-08-18T10:00:00.000Z",
              changedBy: "system-super-admin",
              reason: "Unsafe recovery-resource test.",
            },
          }
        : resource,
    ),
  };
  assert.equal(
    ciValidateAccessControlDefinition(suspendedRecoveryResource).some(
      (issue) =>
        issue.code === "invalid-resource-status" &&
        issue.message.includes("recovery resources"),
    ),
    true,
  );
});

test("provides a valid default CloudIgniter access-control catalog", () => {
  const errors = ciValidateAccessControlDefinition(
    CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
  ).filter((issue) => issue.severity === "error");

  assert.deepEqual(errors, []);
  assert.equal(
    CI_DEFAULT_ACCESS_CONTROL_DEFINITION.roles.some(
      (role) => role.id === "system-super-admin" && role.precedence === 0,
    ),
    true,
  );
  assert.equal(
    CI_DEFAULT_ACCESS_CONTROL_DEFINITION.resources.some(
      (resource) => resource.id === "platform.authorization.core",
    ),
    true,
  );
  assert.equal(
    CI_DEFAULT_ACCESS_CONTROL_DEFINITION.resources
      .find((resource) => resource.id === "identity.users")
      ?.scopeKinds.includes("global"),
    true,
  );
  assert.equal(
    CI_DEFAULT_ACCESS_CONTROL_DEFINITION.roles
      .find((role) => role.id === "system-super-admin")
      ?.privileges.find(
        (privilege) => privilege.id === "override-core-access-control",
      )
      ?.scopeKinds.includes("system"),
    true,
  );
  assert.equal(
    ciCreateAuthorizer(CI_DEFAULT_ACCESS_CONTROL_DEFINITION).can({
      subject: ciCreateAuthorizationSubject(
        { id: "system-admin", authenticated: true },
        [
          ciCreateRoleAssignment(
            "system-admin",
            ciSystemAccessScope(),
            "exact",
          ),
        ],
      ),
      resource: "identity.users",
      action: "create",
      scope: ciSystemAccessScope(),
    }),
    true,
  );
  assert.equal(Object.isFrozen(CI_DEFAULT_ACCESS_CONTROL_DEFINITION), true);
  assert.equal(
    Object.isFrozen(CI_DEFAULT_ACCESS_CONTROL_DEFINITION.roles),
    true,
  );
});

test("keeps technical and business core-role inheritance separate", () => {
  const roles = new Map<string, CiRoleDefinition>(
    CI_DEFAULT_ACCESS_CONTROL_DEFINITION.roles.map((role) => [role.id, role]),
  );
  const technicalAdministrator = subject([
    ciCreateRoleAssignment(
      "system-admin",
      ciGlobalAccessScope(),
      "descendants",
    ),
  ]);
  const authorizer = ciCreateAuthorizer(CI_DEFAULT_ACCESS_CONTROL_DEFINITION);

  assert.deepEqual(roles.get("admin")?.inherits, ["user"]);
  assert.deepEqual(roles.get("super-admin")?.inherits, ["admin"]);
  assert.deepEqual(roles.get("system-admin")?.inherits, ["user"]);
  assert.deepEqual(roles.get("system-super-admin")?.inherits, ["system-admin"]);
  assert.equal(
    authorizer.can({
      subject: technicalAdministrator,
      resource: "platform.dashboard",
      action: "read",
      scope: ciTenantAccessScope("tenant-a"),
    }),
    true,
  );
  assert.equal(
    authorizer.can({
      subject: technicalAdministrator,
      resource: "identity.users",
      action: "update",
      scope: ciTenantAccessScope("tenant-a"),
    }),
    false,
  );
});

test("extends core access control without redefining core entries", () => {
  const extension = {
    resources: [
      {
        id: "identity.users",
        actions: [{ id: "suspend", title: "Suspend user", sensitive: true }],
      },
    ],
    roles: [
      {
        id: "app-admin",
        title: "Application administrator",
        precedence: 25,
        inherits: ["admin"],
        privileges: [
          {
            id: "suspend-users",
            title: "Suspend users",
            effect: "allow",
            resource: "identity.users",
            action: "suspend",
            scopeKinds: ["tenant", "orgUnit"],
          },
        ],
      },
    ],
  } as const;
  const originalExtension = JSON.stringify(extension);
  const merged = ciCreateAppAccessControl(extension);
  const users = merged.resources.find(
    (resource) => resource.id === "identity.users",
  );
  const appAdmin = merged.roles.find((role) => role.id === "app-admin");

  assert.equal(users?.title, "User administration");
  assert.equal(
    users?.actions.some((action) => action.id === "read"),
    true,
  );
  assert.equal(
    users?.actions.some((action) => action.id === "suspend"),
    true,
  );
  assert.deepEqual(appAdmin?.inherits, ["admin"]);
  assert.equal(
    appAdmin?.privileges.some((privilege) => privilege.id === "suspend-users"),
    true,
  );
  assert.equal(JSON.stringify(extension), originalExtension);
});

test("rejects application collisions with core-owned entries", () => {
  assert.throws(
    () =>
      ciCreateAppAccessControl({
        domains: [{ id: "platform", title: "Renamed platform" }],
      }),
    /cannot override core domain/,
  );
  assert.throws(
    () =>
      ciCreateAppAccessControl({
        resources: [{ id: "identity.users", title: "People" }],
      }),
    /cannot override core resource/,
  );
  assert.throws(
    () =>
      ciCreateAppAccessControl({
        resources: [
          {
            id: "identity.users",
            actions: [{ id: "read", title: "Read people" }],
          },
        ],
      }),
    /cannot override core action/,
  );
  assert.throws(
    () =>
      ciCreateAppAccessControl({
        roles: [{ id: "admin", title: "Renamed administrator" }],
      }),
    /cannot override core role/,
  );
});

test("allows later layers to refine only application-owned entries", () => {
  const merged = ciCreateAppAccessControl(
    {
      resources: [
        {
          id: "platform.reports",
          domainId: "platform",
          title: "Reports",
          actions: [{ id: "read", title: "Read reports" }],
          scopeKinds: ["system"],
        },
      ],
      roles: [
        {
          id: "report-reader",
          title: "Report reader",
          precedence: 45,
          inherits: ["user"],
          privileges: [],
        },
      ],
    },
    {
      resources: [{ id: "platform.reports", title: "Platform reports" }],
      roles: [{ id: "report-reader", title: "Platform report reader" }],
    },
  );

  assert.equal(
    merged.resources.find((resource) => resource.id === "platform.reports")
      ?.title,
    "Platform reports",
  );
  assert.equal(
    merged.roles.find((role) => role.id === "report-reader")?.title,
    "Platform report reader",
  );
});

test("prevents application roles from acquiring the core override capability", () => {
  assert.throws(
    () =>
      ciCreateAppAccessControl({
        roles: [
          {
            id: "core-editor",
            title: "Core editor",
            precedence: 5,
            privileges: [
              {
                id: "override-core",
                title: "Override core access control",
                effect: "allow",
                resource: "platform.authorization.core",
                action: "override",
                scopeKinds: ["system"],
              },
            ],
          },
        ],
      }),
    /cannot grant the core override capability/,
  );
  assert.throws(
    () =>
      ciCreateAppAccessControl({
        roles: [
          {
            id: "inherited-system-super-admin",
            title: "Inherited system super administrator",
            precedence: 1,
            inherits: ["system-super-admin"],
            privileges: [],
          },
        ],
      }),
    /cannot inherit system-super-admin/,
  );
});

test("reports core ownership for future administration UIs", () => {
  assert.equal(
    ciIsCoreAccessControlEntry({ kind: "domain", domainId: "identity" }),
    true,
  );
  assert.equal(
    ciIsCoreAccessControlEntry({
      kind: "action",
      resourceId: "identity.users",
      actionId: "read",
    }),
    true,
  );
  assert.equal(
    ciGetAccessControlEntryOrigin({
      kind: "action",
      resourceId: "identity.users",
      actionId: "suspend",
    }),
    "application",
  );
});

test("restricts audited core overrides to directly assigned system super administrators", () => {
  const systemScope = ciSystemAccessScope();
  const systemAdmin = subject([
    ciCreateRoleAssignment("system-admin", systemScope, "exact"),
  ]);
  const systemSuperAdmin = subject([
    ciCreateRoleAssignment("system-super-admin", systemScope, "exact"),
  ]);
  const directOverride = subject(
    [],
    [
      ciCreateScopedPrivilege(
        {
          id: "direct-core-override",
          title: "Direct core access-control override",
          effect: "allow",
          resource: "platform.authorization.core",
          action: "override",
          scopeKinds: ["system"],
        },
        systemScope,
        "exact",
      ),
    ],
  );

  assert.equal(
    ciCanOverrideCoreAccessControl(
      systemAdmin,
      CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
    ),
    false,
  );
  assert.equal(
    ciCanOverrideCoreAccessControl(
      directOverride,
      CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
    ),
    false,
  );
  assert.equal(
    ciCanOverrideCoreAccessControl(
      systemSuperAdmin,
      CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
    ),
    true,
  );

  assert.throws(
    () =>
      ciCreateCoreAccessControlOverride({
        id: "override-1",
        expectedRevision: 0,
        reason: "Rename the identity domain for this installation.",
        subject: systemAdmin,
        currentDefinition: CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
        layer: {
          domains: [{ id: "identity", title: "Identity directory" }],
        },
      }),
    /Only a directly assigned system-super-admin/,
  );

  const override = ciCreateCoreAccessControlOverride(
    {
      id: "override-1",
      expectedRevision: 0,
      reason: "Rename the identity domain for this installation.",
      subject: systemSuperAdmin,
      currentDefinition: CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
      layer: {
        domains: [{ id: "identity", title: "Identity directory" }],
      },
    },
    { clock: () => new Date("2026-08-05T12:00:00.000Z") },
  );
  const resolved = ciApplyCoreAccessControlOverrides(
    CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
    [override],
  );

  assert.equal(override.actorId, "user-1");
  assert.equal(override.previousRevision, 0);
  assert.equal(override.revision, 1);
  assert.equal(override.createdAt, "2026-08-05T12:00:00.000Z");
  assert.equal(Object.isFrozen(override.layer), true);
  assert.equal(
    resolved.domains.find((domain) => domain.id === "identity")?.title,
    "Identity directory",
  );
  assert.equal(
    CI_DEFAULT_ACCESS_CONTROL_DEFINITION.domains.find(
      (domain) => domain.id === "identity",
    )?.title,
    "Identity and access",
  );
});

test("reserves user impersonation for super administrators and higher", () => {
  const scope = ciSystemAccessScope();
  const authorizer = ciCreateAuthorizer(CI_DEFAULT_ACCESS_CONTROL_DEFINITION);
  const request = {
    resource: "identity.users",
    action: "impersonate",
    scope,
  } as const;

  assert.equal(
    authorizer.can({
      subject: subject([ciCreateRoleAssignment("admin", scope, "exact")]),
      ...request,
    }),
    false,
  );
  for (const roleId of ["super-admin", "system-admin", "system-super-admin"]) {
    assert.equal(
      authorizer.can({
        subject: subject([ciCreateRoleAssignment(roleId, scope, "exact")]),
        ...request,
      }),
      true,
    );
  }
});

test("rejects core overrides that target application entries or weaken bootstrap access", () => {
  const systemSuperAdmin = subject([
    ciCreateRoleAssignment(
      "system-super-admin",
      ciSystemAccessScope(),
      "exact",
    ),
  ]);

  assert.throws(
    () =>
      ciCreateCoreAccessControlOverride({
        id: "override-admin-lanes",
        expectedRevision: 0,
        reason: "Attempt to merge technical and business administration.",
        subject: systemSuperAdmin,
        currentDefinition: CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
        layer: {
          roles: [
            {
              id: "system-admin",
              inherits: ["super-admin"],
            },
          ],
        },
      }),
    /must preserve separation between technical and business administrator roles/,
  );

  assert.throws(
    () =>
      ciCreateCoreAccessControlOverride({
        id: "override-app-role",
        expectedRevision: 0,
        reason: "Attempt to edit an application role.",
        subject: systemSuperAdmin,
        currentDefinition: ciCreateAppAccessControl({
          roles: [
            {
              id: "app-admin",
              title: "Application administrator",
              precedence: 25,
              inherits: ["admin"],
              privileges: [],
            },
          ],
        }),
        layer: {
          roles: [{ id: "app-admin", title: "Renamed role" }],
        },
      }),
    /cannot target application role/,
  );

  assert.throws(
    () =>
      ciCreateCoreAccessControlOverride({
        id: "override-bootstrap",
        expectedRevision: 0,
        reason: "Attempt to weaken bootstrap access.",
        subject: systemSuperAdmin,
        currentDefinition: CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
        layer: {
          roles: [
            {
              id: "system-super-admin",
              privileges: [
                { id: "override-core-access-control", action: "read" },
              ],
            },
          ],
        },
      }),
    /must preserve system-super-admin bootstrap access/,
  );

  assert.throws(
    () =>
      ciCreateCoreAccessControlOverride({
        id: "override-global-bootstrap",
        expectedRevision: 0,
        reason: "Attempt to remove global bootstrap access.",
        subject: systemSuperAdmin,
        currentDefinition: CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
        layer: {
          roles: [
            {
              id: "system-super-admin",
              privileges: [],
              privilegesMode: "replace",
            },
          ],
        },
      }),
    /must preserve system-super-admin bootstrap access/,
  );
});

test("replaces value arrays while merging nested catalog collections", () => {
  const merged = ciMergeAccessControlDefinitions(
    {
      domains: [{ id: "documents", title: "Documents" }],
      resources: [
        {
          id: "documents.files",
          domainId: "documents",
          title: "Files",
          actions: [{ id: "read", title: "Read files" }],
          scopeKinds: ["tenant", "orgUnit"],
        },
      ],
      roles: [
        { id: "viewer", title: "Viewer", precedence: 20, privileges: [] },
        {
          id: "editor",
          title: "Editor",
          precedence: 10,
          inherits: ["viewer"],
          privileges: [
            {
              id: "read-files",
              title: "Read files",
              effect: "allow",
              resource: "documents.files",
              action: "read",
              scopeKinds: ["tenant"],
            },
          ],
        },
      ],
    },
    {
      resources: [{ id: "documents.files", scopeKinds: ["tenant"] }],
      roles: [{ id: "editor", inherits: [] }],
    },
  );

  assert.deepEqual(
    merged.resources.find((resource) => resource.id === "documents.files")
      ?.scopeKinds,
    ["tenant"],
  );
  assert.deepEqual(
    merged.roles.find((role) => role.id === "editor")?.inherits,
    [],
  );
});

test("replaces a role privilege set only when explicitly requested", () => {
  const merged = ciMergeAccessControlDefinitions(definition, {
    roles: [
      {
        id: "viewer",
        privileges: [],
        privilegesMode: "replace",
      },
    ],
  });

  assert.deepEqual(
    merged.roles.find((role) => role.id === "viewer")?.privileges,
    [],
  );
  assert.equal("privilegesMode" in (merged.roles[0] ?? {}), false);
});

test("rejects incomplete entries introduced by a merge layer", () => {
  assert.throws(
    () =>
      ciMergeAccessControlDefinitions({
        domains: [{ id: "billing" }],
      }),
    /requires a title/,
  );
  assert.throws(
    () =>
      ciCreateAppAccessControl({
        resources: [
          {
            id: "identity.users",
            actions: [{ id: "archive" }],
          },
        ],
      }),
    /action .* requires a title/,
  );
  assert.throws(
    () =>
      ciCreateAppAccessControl({
        roles: [
          {
            id: "archiver",
            title: "Archiver",
            precedence: 35,
            privileges: [{ id: "archive-users" }],
          },
        ],
      }),
    /privilege .* requires title, effect, resource, and action/,
  );
});

test("maps identity-provider groups to known roles and ignores unrelated groups", () => {
  assert.deepEqual(
    ciResolveIdentityGroupRoles(
      ["tenant-admins", "unrelated", "tenant-admins", "user", "ignored"],
      CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
      {
        roleMap: {
          "tenant-admins": "admin",
          ignored: null,
        },
      },
    ),
    ["admin", "user"],
  );
});

test("can reject unknown identity groups in strict administrative workflows", () => {
  assert.throws(
    () =>
      ciResolveIdentityGroupRoles(
        ["missing-group"],
        CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
        { unknownGroupStrategy: "throw" },
      ),
    /unknown access-control role/,
  );
});

test("creates usable scoped assignments from identity-provider groups", () => {
  const tenant = ciTenantAccessScope("tenant-a");
  const assignments = ciCreateRoleAssignmentsFromIdentityGroups(
    ["tenant-admins"],
    CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
    tenant,
    "descendants",
    { roleMap: { "tenant-admins": "admin" } },
  );
  const actor = subject(assignments);

  assert.equal(
    ciCreateAuthorizer(CI_DEFAULT_ACCESS_CONTROL_DEFINITION).can({
      subject: actor,
      resource: "identity.users",
      action: "update",
      scope: ciOrgUnitAccessScope("tenant-a", "finance"),
    }),
    true,
  );
});

test("creates application authorizers in core with or without app extensions", () => {
  const defaultAuthorizer = ciCreateAppAuthorizer();
  const extendedDefinition = ciCreateAppAccessControl({
    resources: [
      {
        id: "platform.dashboard",
        actions: [{ id: "summarize", title: "Summarize dashboard" }],
      },
    ],
  });
  const extendedAuthorizer = ciCreateAppAuthorizer(extendedDefinition);

  assert.equal(
    defaultAuthorizer.definition,
    CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
  );
  assert.equal(
    extendedAuthorizer.definition.resources
      .find((resource) => resource.id === "platform.dashboard")
      ?.actions.some((action) => action.id === "summarize"),
    true,
  );
  assert.deepEqual(ciCreateCoreAccessControl(), ciCreateAppAccessControl());
});

test("exposes security administration through the core public facade", () => {
  assert.equal(typeof ciCreateSecurityAdministration, "function");
});
