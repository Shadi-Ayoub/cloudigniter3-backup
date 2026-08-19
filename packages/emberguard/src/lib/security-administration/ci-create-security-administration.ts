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
  CiSecurityResourceDomainRecord,
  CiSecurityRoleRecord,
  CiSecurityRoleCountersById,
  CiSetSecurityRoleStatusInput,
  CiSetSecurityResourceStatusInput,
  CiCreateSecurityResourceDomainInput,
  CiSetSecurityResourceDomainStatusInput,
  CiSecurityStoredRoleAssignment,
} from "../../types";

import {
  ciApplyCoreAccessControlOverrides,
  ciCreateCoreAccessControlOverride,
  ciGetAccessControlEntryOrigin,
  ciIsCoreAccessControlEntry,
} from "../access-control/ci-core-access-control";
import { ciIsAccessControlKebabIdentifier } from "../access-control/ci-access-control-identifiers";
import {
  ciCreateAuthorizationSubject,
  ciCreateRoleAssignments,
} from "../access-control/ci-authorization-grants";
import { ciCreateAuthorizer } from "../access-control/ci-create-authorizer";
import { ciMatchesAuthorizationPattern } from "../access-control/ci-authorization-pattern";
import { ciMigrateLegacyPrivilegeTitles } from "../access-control/ci-migrate-legacy-privilege-titles";
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
    canManageCore: authorizer.can({
      subject,
      scope: { kind: "system" },
      resource: "platform.authorization.core",
      action: "override",
    }),
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
  capabilities: CiSecurityCapabilities,
  roleCounters: CiSecurityRoleCountersById
): CiSecurityRoleRecord[] {
  return definition.roles.map((role) => {
    const counters = roleCounters[role.id];
    if (!counters) {
      throw new Error(`Missing persisted counters for role "${role.id}".`);
    }

    return {
      kind: "role",
      id: role.id,
      title: role.title,
      description: role.description,
      status: role.status ?? "active",
      statusChange: role.statusChange ? { ...role.statusChange } : undefined,
      precedence: role.precedence,
      inherits: [...(role.inherits ?? [])],
      privileges: role.privileges.map((privilege) => ({
        ...privilege,
        scopeKinds: [...privilege.scopeKinds],
      })),
      ...counters,
      ...getEntryState({ kind: "role", roleId: role.id }, capabilities),
    };
  });
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
        title: privilege.title,
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
    status: resource.status ?? "active",
    statusChange: resource.statusChange ? { ...resource.statusChange } : undefined,
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

/** Converts resource domains into alphabetically ordered administration rows. */
function buildResourceDomainRecords(
  definition: CiAccessControlDefinition,
  capabilities: CiSecurityCapabilities
): CiSecurityResourceDomainRecord[] {
  return definition.domains
    .map((domain) => ({
      id: domain.id,
      title: domain.title,
      description: domain.description,
      status: domain.status ?? "active",
      statusChange: domain.statusChange ? { ...domain.statusChange } : undefined,
      resourceCount: definition.resources.filter(
        (resource) => resource.domainId === domain.id
      ).length,
      ...getEntryState({ kind: "domain", domainId: domain.id }, capabilities),
    }))
    .sort(
      (left, right) =>
        left.title.localeCompare(right.title, undefined, {
          sensitivity: "base",
        }) || left.id.localeCompare(right.id)
    );
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
      title: group.id.replaceAll(/[ _-]+/g, " "),
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
      if (roleId === "system-super-admin") return true;
      if (visited.has(roleId)) return false;
      const nextVisited = new Set(visited).add(roleId);
      return (inheritance.get(roleId) ?? []).some((inheritedRoleId) =>
        reachesSystemSuperAdmin(inheritedRoleId, nextVisited)
      );
    };

    if (reachesSystemSuperAdmin(record.id, new Set())) {
      throw new Error(
        "Application roles cannot inherit system-super-admin directly or indirectly."
      );
    }
  }

  if (
    (record.kind === "permission" &&
      record.roleId !== "system-super-admin" &&
      record.effect === "allow" &&
      record.scopeKinds.includes("system") &&
      ciMatchesAuthorizationPattern(
        record.resource,
        "platform.authorization.core"
      ) &&
      ciMatchesAuthorizationPattern(record.action, "override")) ||
    (record.kind === "role" &&
      record.id !== "system-super-admin" &&
      record.privileges.some(
        (privilege) =>
          privilege.effect === "allow" &&
          privilege.scopeKinds.includes("system") &&
          ciMatchesAuthorizationPattern(
            privilege.resource,
            "platform.authorization.core"
          ) &&
          ciMatchesAuthorizationPattern(privilege.action, "override")
      ))
  ) {
    throw new Error(
      "Only system-super-admin may grant the core override capability."
    );
  }
}

