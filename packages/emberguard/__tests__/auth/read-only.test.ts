import assert from "node:assert/strict";
import test from "node:test";
import {
  ciCreateAuthorizer,
  ciCreateCoreAccessControlOverride,
  ciCreateRoleAssignment,
  ciCreateScopedPrivilege,
  ciMergeAccessControlDefinitions,
  CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
} from "@ci-emberguard/lib";
import type {
  CiAccessControlDefinition,
  CiAuthorizationSubject,
  CiPrivilege,
} from "@ci-emberguard/types";

const scope = { kind: "tenant", tenantId: "audit-tenant" } as const;
const restriction: CiPrivilege = {
  id: "audit-records",
  title: "Audit records",
  effect: "allow",
  resource: "audit.*",
  action: "read",
  scopeKinds: ["tenant", "orgUnit"],
  readOnly: true,
};
const writer: CiPrivilege = {
  ...restriction,
  id: "write-records",
  action: "*",
  readOnly: false,
};
const definition: CiAccessControlDefinition = {
  domains: [{ id: "audit", title: "Audit" }],
  resources: ["audit.records", "audit.notes"].map((id) => ({
    id,
    domainId: "audit",
    title: id,
    scopeKinds: ["tenant", "orgUnit"],
    actions: [
      ...[
        "read",
        "get",
        "list",
        "view",
        "search",
        "create",
        "update",
        "delete",
        "manage",
        "approve",
        "publish",
        "execute",
        "future-action",
      ].map((id) => ({ id, title: id })),
      { id: "preview", title: "Preview", accessMode: "read" },
      {
        id: "export",
        title: "Export and record delivery",
        accessMode: "write",
      },
    ],
  })),
  roles: [
    {
      id: "auditor",
      title: "Auditor",
      precedence: 100,
      privileges: [restriction],
    },
    {
      id: "supervisor",
      title: "Supervisor",
      precedence: 50,
      inherits: ["auditor"],
      privileges: [],
    },
    { id: "writer", title: "Writer", precedence: 1, privileges: [writer] },
  ],
};
const auditAssignment = ciCreateRoleAssignment(
  "supervisor",
  scope,
  "descendants",
);
const writeAssignment = ciCreateRoleAssignment("writer", scope, "descendants");
const subject: CiAuthorizationSubject = {
  id: "user",
  authenticated: true,
  roleAssignments: [
    ciCreateRoleAssignment("supervisor", scope, "descendants"),
    ciCreateRoleAssignment("writer", scope, "descendants"),
  ],
  directPrivileges: [ciCreateScopedPrivilege(writer, scope, "descendants")],
};
const request = { subject, scope, resource: "audit.records", action: "update" };

for (const combiningAlgorithm of [
  "deny-overrides",
  "highest-precedence",
] as const) {
  test(`forced read-only overrides all write grants under ${combiningAlgorithm}`, () => {
    const authorizer = ciCreateAuthorizer(definition, { combiningAlgorithm });
    for (const action of [
      "create",
      "update",
      "delete",
      "manage",
      "approve",
      "publish",
      "execute",
      "future-action",
      "export",
    ]) {
      const result = authorizer.authorize({ ...request, action });
      assert.equal(result.reason, "read-only", action);
      assert.equal(result.allowed, false);
      const deciding = result.decidingMatches[0];
      assert.ok(deciding);
      assert.equal(deciding.privilege.id, "audit-records");
      assert.equal(deciding.assignedRoleId, "supervisor");
      assert.equal(deciding.privilegeRoleId, "auditor");
    }
    for (const action of ["read", "get", "list", "view", "search", "preview"])
      assert.equal(authorizer.can({ ...request, action }), true, action);
    assert.equal(
      authorizer.canAll({
        subject,
        scope,
        requirements: [
          { resource: "audit.records", action: "read" },
          { resource: "audit.records", action: "update" },
        ],
      }),
      false,
    );
    assert.equal(
      authorizer.canAny({
        subject,
        scope,
        requirements: [
          { resource: "audit.records", action: "create" },
          { resource: "audit.records", action: "update" },
        ],
      }),
      false,
    );
  });
}

test("direct user restrictions are scoped and cannot grant extra reads", () => {
  const direct = {
    ...subject,
    roleAssignments: [writeAssignment],
    directPrivileges: [
      ciCreateScopedPrivilege(
        { ...restriction, resource: "audit.records" },
        scope,
        "descendants",
      ),
    ],
  };
  const authorizer = ciCreateAuthorizer(definition);
  assert.equal(
    authorizer.authorize({ ...request, subject: direct }).reason,
    "read-only",
  );
  assert.equal(
    authorizer.can({ ...request, subject: direct, resource: "audit.notes" }),
    true,
  );
  const readOnlyUser = { ...direct, roleAssignments: [] };
  assert.equal(
    authorizer.can({ ...request, subject: readOnlyUser, action: "read" }),
    true,
  );
  assert.equal(
    authorizer.can({ ...request, subject: readOnlyUser, action: "preview" }),
    false,
  );
  assert.equal(
    authorizer.can({
      ...request,
      subject: readOnlyUser,
      action: "read",
      scope: { kind: "tenant", tenantId: "other" },
    }),
    false,
  );
});

