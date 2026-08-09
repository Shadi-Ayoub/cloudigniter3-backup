import assert from "node:assert/strict";
import test from "node:test";

import {
  CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
  ciApplyCoreAccessControlOverrides,
  ciCanAll,
  ciCanAny,
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
  ciMatchesAuthorizationPattern,
  ciMatchesPermission,
  ciMergeAccessControlDefinitions,
  ciOrgUnitAccessScope,
  ciParsePermission,
  ciResolveIdentityGroupRoles,
  ciSystemAccessScope,
  ciTenantAccessScope,
  ciValidateAccessControlDefinition,
} from "@ci-core/lib";
import type {
  CiAccessControlDefinition,
  CiAuthorizationSubject,
  CiPrivilege,
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
          effect: "allow",
          resource: "*",
          action: "*",
          scopeKinds: ["system", "global", "tenant", "orgUnit"],
        },
      ],
    },
  ],
} as const satisfies CiAccessControlDefinition);

/** Creates the minimal authenticated user used by subject adapter tests. */
function authenticatedUser(): { id: string; authenticated: true } {
  return { id: "user-1", authenticated: true };
}

/** Creates an authorization subject from a list of role assignments. */
function subject(
  roleAssignments: CiAuthorizationSubject["roleAssignments"],
  directPrivileges: CiAuthorizationSubject["directPrivileges"] = [],
): CiAuthorizationSubject {
  return ciCreateAuthorizationSubject(authenticatedUser(), roleAssignments, directPrivileges);
}

test("formats, parses, and matches dot-delimited permissions", () => {
  assert.equal(ciFormatPermission("identity.users", "read"), "identity.users.read");
  assert.deepEqual(ciParsePermission("identity.users.read"), {
    resource: "identity.users",
    action: "read",
  });
  assert.equal(ciMatchesPermission("identity.*.*", "identity.users.delete"), true);
  assert.equal(ciMatchesPermission("forum.posts.*", "forum.posts.comments.delete"), true);
  assert.equal(ciMatchesPermission("identity.users.read", "identity.users.update"), false);
  assert.equal(ciMatchesAuthorizationPattern("identity.*", "identity.users.profile"), true);
  assert.equal(ciMatchesAuthorizationPattern("identity.*.read", "identity.users.read"), true);
  assert.equal(ciMatchesAuthorizationPattern("identity.*.read", "identity.users.profile.read"), false);
});

test("inherits role privileges and propagates a tenant assignment to Org Units", () => {
  const authorizer = ciCreateAuthorizer(definition);
  const tenant = ciTenantAccessScope("tenant-a");
  const orgUnit = ciOrgUnitAccessScope("tenant-a", "finance");
  const actor = subject([ciCreateRoleAssignment("editor", tenant, "descendants")]);

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

  const safeDecision = ciCreateAuthorizer(definition).authorize(request);
  const precedenceDecision = ciCreateAuthorizer(definition, {
    combiningAlgorithm: "highest-precedence",
  }).authorize(request);

  assert.equal(safeDecision.allowed, false);
  assert.equal(safeDecision.reason, "explicit-deny");
  assert.equal(precedenceDecision.allowed, true);
  assert.equal(precedenceDecision.decidingMatches[0]?.assignedRoleId, "editor");
});

