import type {
  CiAccessControlDefinition,
  CiAccessControlEntryReference,
  CiAccessControlLayer,
  CiAccessScope,
  CiAuthorizationSubject,
  CiSecurityAdministration,
  CiSecurityAdministrationOptions,
  CiSecurityAssignmentRecord,
  CiSecurityCapabilities,
  CiSecurityIdentityGroup,
  CiSecurityIdentityGroupRecord,
  CiSecurityPermissionRecord,
  CiSecurityRecord,
  CiSecurityRecordsByKind,
  CiSecurityResourceRecord,
  CiSecurityRoleRecord,
  CiSecurityStoredRoleAssignment,
} from "../../types";

import {
  ciApplyCoreAccessControlOverrides,
  ciCreateCoreAccessControlOverride,
  ciGetAccessControlEntryOrigin,
  ciIsCoreAccessControlEntry,
} from "../access-control/ci-core-access-control";
import {
  ciCreateAuthorizationSubject,
  ciCreateRoleAssignments,
} from "../access-control/ci-authorization-grants";
import { ciCreateAuthorizer } from "../access-control/ci-create-authorizer";
import { ciMatchesAuthorizationPattern } from "../access-control/ci-authorization-pattern";
import { ciMergeAccessControlDefinitions } from "../access-control/ci-merge-access-control";
import { ciAssertValidAccessControlDefinition } from "../access-control/ci-validate-access-control";

/** Creates the authorization subject used by administration policy checks. */
function createSecuritySubject(
  options: CiSecurityAdministrationOptions
): CiAuthorizationSubject {
  return ciCreateAuthorizationSubject(
    {
      id: options.actor.id,
      authenticated: options.actor.authenticated,
    },
    ciCreateRoleAssignments(options.actor.roleIds, { kind: "system" }, "exact")
  );
}

/** Resolves administrator capabilities from the effective access-control policy. */
function resolveSecurityCapabilities(
  options: CiSecurityAdministrationOptions,
  subject: CiAuthorizationSubject
): CiSecurityCapabilities {
  const authorizer = ciCreateAuthorizer(options.definition);
  const can = (action: "read" | "manage") =>
    authorizer.can({
      subject,
      scope: { kind: "system" },
      resource: "platform.authorization",
      action,
    });

  return {
    canRead: can("read"),
    canManageApplication: can("manage"),
    canManageAssignments: can("manage"),
    canManageCore: options.actor.roleIds.includes("SYSTEM_SUPER_ADMIN"),
    actorRole: options.actor.primaryRole,
  };
}

/** Resolves origin and edit protection for a catalog reference. */
function getEntryState(
  reference: CiAccessControlEntryReference,
  capabilities: CiSecurityCapabilities
) {
  const origin = ciGetAccessControlEntryOrigin(reference);
  return {
    origin,
    locked: origin === "core" && !capabilities.canManageCore,
  } as const;
}

/** Converts access-control roles into administration records. */
function buildRoleRecords(
  definition: CiAccessControlDefinition,
  capabilities: CiSecurityCapabilities
): CiSecurityRoleRecord[] {
  return definition.roles.map((role) => ({
    kind: "role",
    id: role.id,
    title: role.title,
    description: role.description,
    precedence: role.precedence,
    inherits: [...(role.inherits ?? [])],
    permissionCount: role.privileges.length,
    ...getEntryState({ kind: "role", roleId: role.id }, capabilities),
  }));
}

