import assert from "node:assert/strict";
import test from "node:test";
import {
  ciIsAuthorizationSuspended,
  ciCreateAuthorizer,
} from "@ci-emberguard/lib";
import type {
  CiAccessControlDefinition,
  CiAuthorizationRequest,
  CiRoleAssignment,
} from "@ci-emberguard/types";

const change = {
  changedAt: "2026-09-19T00:00:00Z",
  changedBy: "administrator",
  reason: "Administrative suspension",
};
const options = { clock: () => new Date("2026-09-19T12:00:00Z") };
function catalog(): CiAccessControlDefinition {
  return {
    domains: [{ id: "work", title: "Work" }],
    resources: [
      {
        id: "work.tasks",
        domainId: "work",
        title: "Tasks",
        actions: [{ id: "read", title: "Read" }],
        scopeKinds: ["system", "tenant"],
      },
    ],
    roles: [
      {
        id: "reader",
        title: "Reader",
        precedence: 10,
        privileges: [
          {
            id: "read-tasks",
            title: "Read tasks",
            effect: "allow",
            resource: "work.tasks",
            action: "read",
            scopeKinds: ["system", "tenant"],
          },
        ],
      },
    ],
  };
}
function request(
  assignments: readonly CiRoleAssignment[] = [
    { roleId: "reader", scope: { kind: "system" }, propagation: "exact" },
  ]
): CiAuthorizationRequest {
  return {
    subject: {
      id: "person",
      authenticated: true,
      roleAssignments: assignments,
    },
    resource: "work.tasks",
    action: "read",
    scope: { kind: "system" },
  };
}

for (const entry of ["roles", "resources", "domains"] as const) {
  test(`a retained grant blocked by suspended ${entry} is recognized without changing policy`, () => {
    const definition = catalog();
    definition[entry][0]!.status = "suspended";
    definition[entry][0]!.statusChange = change;
    const before = structuredClone(definition);
    assert.equal(
      ciIsAuthorizationSuspended(definition, [request()], options),
      true
    );
    assert.deepEqual(definition, before);
    assert.equal(ciCreateAuthorizer(definition).can(request()), false);
  });
  test(`suspended ${entry} never implies access was granted to an unassigned visitor`, () => {
    const definition = catalog();
    definition[entry][0]!.status = "suspended";
    definition[entry][0]!.statusChange = change;
    assert.equal(
      ciIsAuthorizationSuspended(definition, [request([])], options),
      false
    );
  });
}

test("expired, future and wrong-scope grants do not imply suspended access", () => {
  const definition = catalog();
  definition.roles[0]!.status = "suspended";
  definition.roles[0]!.statusChange = change;
  for (const grant of [
    {
      roleId: "reader",
      scope: { kind: "system" },
      propagation: "exact",
      expiresAt: "2026-09-18T00:00:00Z",
    },
    {
      roleId: "reader",
      scope: { kind: "system" },
      propagation: "exact",
      validFrom: "2026-09-20T00:00:00Z",
    },
    {
      roleId: "reader",
      scope: { kind: "tenant", tenantId: "another" },
      propagation: "exact",
    },
  ] satisfies CiRoleAssignment[])
    assert.equal(
      ciIsAuthorizationSuspended(definition, [request([grant])], options),
      false
    );
});

test("an inherited suspension is recognized, while an unrelated suspended role is insufficient", () => {
  const definition = catalog();
  definition.roles[0]!.status = "suspended";
  definition.roles[0]!.statusChange = change;
  definition.roles = [
    ...definition.roles,
    {
      id: "manager",
      title: "Manager",
      precedence: 5,
      inherits: ["reader"],
      privileges: [],
    },
  ];
  assert.equal(
    ciIsAuthorizationSuspended(
      definition,
      [
        request([
          {
            roleId: "manager",
            scope: { kind: "system" },
            propagation: "exact",
          },
        ]),
      ],
      options
    ),
    true
  );
  definition.roles[0]!.privileges = [];
  assert.equal(
    ciIsAuthorizationSuspended(definition, [request()], options),
    false
  );
});

test("explicit denial, sign-out and already allowed access are not called suspension", () => {
  const definition = catalog();
  const input = request();
  assert.equal(ciIsAuthorizationSuspended(definition, [input], options), false);
  definition.resources[0]!.status = "suspended";
  definition.resources[0]!.statusChange = change;
  input.subject.directPrivileges = [
    {
      scope: { kind: "system" },
      propagation: "exact",
      privilege: {
        id: "deny-read",
        title: "Deny read",
        effect: "deny",
        resource: "work.tasks",
        action: "read",
        scopeKinds: ["system"],
      },
    },
  ];
  assert.equal(ciIsAuthorizationSuspended(definition, [input], options), false);
  input.subject.authenticated = false;
  assert.equal(ciIsAuthorizationSuspended(definition, [input], options), false);
});
