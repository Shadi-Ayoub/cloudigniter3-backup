import type {
  CiAccessControlDefinition,
  CiAccessControlEntryOrigin,
  CiAccessControlEntryReference,
  CiAccessControlLayer,
  CiAuthorizationSubject,
  CiCoreAccessControlOverride,
  CiCreateCoreAccessControlOverrideInput,
  CiCreateCoreAccessControlOverrideOptions,
} from "@ci-core/types";

import {
  ciAccessControlLayerHasChanges,
  ciAssertCoreAccessControlOverrideTargets,
  ciAssertExclusiveCoreOverrideRole,
  ciDefinitionContainsAccessControlEntry,
} from "./ci-access-control-protection";
import { ciCreateAuthorizer } from "./ci-create-authorizer";
import { CI_DEFAULT_ACCESS_CONTROL_DEFINITION } from "./ci-default-access-control";
import { ciMergeAccessControlDefinitions } from "./ci-merge-access-control";

const CI_CORE_ACCESS_CONTROL_OVERRIDE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

/** Recursively freezes an override audit record and its nested layer data. */
function deepFreezeOverride<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const nestedValue of Object.values(value)) {
    deepFreezeOverride(nestedValue);
  }

  return Object.freeze(value);
}

/** Copies a serializable access-control layer before retaining it in audit data. */
function cloneAccessControlLayer(
  layer: CiAccessControlLayer
): CiAccessControlLayer {
  return {
    ...(layer.domains
      ? { domains: layer.domains.map((domain) => ({ ...domain })) }
      : {}),
    ...(layer.resources
      ? {
          resources: layer.resources.map((resource) => ({
            ...resource,
            ...(resource.actions
              ? { actions: resource.actions.map((action) => ({ ...action })) }
              : {}),
            ...(resource.scopeKinds
              ? { scopeKinds: [...resource.scopeKinds] }
              : {}),
          })),
        }
      : {}),
    ...(layer.roles
      ? {
          roles: layer.roles.map((role) => ({
            ...role,
            ...(role.inherits ? { inherits: [...role.inherits] } : {}),
            ...(role.privileges
              ? {
                  privileges: role.privileges.map((privilege) => ({
                    ...privilege,
                    ...(privilege.scopeKinds
                      ? { scopeKinds: [...privilege.scopeKinds] }
                      : {}),
                  })),
                }
              : {}),
          })),
        }
      : {}),
  };
}

/** Throws when a resolved catalog weakens its core override bootstrap path. */
function assertCoreOverrideBootstrapInvariants(
  definition: CiAccessControlDefinition
): void {
  ciAssertExclusiveCoreOverrideRole(definition);

  const roles = new Map(definition.roles.map((role) => [role.id, role]));

  /** Returns whether one inheritance branch reaches either business-admin role. */
  function inheritsBusinessAdministrator(
    roleId: string,
    visited: ReadonlySet<string>
  ): boolean {
    if (roleId === "admin" || roleId === "super-admin") {
      return true;
    }

    if (visited.has(roleId)) {
      return false;
    }

    const nextVisited = new Set(visited).add(roleId);
    return (roles.get(roleId)?.inherits ?? []).some((inheritedRoleId) =>
      inheritsBusinessAdministrator(inheritedRoleId, nextVisited)
    );
  }

  if (inheritsBusinessAdministrator("system-admin", new Set())) {
    throw new Error(
      "Core access-control override must preserve separation between technical and business administrator roles."
    );
  }

  const managementResource = definition.resources.find(
    (resource) => resource.id === "platform.authorization.core"
  );
  const overrideAction = managementResource?.actions.find(
    (action) => action.id === "override"
  );

  if (
    managementResource?.domainId !== "platform" ||
    managementResource.scopeKinds.length !== 1 ||
    managementResource.scopeKinds[0] !== "system" ||
    !managementResource.actions.some((action) => action.id === "read") ||
    overrideAction?.sensitive !== true
  ) {
    throw new Error(
      "Core access-control override must preserve the system-only bootstrap administration resource."
    );
  }

  const systemSuperAdmin = definition.roles.find(
    (role) => role.id === "system-super-admin"
  );
  const coreOverrideAccess = systemSuperAdmin?.privileges.find(
    (privilege) => privilege.id === "override-core-access-control"
  );

  if (
    systemSuperAdmin?.precedence !== 0 ||
    !systemSuperAdmin.inherits?.includes("system-admin") ||
    coreOverrideAccess?.effect !== "allow" ||
    coreOverrideAccess.resource !== "platform.authorization.core" ||
    coreOverrideAccess.action !== "override" ||
    coreOverrideAccess.scopeKinds.length !== 1 ||
    coreOverrideAccess.scopeKinds[0] !== "system"
  ) {
    throw new Error(
      "Core access-control override must preserve system-super-admin bootstrap access."
    );
  }
}