/** Flattens role privileges into administration permission records. */
function buildPermissionRecords(
  definition: CiAccessControlDefinition,
  capabilities: CiSecurityCapabilities
): CiSecurityPermissionRecord[] {
  return definition.roles.flatMap((role) =>
    role.privileges.map((privilege) => {
      const resource = definition.resources.find(
        (item) => item.id === privilege.resource
      );
      const action = resource?.actions.find(
        (item) => item.id === privilege.action
      );

      return {
        kind: "permission" as const,
        id: privilege.id,
        title:
          privilege.description ??
          `${privilege.effect} ${privilege.resource}.${privilege.action}`,
        description: privilege.description,
        roleId: role.id,
        effect: privilege.effect,
        resource: privilege.resource,
        action: privilege.action,
        scopeKinds: [...privilege.scopeKinds],
        sensitive: action?.sensitive ?? privilege.action === "*",
        ...getEntryState(
          { kind: "privilege", roleId: role.id, privilegeId: privilege.id },
          capabilities
        ),
      };
    })
  );
}

/** Converts the resource catalog into administration records. */
function buildResourceRecords(
  definition: CiAccessControlDefinition,
  capabilities: CiSecurityCapabilities
): CiSecurityResourceRecord[] {
  return definition.resources.map((resource) => ({
    kind: "resource",
    id: resource.id,
    title: resource.title,
    description: resource.description,
    domainId: resource.domainId,
    actions: resource.actions.map((action) => action.id),
    scopeKinds: [...resource.scopeKinds],
    sensitiveActionCount: resource.actions.filter((action) => action.sensitive)
      .length,
    ...getEntryState(
      { kind: "resource", resourceId: resource.id },
      capabilities
    ),
  }));
}

/** Resolves a compact display identifier for an assignment scope. */
function getAssignmentScopeId(scope: CiAccessScope): string | undefined {
  if (scope.kind === "tenant") {
    return scope.tenantId;
  }
  if (scope.kind === "orgUnit") {
    return `${scope.tenantId}:${scope.orgUnitId}`;
  }
  return undefined;
}

/** Converts persisted assignments into administration records. */
function buildAssignmentRecords(
  assignments: readonly CiSecurityStoredRoleAssignment[],
  capabilities: CiSecurityCapabilities
): CiSecurityAssignmentRecord[] {
  return assignments.map((assignment) => ({
    kind: "assignment",
    id: assignment.id,
    title: `${assignment.subjectId} → ${assignment.roleId}`,
    description: "Scoped role assignment",
    subjectId: assignment.subjectId,
    roleId: assignment.roleId,
    scopeKind: assignment.scope.kind,
    scopeId: getAssignmentScopeId(assignment.scope),
    propagation: assignment.propagation,
    expiresAt: assignment.expiresAt,
    origin: "application",
    locked: !capabilities.canManageAssignments,
  }));
}

/** Sorts provider identity groups by their configured precedence. */
function sortIdentityGroups(
  identityGroups: readonly CiSecurityIdentityGroup[]
): CiSecurityIdentityGroup[] {
  return [...identityGroups].sort(
    (left, right) =>
      (left.precedence ?? Number.MAX_SAFE_INTEGER) -
      (right.precedence ?? Number.MAX_SAFE_INTEGER)
  );
}

/** Maps provider identity groups to catalog roles and reports precedence drift. */
function buildIdentityGroupRecords(
  definition: CiAccessControlDefinition,
  identityGroups: readonly CiSecurityIdentityGroup[]
): CiSecurityIdentityGroupRecord[] {
  const roleById = new Map(definition.roles.map((role) => [role.id, role]));
  const providerGroups = sortIdentityGroups(identityGroups);
  const mappedProviderGroups = providerGroups.filter((group) =>
    roleById.has(group.id)
  );
  const catalogGroups = [...mappedProviderGroups].sort(
    (left, right) =>
      (roleById.get(left.id)?.precedence ?? Number.MAX_SAFE_INTEGER) -
      (roleById.get(right.id)?.precedence ?? Number.MAX_SAFE_INTEGER)
  );
  const providerRank = new Map(
    mappedProviderGroups.map((group, index) => [group.id, index])
  );
  const catalogRank = new Map(
    catalogGroups.map((group, index) => [group.id, index])
  );

  return providerGroups.map((group) => {
    const role = roleById.get(group.id);
    const status = !role
      ? "unmapped"
      : providerRank.get(group.id) === catalogRank.get(group.id)
      ? "mapped"
      : "drift";

    return {
      kind: "identity-group",
      id: group.id,
      title: group.id.replaceAll("_", " "),
      description: role
        ? `Maps to ${role.title}`
        : "No matching CloudIgniter role",
      origin: "provider",
      locked: true,
      provider: group.provider,
      providerGroup: group.id,
      roleId: role?.id ?? "",
      precedence: group.precedence,
      status,
    };
  });
}