/** Rejects incomplete records before invoking a persistence adapter. */
function assertSecurityRecordIsComplete(record: CiSecurityRecord): void {
  if (record.kind !== "assignment" && record.id.startsWith("new-")) {
    throw new Error("A stable identifier is required.");
  }
  if (
    record.kind === "role" &&
    (!record.id.trim() ||
      !record.title.trim() ||
      !Array.isArray(record.privileges))
  ) {
    throw new Error(
      "Role identifier, display name, and privilege selection are required."
    );
  }
  if (
    record.origin === "application" &&
    (record.kind === "role" || record.kind === "permission") &&
    !ciIsAccessControlKebabIdentifier(record.id)
  ) {
    throw new Error(
      "Application role and privilege identifiers must use lowercase kebab case, start with a letter, and contain only lowercase letters, digits, and single hyphens."
    );
  }
  if (
    record.kind === "permission" &&
    (!record.id.trim() ||
      !record.title.trim() ||
      !record.roleId.trim() ||
      !record.resource.trim() ||
      !record.action.trim() ||
      record.scopeKinds.length === 0)
  ) {
    throw new Error(
      "Permission identifier, display name, role, resource, action, and scopes are required."
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
    (!record.subjectId.trim() ||
      !ciIsAccessControlKebabIdentifier(record.roleId))
  ) {
    throw new Error(
      "Assignment subject is required and its role must use lowercase kebab case."
    );
  }
}

/** Converts an editable catalog record into a merge layer. */
function buildAccessControlLayer(
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
          privileges: record.privileges,
          privilegesMode: "replace",
          status: record.status,
          statusChange: record.statusChange,
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
              title: record.title,
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
  const clock = options.clock ?? (() => new Date());

  /** Loads the persisted definition with the configured definition as fallback. */
  async function loadDefinition(): Promise<CiAccessControlDefinition> {
    return ciMigrateLegacyPrivilegeTitles(
      (await options.repository.getAccessControlDefinition()) ??
        options.definition,
      options.definition
    );
  }

  /** Loads persisted scoped role assignments. */
  async function loadAssignments() {
    return options.repository.listRoleAssignments();
  }

  /** Loads the mutation-maintained role-counter projection. */
  async function loadRoleCounters() {
    return options.repository.getRoleCounters();
  }

  /** Builds records for every security administration aspect. */
  function buildRecords(
    definition: CiAccessControlDefinition,
    assignments: readonly CiSecurityStoredRoleAssignment[],
    roleCounters: CiSecurityRoleCountersById
  ): CiSecurityRecordsByKind {
    return {
      role: buildRoleRecords(definition, capabilities, roleCounters),
      permission: buildPermissionRecords(definition, capabilities),
      resource: buildResourceRecords(definition, capabilities),
      assignment: buildAssignmentRecords(assignments, capabilities),
      "identity-group": buildIdentityGroupRecords(
        definition,
        options.identityGroups ?? []
      ),
    };
  }

  /** Builds the domain-management rows in deterministic alphabetical order. */
  function buildResourceDomains(
    definition: CiAccessControlDefinition
  ): CiSecurityResourceDomainRecord[] {
    return buildResourceDomainRecords(definition, capabilities);
  }

  /** Creates one application-owned resource domain in the active definition. */
  async function createResourceDomain(
    input: CiCreateSecurityResourceDomainInput
  ): Promise<void> {
    const id = input.id.trim();
    const title = input.title.trim();
    if (!ciIsAccessControlKebabIdentifier(id)) {
      throw new Error(
        "Resource-domain identifiers must use lowercase kebab case, start with a letter, and contain only lowercase letters, digits, and single hyphens."
      );
    }
    if (!title) {
      throw new Error("A resource-domain display name is required.");
    }

    const current = await loadDefinition();
    const currentCapabilities = resolveSecurityCapabilities(
      { ...options, definition: current },
      subject
    );
    if (!currentCapabilities.canManageApplication) {
      throw new Error("You cannot manage application access control.");
    }
    if (current.domains.some((domain) => domain.id === id)) {
      throw new Error(`Resource domain "${id}" already exists.`);
    }

    const next = ciMergeAccessControlDefinitions(current, {
      domains: [
        {
          id,
          title,
          description: input.description?.trim() || undefined,
          status: "active",
        },
      ],
    });
    await options.repository.saveAccessControlDefinition(next);
  }

  /** Suspends or restores every authorization resource in one domain. */
  async function setResourceDomainStatus(
    input: CiSetSecurityResourceDomainStatusInput
  ): Promise<void> {
    const reason = input.reason.trim();
    if (!reason) {
      throw new Error("A reason is required to change a resource domain's status.");
    }
    if (input.status !== "active" && input.status !== "suspended") {
      throw new Error(
        'Resource-domain status must be either "active" or "suspended".'
      );
    }
    if (input.domainId === "platform" && input.status === "suspended") {
      throw new Error(
        "The platform resource domain cannot be suspended because it contains the access-control recovery path."
      );
    }

    const current = await loadDefinition();
    const currentCapabilities = resolveSecurityCapabilities(
      { ...options, definition: current },
      subject
    );
    if (!currentCapabilities.canManageApplication) {
      throw new Error("You cannot manage application access control.");
    }
    const domain = current.domains.find((item) => item.id === input.domainId);
    if (!domain) {
      throw new Error(`Unknown resource domain "${input.domainId}".`);
    }

    const reference = { kind: "domain", domainId: domain.id } as const;
    const isCore = ciIsCoreAccessControlEntry(reference);
    if (isCore && !currentCapabilities.canManageCore) {
      throw new Error(
        "Only a system super administrator can suspend or restore a core resource domain."
      );
    }
    if ((domain.status ?? "active") === input.status) return;

    const layer: CiAccessControlLayer = {
      domains: [
        {
          id: domain.id,
          status: input.status,
          statusChange: {
            changedAt: clock().toISOString(),
            changedBy: options.actor.id,
            reason,
          },
        },
      ],
    };
    const next = isCore
      ? ciApplyCoreAccessControlOverrides(current, [
          ciCreateCoreAccessControlOverride({
            id: createId(),
            expectedRevision: 0,
            reason,
            subject,
            currentDefinition: current,
            layer,
          }),
        ])
      : ciMergeAccessControlDefinitions(current, layer);
    ciAssertValidAccessControlDefinition(next);
    await options.repository.saveAccessControlDefinition(next);
  }

  /** Suspends or restores one resource while preserving its catalog policy. */
  async function setResourceStatus(
    input: CiSetSecurityResourceStatusInput
  ): Promise<void> {
    const reason = input.reason.trim();
    if (!reason) {
      throw new Error("A reason is required to change a resource's status.");
    }
    if (input.status !== "active" && input.status !== "suspended") {
      throw new Error('Resource status must be either "active" or "suspended".');
    }
    if (
      input.status === "suspended" &&
      (input.resourceId === "platform.authorization" ||
        input.resourceId === "platform.authorization.core")
    ) {
      throw new Error(
        "Access-control recovery resources cannot be suspended because they preserve the administration and break-glass paths."
      );
    }

    const current = await loadDefinition();
    const currentCapabilities = resolveSecurityCapabilities(
      { ...options, definition: current },
      subject
    );
    if (!currentCapabilities.canManageApplication) {
      throw new Error("You cannot manage application access control.");
    }
    const resource = current.resources.find(
      (item) => item.id === input.resourceId
    );
    if (!resource) {
      throw new Error(`Unknown resource "${input.resourceId}".`);
    }

    const reference = { kind: "resource", resourceId: resource.id } as const;
    const isCore = ciIsCoreAccessControlEntry(reference);
    if (isCore && !currentCapabilities.canManageCore) {
      throw new Error(
        "Only a system super administrator can suspend or restore a core resource."
      );
    }
    if ((resource.status ?? "active") === input.status) return;

    const layer: CiAccessControlLayer = {
      resources: [
        {
          id: resource.id,
          status: input.status,
          statusChange: {
            changedAt: clock().toISOString(),
            changedBy: options.actor.id,
            reason,
          },
        },
      ],
    };
    const next = isCore
      ? ciApplyCoreAccessControlOverrides(current, [
          ciCreateCoreAccessControlOverride({
            id: createId(),
            expectedRevision: 0,
            reason,
            subject,
            currentDefinition: current,
            layer,
          }),
        ])
      : ciMergeAccessControlDefinitions(current, layer);
    ciAssertValidAccessControlDefinition(next);
    await options.repository.saveAccessControlDefinition(next);
  }

  /** Validates and persists one editable administration record. */
  async function saveRecord(
    record: CiSecurityRecord,
    reason?: string
  ): Promise<void> {
    const current = await loadDefinition();
    const currentCapabilities = resolveSecurityCapabilities(
      { ...options, definition: current },
      subject
    );
    assertCanManage(record, currentCapabilities);
    assertSecurityRecordIsComplete(record);

    if (record.kind === "assignment") {
      const scope = buildAssignmentScope(record);
      await options.repository.putRoleAssignment({
        id: record.id.startsWith("new-") ? createId() : record.id,
        subjectId: record.subjectId,
        roleId: record.roleId,
        scope,
        tenantId:
          scope.kind === "tenant" || scope.kind === "orgUnit"
            ? scope.tenantId
            : undefined,
        propagation: record.propagation,
        expiresAt: record.expiresAt,
      });
      return;
    }
    if (record.kind === "identity-group") {
      throw new Error("Identity-provider groups are read-only.");
    }

    if (record.kind === "resource") {
      const targetDomain = current.domains.find(
        (domain) => domain.id === record.domainId
      );
      const currentResource = current.resources.find(
        (resource) => resource.id === record.id
      );
      if ((record.status ?? "active") !== (currentResource?.status ?? "active")) {
        await setResourceStatus({
          resourceId: record.id,
          status: record.status ?? "active",
          reason: reason ?? "",
        });
        return;
      }
      if (!targetDomain) {
        throw new Error(`Unknown resource domain "${record.domainId}".`);
      }
      if (
        targetDomain.status === "suspended" &&
        currentResource?.domainId !== targetDomain.id
      ) {
        throw new Error(
          `Resource domain "${targetDomain.id}" is suspended and cannot accept new resources.`
        );
      }
    }

    assertApplicationEntryDoesNotEscalateCore(current, record);
    const layer = buildAccessControlLayer(record);
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

  /** Suspends or restores a role without removing its assignments or policy. */
  async function setRoleStatus(
    input: CiSetSecurityRoleStatusInput
  ): Promise<void> {
    const reason = input.reason.trim();
    if (!reason) {
      throw new Error("A reason is required to change a role's status.");
    }
    if (input.status !== "active" && input.status !== "suspended") {
      throw new Error('Role status must be either "active" or "suspended".');
    }
    if (input.roleId === "system-super-admin" && input.status === "suspended") {
      throw new Error(
        "The system-super-admin break-glass role cannot be suspended."
      );
    }

    const current = await loadDefinition();
    const currentCapabilities = resolveSecurityCapabilities(
      { ...options, definition: current },
      subject
    );
    if (!currentCapabilities.canManageApplication) {
      throw new Error("You cannot manage application access control.");
    }
    const role = current.roles.find((item) => item.id === input.roleId);
    if (!role) {
      throw new Error(`Unknown role "${input.roleId}".`);
    }

    const reference = { kind: "role", roleId: role.id } as const;
    const isCore = ciIsCoreAccessControlEntry(reference);
    if (isCore && !currentCapabilities.canManageCore) {
      throw new Error(
        "Only a system super administrator can suspend or restore a core role."
      );
    }
    if ((role.status ?? "active") === input.status) return;

    const layer: CiAccessControlLayer = {
      roles: [
        {
          id: role.id,
          status: input.status,
          statusChange: {
            changedAt: clock().toISOString(),
            changedBy: options.actor.id,
            reason,
          },
        },
      ],
    };
    const next = isCore
      ? ciApplyCoreAccessControlOverrides(current, [
          ciCreateCoreAccessControlOverride({
            id: createId(),
            expectedRevision: 0,
            reason,
            subject,
            currentDefinition: current,
            layer,
          }),
        ])
      : ciMergeAccessControlDefinitions(current, layer);
    ciAssertValidAccessControlDefinition(next);
    await options.repository.saveAccessControlDefinition(next);
  }

  /** Deletes one application-owned catalog record or role assignment. */
  async function deleteRecord(record: CiSecurityRecord): Promise<void> {
    const current = await loadDefinition();
    const currentCapabilities = resolveSecurityCapabilities(
      { ...options, definition: current },
      subject
    );
    assertCanManage(record, currentCapabilities);
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

    await options.repository.saveAccessControlDefinition(
      removeCatalogRecord(current, record)
    );
  }

  return {
    capabilities,
    loadDefinition,
    loadAssignments,
    loadRoleCounters,
    buildRecords,
    buildResourceDomains,
    createResourceDomain,
    setResourceDomainStatus,
    setResourceStatus,
    saveRecord,
    setRoleStatus,
    deleteRecord,
  };
}