test("treats direct privileges as the highest tier in precedence mode", () => {
  const tenant = ciTenantAccessScope("tenant-a");
  const directAllow: CiPrivilege = {
    id: "temporary-update-exception",
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
    ciCreateAuthorizer(definition, { combiningAlgorithm: "highest-precedence" }).can(request),
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
    authorizer.authorize({ subject: actor, resource: "missing", action: "read", scope: tenant })
      .reason,
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
    ciCreateRoleAssignment("system-admin", ciSystemAccessScope(), "descendants"),
  ]);
  const exactGlobalActor = subject([
    ciCreateRoleAssignment("system-admin", ciGlobalAccessScope(), "exact"),
  ]);
  const propagatedGlobalActor = subject([
    ciCreateRoleAssignment("system-admin", ciGlobalAccessScope(), "descendants"),
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

  assert.equal(authorizer.canAny({ subject: actor, scope: tenant, requirements }), true);
  assert.equal(authorizer.canAll({ subject: actor, scope: tenant, requirements }), false);
  assert.equal(authorizer.canAny({ subject: actor, scope: tenant, requirements: [] }), false);
  assert.equal(authorizer.canAll({ subject: actor, scope: tenant, requirements: [] }), false);
  assert.equal(ciCanAny({ subject: actor, scope: tenant, requirements }, definition), true);
  assert.equal(ciCanAll({ subject: actor, scope: tenant, requirements }, definition), false);
});

test("returns structured validation errors and non-blocking wildcard warnings", () => {
  assert.equal(
    ciValidateAccessControlDefinition(definition).some(
      (issue) => issue.code === "broad-wildcard" && issue.severity === "warning",
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

  assert.equal(issues.some((issue) => issue.code === "unknown-domain"), true);
  assert.equal(issues.some((issue) => issue.code === "empty-list"), true);
  assert.equal(issues.some((issue) => issue.code === "role-cycle"), true);
});

test("provides a valid default CloudIgniter access-control catalog", () => {
  const errors = ciValidateAccessControlDefinition(
    CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
  ).filter((issue) => issue.severity === "error");

  assert.deepEqual(errors, []);
  assert.equal(
    CI_DEFAULT_ACCESS_CONTROL_DEFINITION.roles.some(
      (role) => role.id === "SYSTEM_SUPER_ADMIN" && role.precedence === 0,
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
      .find((role) => role.id === "SYSTEM_SUPER_ADMIN")
      ?.privileges.find((privilege) => privilege.id === "full-platform-access")
      ?.scopeKinds.includes("global"),
    true,
  );
  assert.equal(Object.isFrozen(CI_DEFAULT_ACCESS_CONTROL_DEFINITION), true);
  assert.equal(Object.isFrozen(CI_DEFAULT_ACCESS_CONTROL_DEFINITION.roles), true);
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
        id: "APP_ADMIN",
        title: "Application administrator",
        precedence: 25,
        inherits: ["ADMIN"],
        privileges: [
          {
            id: "suspend-users",
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
  const users = merged.resources.find((resource) => resource.id === "identity.users");
  const appAdmin = merged.roles.find((role) => role.id === "APP_ADMIN");

  assert.equal(users?.title, "User administration");
  assert.equal(users?.actions.some((action) => action.id === "read"), true);
  assert.equal(users?.actions.some((action) => action.id === "suspend"), true);
  assert.deepEqual(appAdmin?.inherits, ["ADMIN"]);
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
        roles: [{ id: "ADMIN", title: "Renamed administrator" }],
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
          id: "REPORT_READER",
          title: "Report reader",
          precedence: 45,
          inherits: ["USER"],
          privileges: [],
        },
      ],
    },
    {
      resources: [{ id: "platform.reports", title: "Platform reports" }],
      roles: [{ id: "REPORT_READER", title: "Platform report reader" }],
    },
  );

  assert.equal(
    merged.resources.find((resource) => resource.id === "platform.reports")?.title,
    "Platform reports",
  );
  assert.equal(
    merged.roles.find((role) => role.id === "REPORT_READER")?.title,
    "Platform report reader",
  );
});

test("prevents application roles from acquiring the core override capability", () => {
  assert.throws(
    () =>
      ciCreateAppAccessControl({
        roles: [
          {
            id: "CORE_EDITOR",
            title: "Core editor",
            precedence: 5,
            privileges: [
              {
                id: "override-core",
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
            id: "INHERITED_SYSTEM_SUPER_ADMIN",
            title: "Inherited system super administrator",
            precedence: 1,
            inherits: ["SYSTEM_SUPER_ADMIN"],
            privileges: [],
          },
        ],
      }),
    /cannot inherit SYSTEM_SUPER_ADMIN/,
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
    ciCreateRoleAssignment("SYSTEM_ADMIN", systemScope, "exact"),
  ]);
  const systemSuperAdmin = subject([
    ciCreateRoleAssignment("SYSTEM_SUPER_ADMIN", systemScope, "exact"),
  ]);
  const directOverride = subject([], [
    ciCreateScopedPrivilege(
      {
        id: "direct-core-override",
        effect: "allow",
        resource: "platform.authorization.core",
        action: "override",
        scopeKinds: ["system"],
      },
      systemScope,
      "exact",
    ),
  ]);

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
    /Only a directly assigned SYSTEM_SUPER_ADMIN/,
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

test("rejects core overrides that target application entries or weaken bootstrap access", () => {
  const systemSuperAdmin = subject([
    ciCreateRoleAssignment(
      "SYSTEM_SUPER_ADMIN",
      ciSystemAccessScope(),
      "exact",
    ),
  ]);

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
              id: "APP_ADMIN",
              title: "Application administrator",
              precedence: 25,
              inherits: ["ADMIN"],
              privileges: [],
            },
          ],
        }),
        layer: {
          roles: [{ id: "APP_ADMIN", title: "Renamed role" }],
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
              id: "SYSTEM_SUPER_ADMIN",
              privileges: [
                { id: "full-platform-access", action: "read" },
              ],
            },
          ],
        },
      }),
    /must preserve SYSTEM_SUPER_ADMIN bootstrap access/,
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
              id: "SYSTEM_SUPER_ADMIN",
              privileges: [
                {
                  id: "full-platform-access",
                  scopeKinds: ["system", "tenant", "orgUnit"],
                },
              ],
            },
          ],
        },
      }),
    /must preserve SYSTEM_SUPER_ADMIN bootstrap access/,
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
    merged.resources.find((resource) => resource.id === "documents.files")?.scopeKinds,
    ["tenant"],
  );
  assert.deepEqual(merged.roles.find((role) => role.id === "editor")?.inherits, []);
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
            id: "ARCHIVER",
            title: "Archiver",
            precedence: 35,
            privileges: [{ id: "archive-users" }],
          },
        ],
      }),
    /privilege .* requires effect, resource, and action/,
  );
});

test("maps identity-provider groups to known roles and ignores unrelated groups", () => {
  assert.deepEqual(
    ciResolveIdentityGroupRoles(
      ["tenant-admins", "unrelated", "tenant-admins", "USER", "ignored"],
      CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
      {
        roleMap: {
          "tenant-admins": "ADMIN",
          ignored: null,
        },
      },
    ),
    ["ADMIN", "USER"],
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
    { roleMap: { "tenant-admins": "ADMIN" } },
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

  assert.equal(defaultAuthorizer.definition, CI_DEFAULT_ACCESS_CONTROL_DEFINITION);
  assert.equal(
    extendedAuthorizer.definition.resources.find(
      (resource) => resource.id === "platform.dashboard",
    )?.actions.some((action) => action.id === "summarize"),
    true,
  );
  assert.deepEqual(ciCreateCoreAccessControl(), ciCreateAppAccessControl());
});

test("exposes security administration through the core public facade", () => {
  assert.equal(typeof ciCreateSecurityAdministration, "function");
});