/** Creates a concrete assignment scope from an editable record. */
function buildAssignmentScope(
  record: CiSecurityAssignmentRecord
): CiAccessScope {
  if (record.scopeKind === "system" || record.scopeKind === "global") {
    return { kind: record.scopeKind };
  }
  if (!record.scopeId) {
    throw new Error("A tenant or Org Unit scope ID is required.");
  }
  if (record.scopeKind === "tenant") {
    return { kind: "tenant", tenantId: record.scopeId };
  }
  const [tenantId, orgUnitId = record.scopeId] = record.scopeId.split(":");
  if (!tenantId) {
    throw new Error("An Org Unit scope requires a tenant ID.");
  }
  return { kind: "orgUnit", tenantId, orgUnitId };
}

/** Requires the appropriate management capability for a record. */
function assertCanManage(
  record: CiSecurityRecord,
  capabilities: CiSecurityCapabilities
): void {
  if (record.kind === "identity-group") {
    throw new Error(
      "Identity-provider groups are synchronized by the provider adapter."
    );
  }
  if (record.kind === "assignment") {
    if (!capabilities.canManageAssignments) {
      throw new Error("You cannot manage role assignments.");
    }
    return;
  }
  if (!capabilities.canManageApplication) {
    throw new Error("You cannot manage application access control.");
  }
  if (record.origin === "core" && !capabilities.canManageCore) {
    throw new Error(
      "Only a system super administrator can override a core entry."
    );
  }
}

/** Prevents application records from acquiring core override authority. */
function assertApplicationEntryDoesNotEscalateCore(
  current: CiAccessControlDefinition,
  record: CiSecurityRecord
): void {
  if (record.kind === "role") {
    const inheritance = new Map(
      current.roles.map((role) => [role.id, [...(role.inherits ?? [])]])
    );
    inheritance.set(record.id, record.inherits);

    /** Checks whether one inheritance path reaches the protected role. */
    const reachesSystemSuperAdmin = (
      roleId: string,
      visited: ReadonlySet<string>
    ): boolean => {
      if (roleId === "SYSTEM_SUPER_ADMIN") return true;
      if (visited.has(roleId)) return false;
      const nextVisited = new Set(visited).add(roleId);
      return (inheritance.get(roleId) ?? []).some((inheritedRoleId) =>
        reachesSystemSuperAdmin(inheritedRoleId, nextVisited)
      );
    };

    if (reachesSystemSuperAdmin(record.id, new Set())) {
      throw new Error(
        "Application roles cannot inherit SYSTEM_SUPER_ADMIN directly or indirectly."
      );
    }
  }

  if (
    record.kind === "permission" &&
    record.effect === "allow" &&
    record.scopeKinds.includes("system") &&
    ciMatchesAuthorizationPattern(
      record.resource,
      "platform.authorization.core"
    ) &&
    ciMatchesAuthorizationPattern(record.action, "override") &&
    record.roleId !== "SYSTEM_SUPER_ADMIN"
  ) {
    throw new Error(
      "Only SYSTEM_SUPER_ADMIN may grant the core override capability."
    );
  }
}