/** Validates the non-policy fields carried by an override audit record. */
function assertCoreOverrideRecord(record: CiCoreAccessControlOverride): void {
  if (!CI_CORE_ACCESS_CONTROL_OVERRIDE_ID.test(record.id)) {
    throw new Error(`Invalid core access-control override ID "${record.id}".`);
  }

  if (
    !Number.isSafeInteger(record.previousRevision) ||
    !Number.isSafeInteger(record.revision) ||
    record.previousRevision < 0 ||
    record.revision !== record.previousRevision + 1
  ) {
    throw new Error(
      "Core access-control override revisions must be consecutive integers."
    );
  }

  if (record.schemaVersion !== 1) {
    throw new Error("Unsupported core access-control override schema version.");
  }

  if (record.reason.trim().length === 0) {
    throw new Error("Core access-control override requires a change reason.");
  }

  if (record.actorId.trim().length === 0) {
    throw new Error("Core access-control override requires an actor ID.");
  }

  if (!Number.isFinite(Date.parse(record.createdAt))) {
    throw new Error(
      "Core access-control override requires a valid creation timestamp."
    );
  }

  ciAssertCoreAccessControlOverrideTargets(
    CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
    record.layer
  );

  if (!ciAccessControlLayerHasChanges(record.layer)) {
    throw new Error(
      "Core access-control override must change at least one field."
    );
  }
}

/** Returns true when a reference identifies a CloudIgniter core catalog entry. */
export function ciIsCoreAccessControlEntry(
  reference: CiAccessControlEntryReference
): boolean {
  return ciDefinitionContainsAccessControlEntry(
    CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
    reference
  );
}

/** Resolves the ownership label used by access-control administration UIs. */
export function ciGetAccessControlEntryOrigin(
  reference: CiAccessControlEntryReference
): CiAccessControlEntryOrigin {
  return ciIsCoreAccessControlEntry(reference) ? "core" : "application";
}

/** Checks the dedicated core-override capability and direct role assignment. */
export function ciCanOverrideCoreAccessControl(
  subject: CiAuthorizationSubject,
  definition: CiAccessControlDefinition = CI_DEFAULT_ACCESS_CONTROL_DEFINITION
): boolean {
  const decision = ciCreateAuthorizer(definition).authorize({
    subject,
    resource: "platform.authorization.core",
    action: "override",
    scope: { kind: "system" },
  });

  return (
    decision.allowed &&
    decision.matches.some(
      (match) =>
        match.source === "role" &&
        match.assignedRoleId === "system-super-admin" &&
        match.privilegeRoleId === "system-super-admin"
    )
  );
}

/** Creates one authorized, versioned, immutable core override audit record. */
export function ciCreateCoreAccessControlOverride(
  input: CiCreateCoreAccessControlOverrideInput,
  options: CiCreateCoreAccessControlOverrideOptions = {}
): CiCoreAccessControlOverride {
  if (!ciCanOverrideCoreAccessControl(input.subject, input.currentDefinition)) {
    throw new Error(
      "Only a directly assigned system-super-admin can override core access control."
    );
  }

  const record: CiCoreAccessControlOverride = {
    schemaVersion: 1,
    id: input.id,
    previousRevision: input.expectedRevision,
    revision: input.expectedRevision + 1,
    reason: input.reason.trim(),
    actorId: input.subject.id ?? "",
    createdAt: (options.clock ?? (() => new Date()))().toISOString(),
    layer: cloneAccessControlLayer(input.layer),
  };

  assertCoreOverrideRecord(record);

  const prospectiveDefinition = ciMergeAccessControlDefinitions(
    input.currentDefinition,
    record.layer
  );
  assertCoreOverrideBootstrapInvariants(prospectiveDefinition);

  return deepFreezeOverride(record);
}

/** Replays a complete, consecutive core override history over a resolved catalog. */
export function ciApplyCoreAccessControlOverrides(
  definition: CiAccessControlDefinition,
  overrides: readonly CiCoreAccessControlOverride[]
): CiAccessControlDefinition {
  let resolvedDefinition = definition;
  let currentRevision = 0;
  const overrideIds = new Set<string>();

  for (const override of overrides) {
    assertCoreOverrideRecord(override);

    if (overrideIds.has(override.id)) {
      throw new Error(
        `Duplicate core access-control override ID "${override.id}".`
      );
    }

    if (override.previousRevision !== currentRevision) {
      throw new Error(
        `Core access-control override "${override.id}" expected revision ${override.previousRevision}, received ${currentRevision}.`
      );
    }

    resolvedDefinition = ciMergeAccessControlDefinitions(
      resolvedDefinition,
      override.layer
    );
    assertCoreOverrideBootstrapInvariants(resolvedDefinition);
    overrideIds.add(override.id);
    currentRevision = override.revision;
  }

  return resolvedDefinition;
}