test("restrictions follow scope propagation, grant windows, and active inheritance", () => {
  const clock = () => new Date("2026-09-17T12:00:00Z");
  const authorizer = ciCreateAuthorizer(definition, { clock });
  const orgScope = {
    kind: "orgUnit",
    tenantId: scope.tenantId,
    orgUnitId: "finance",
  } as const;
  assert.equal(
    authorizer.authorize({ ...request, scope: orgScope }).reason,
    "read-only",
  );
  for (const grant of [
    { propagation: "exact" as const },
    { expiresAt: "2026-09-17T12:00:00Z" },
    { validFrom: "2026-09-18T00:00:00Z" },
    { expiresAt: "invalid" },
    { scope: { kind: "tenant", tenantId: "other" } as const },
  ]) {
    const scopedSubject = {
      ...subject,
      roleAssignments: [{ ...auditAssignment, ...grant }, writeAssignment],
    };
    assert.equal(
      authorizer.can({ ...request, subject: scopedSubject, scope: orgScope }),
      true,
    );
  }
  const suspended = ciMergeAccessControlDefinitions(definition, {
    roles: [
      {
        id: "auditor",
        status: "suspended",
        statusChange: {
          changedAt: clock().toISOString(),
          changedBy: "admin",
          reason: "Paused",
        },
      },
    ],
  });
  assert.equal(ciCreateAuthorizer(suspended).can(request), true);
});

test("expired direct restrictions, explicit denies, and disabled restrictions retain normal behavior", () => {
  const authorizer = ciCreateAuthorizer(definition);
  const directSubject = {
    ...subject,
    roleAssignments: [writeAssignment],
    directPrivileges: [
      ciCreateScopedPrivilege(restriction, scope, "exact", {
        expiresAt: "2000-01-01T00:00:00Z",
      }),
    ],
  };
  assert.equal(authorizer.can({ ...request, subject: directSubject }), true);
  const denyRead = {
    ...writer,
    id: "deny-read",
    effect: "deny" as const,
    action: "read",
  };
  assert.equal(
    authorizer.can({
      ...request,
      action: "read",
      subject: {
        ...subject,
        directPrivileges: [ciCreateScopedPrivilege(denyRead, scope, "exact")],
      },
    }),
    false,
  );
  const disabled = ciMergeAccessControlDefinitions(definition, {
    roles: [
      { id: "auditor", privileges: [{ id: restriction.id, readOnly: false }] },
    ],
  });
  assert.equal(ciCreateAuthorizer(disabled).can(request), true);
});

test("unknown requests and unauthenticated subjects remain denied", () => {
  const authorizer = ciCreateAuthorizer(definition);
  assert.equal(
    authorizer.authorize({ ...request, resource: "audit.missing" }).reason,
    "unknown-resource",
  );
  assert.equal(
    authorizer.authorize({ ...request, action: "missing" }).reason,
    "unknown-action",
  );
  assert.equal(
    authorizer.authorize({
      ...request,
      subject: { ...subject, authenticated: false },
    }).reason,
    "unauthenticated",
  );
});

test("catalog rejects malformed flags and access modes", () => {
  for (const value of ["true", 1, null]) {
    const invalid: CiAccessControlDefinition = JSON.parse(
      JSON.stringify(definition),
    );
    Object.assign(invalid.roles[0]!.privileges[0]!, { readOnly: value });
    assert.throws(() => ciCreateAuthorizer(invalid), /read-only restriction/);
  }
  const invalid: CiAccessControlDefinition = JSON.parse(
    JSON.stringify(definition),
  );
  Object.assign(invalid.resources[0]!.actions[0]!, { accessMode: "readonly" });
  assert.throws(() => ciCreateAuthorizer(invalid), /access mode/);
});

test("an audited override cannot permanently disable the bootstrap capability", () => {
  assert.throws(
    () =>
      ciCreateCoreAccessControlOverride({
        id: "restrict-bootstrap",
        expectedRevision: 0,
        reason: "Test restriction",
        subject: {
          id: "root",
          authenticated: true,
          roleAssignments: [
            ciCreateRoleAssignment(
              "system-super-admin",
              { kind: "system" },
              "exact",
            ),
          ],
        },
        currentDefinition: CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
        layer: {
          roles: [
            {
              id: "system-super-admin",
              privileges: [
                { id: "override-core-access-control", readOnly: true },
              ],
            },
          ],
        },
      }),
    /preserve system-super-admin bootstrap access/,
  );
});