/** Rejects incomplete records before invoking a persistence adapter. */
function assertSecurityRecordIsComplete(record: CiSecurityRecord): void {
  if (record.kind !== "assignment" && record.id.startsWith("new-")) {
    throw new Error("A stable identifier is required.");
  }
  if (record.kind === "role" && (!record.id.trim() || !record.title.trim())) {
    throw new Error("Role identifier and display name are required.");
  }
  if (
    record.kind === "permission" &&
    (!record.id.trim() ||
      !record.roleId.trim() ||
      !record.resource.trim() ||
      !record.action.trim() ||
      record.scopeKinds.length === 0)
  ) {
    throw new Error(
      "Permission identifier, role, resource, action, and scopes are required."
    );
  }
  if (
    record.kind === "resource" &&
    (!record.id.trim() ||
      !record.title.trim() ||
      !record.domainId.trim() ||
      record.actions.length === 0 ||
      record.scopeKinds.length === 0)
  ) {
    throw new Error(
      "Resource identifier, name, domain, actions, and scopes are required."
    );
  }
  if (
    record.kind === "assignment" &&
    (!record.subjectId.trim() || !record.roleId.trim())
  ) {
    throw new Error("Assignment subject and role are required.");
  }
}

/** Converts an editable catalog record into a merge layer. */
function buildAccessControlLayer(
  current: CiAccessControlDefinition,
  record: Exclude<
    CiSecurityRecord,
    CiSecurityAssignmentRecord | CiSecurityIdentityGroupRecord
  >
): CiAccessControlLayer {
  if (record.kind === "role") {
    return {
      roles: [
        {
          id: record.id,
          title: record.title,
          description: record.description,
          precedence: record.precedence,
          inherits: record.inherits,
          privileges:
            current.roles.find((role) => role.id === record.id)?.privileges ??
            [],
        },
      ],
    };
  }
  if (record.kind === "permission") {
    return {
      roles: [
        {
          id: record.roleId,
          privileges: [
            {
              id: record.id,
              description: record.description,
              effect: record.effect,
              resource: record.resource,
              action: record.action,
              scopeKinds: record.scopeKinds,
            },
          ],
        },
      ],
    };
  }
  return {
    resources: [
      {
        id: record.id,
        title: record.title,
        description: record.description,
        domainId: record.domainId,
        scopeKinds: record.scopeKinds,
        actions: record.actions.map((id) => ({
          id,
          title: id.replaceAll("-", " "),
        })),
      },
    ],
  };
}

/** Creates the catalog reference addressed by an editable record. */
function buildEntryReference(
  record: Exclude<
    CiSecurityRecord,
    CiSecurityAssignmentRecord | CiSecurityIdentityGroupRecord
  >
): CiAccessControlEntryReference {
  if (record.kind === "role") {
    return { kind: "role", roleId: record.id };
  }
  if (record.kind === "permission") {
    return {
      kind: "privilege",
      roleId: record.roleId,
      privilegeId: record.id,
    };
  }
  return { kind: "resource", resourceId: record.id };
}

/** Produces a validated definition with one application record removed. */
function removeCatalogRecord(
  current: CiAccessControlDefinition,
  record: Exclude<
    CiSecurityRecord,
    CiSecurityAssignmentRecord | CiSecurityIdentityGroupRecord
  >
): CiAccessControlDefinition {
  const next: CiAccessControlDefinition = {
    domains: current.domains,
    resources:
      record.kind === "resource"
        ? current.resources.filter((item) => item.id !== record.id)
        : current.resources,
    roles:
      record.kind === "role"
        ? current.roles.filter((item) => item.id !== record.id)
        : record.kind === "permission"
        ? current.roles.map((role) =>
            role.id === record.roleId
              ? {
                  ...role,
                  privileges: role.privileges.filter(
                    (item) => item.id !== record.id
                  ),
                }
              : role
          )
        : current.roles,
  };
  ciAssertValidAccessControlDefinition(next);
  return next;
}

/** Returns a runtime-generated identifier or reports unsupported runtimes. */
function createRuntimeId(): string {
  if (typeof globalThis.crypto?.randomUUID !== "function") {
    throw new Error("The current runtime cannot generate a secure identifier.");
  }
  return globalThis.crypto.randomUUID();
}

/**
 * Creates the provider-neutral EmberGuard administration capability.
 *
 * Consumers supply the application definition, current actor, persistence
 * repository, and optional identity-provider group inventory.
 */
export function ciCreateSecurityAdministration(
  options: CiSecurityAdministrationOptions
): CiSecurityAdministration {
  const subject = createSecuritySubject(options);
  const capabilities = resolveSecurityCapabilities(options, subject);
  const createId = options.createId ?? createRuntimeId;

  /** Loads the persisted definition with the configured definition as fallback. */
  async function loadDefinition(): Promise<CiAccessControlDefinition> {
    return (
      (await options.repository.getAccessControlDefinition()) ??
      options.definition
    );
  }

  /** Loads persisted scoped role assignments. */
  function loadAssignments() {
    return options.repository.listRoleAssignments();
  }

  /** Builds records for every security administration aspect. */
  function buildRecords(
    definition: CiAccessControlDefinition,
    assignments: readonly CiSecurityStoredRoleAssignment[] = []
  ): CiSecurityRecordsByKind {
    return {
      role: buildRoleRecords(definition, capabilities),
      permission: buildPermissionRecords(definition, capabilities),
      resource: buildResourceRecords(definition, capabilities),
      assignment: buildAssignmentRecords(assignments, capabilities),
      "identity-group": buildIdentityGroupRecords(
        definition,
        options.identityGroups ?? []
      ),
    };
  }

  /** Validates and persists one editable administration record. */
  async function saveRecord(
    record: CiSecurityRecord,
    reason?: string
  ): Promise<void> {
    assertCanManage(record, capabilities);
    assertSecurityRecordIsComplete(record);

    if (record.kind === "assignment") {
      await options.repository.putRoleAssignment({
        id: record.id.startsWith("new-") ? createId() : record.id,
        subjectId: record.subjectId,
        roleId: record.roleId,
        scope: buildAssignmentScope(record),
        propagation: record.propagation,
        expiresAt: record.expiresAt,
      });
      return;
    }
    if (record.kind === "identity-group") {
      throw new Error("Identity-provider groups are read-only.");
    }

    const current = await loadDefinition();
    assertApplicationEntryDoesNotEscalateCore(current, record);
    const layer = buildAccessControlLayer(current, record);
    const reference = buildEntryReference(record);
    const isCore =
      record.origin === "core" || ciIsCoreAccessControlEntry(reference);
    const next = isCore
      ? ciApplyCoreAccessControlOverrides(current, [
          ciCreateCoreAccessControlOverride({
            id: createId(),
            expectedRevision: 0,
            reason: reason ?? "",
            subject,
            currentDefinition: current,
            layer,
          }),
        ])
      : ciMergeAccessControlDefinitions(current, layer);
    await options.repository.saveAccessControlDefinition(next);
  }

  /** Deletes one application-owned catalog record or role assignment. */
  async function deleteRecord(record: CiSecurityRecord): Promise<void> {
    assertCanManage(record, capabilities);
    if (record.origin === "core") {
      throw new Error(
        "Core entries cannot be deleted; create a reviewed override instead."
      );
    }
    if (record.kind === "assignment") {
      await options.repository.deleteRoleAssignment({
        id: record.id,
        subjectId: record.subjectId,
      });
      return;
    }
    if (record.kind === "identity-group") {
      throw new Error("Identity-provider groups are read-only.");
    }

    const current = await loadDefinition();
    await options.repository.saveAccessControlDefinition(
      removeCatalogRecord(current, record)
    );
  }

  return {
    capabilities,
    loadDefinition,
    loadAssignments,
    buildRecords,
    saveRecord,
    deleteRecord,
  };
}
