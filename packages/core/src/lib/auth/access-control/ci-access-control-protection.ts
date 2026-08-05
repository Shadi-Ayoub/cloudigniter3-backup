import type {
  CiAccessControlDefinition,
  CiAccessControlEntryReference,
  CiAccessControlLayer,
  CiResourceDefinition,
  CiRoleDefinition,
} from "@ci-core/types";

import { ciMatchesAuthorizationPattern } from "./ci-authorization-pattern";

/** Returns the matching resource from a complete access-control definition. */
function findResource(
  definition: CiAccessControlDefinition,
  resourceId: string,
): CiResourceDefinition | undefined {
  return definition.resources.find((resource) => resource.id === resourceId);
}

/** Returns the matching role from a complete access-control definition. */
function findRole(
  definition: CiAccessControlDefinition,
  roleId: string,
): CiRoleDefinition | undefined {
  return definition.roles.find((role) => role.id === roleId);
}

/** Returns whether a stable entry reference belongs to the supplied definition. */
export function ciDefinitionContainsAccessControlEntry(
  definition: CiAccessControlDefinition,
  reference: CiAccessControlEntryReference,
): boolean {
  switch (reference.kind) {
    case "domain":
      return definition.domains.some((domain) => domain.id === reference.domainId);
    case "resource":
      return definition.resources.some((resource) => resource.id === reference.resourceId);
    case "action":
      return Boolean(
        findResource(definition, reference.resourceId)?.actions.some(
          (action) => action.id === reference.actionId,
        ),
      );
    case "role":
      return definition.roles.some((role) => role.id === reference.roleId);
    case "privilege":
      return Boolean(
        findRole(definition, reference.roleId)?.privileges.some(
          (privilege) => privilege.id === reference.privilegeId,
        ),
      );
  }
}

/** Throws when an application layer attempts to redefine a core-owned entry. */
export function ciAssertAppAccessControlLayerDoesNotOverrideCore(
  coreDefinition: CiAccessControlDefinition,
  layer: CiAccessControlLayer,
): void {
  const coreDomainIds = new Set(coreDefinition.domains.map((domain) => domain.id));
  const coreResources = new Map(
    coreDefinition.resources.map((resource) => [resource.id, resource]),
  );
  const coreRoleIds = new Set(coreDefinition.roles.map((role) => role.id));

  for (const domain of layer.domains ?? []) {
    if (coreDomainIds.has(domain.id)) {
      throw new Error(
        `Application access-control layer cannot override core domain "${domain.id}".`,
      );
    }
  }

  for (const resource of layer.resources ?? []) {
    const coreResource = coreResources.get(resource.id);

    if (!coreResource) {
      continue;
    }

    const changedResourceFields = Object.keys(resource).filter(
      (field) => field !== "id" && field !== "actions",
    );

    if (changedResourceFields.length > 0) {
      throw new Error(
        `Application access-control layer cannot override core resource "${resource.id}" fields: ${changedResourceFields.join(", ")}.`,
      );
    }

    const coreActionIds = new Set(coreResource.actions.map((action) => action.id));

    for (const action of resource.actions ?? []) {
      if (coreActionIds.has(action.id)) {
        throw new Error(
          `Application access-control layer cannot override core action "${resource.id}.${action.id}".`,
        );
      }
    }
  }

  for (const role of layer.roles ?? []) {
    if (coreRoleIds.has(role.id)) {
      throw new Error(
        `Application access-control layer cannot override core role "${role.id}". Create an application role that inherits it instead.`,
      );
    }
  }
}

/** Throws unless every target in a core override layer is owned by the core. */
export function ciAssertCoreAccessControlOverrideTargets(
  coreDefinition: CiAccessControlDefinition,
  layer: CiAccessControlLayer,
): void {
  const coreDomainIds = new Set(coreDefinition.domains.map((domain) => domain.id));
  const coreResources = new Map(
    coreDefinition.resources.map((resource) => [resource.id, resource]),
  );
  const coreRoles = new Map(coreDefinition.roles.map((role) => [role.id, role]));

  for (const domain of layer.domains ?? []) {
    if (!coreDomainIds.has(domain.id)) {
      throw new Error(
        `Core access-control override cannot target application domain "${domain.id}".`,
      );
    }
  }

  for (const resource of layer.resources ?? []) {
    const coreResource = coreResources.get(resource.id);

    if (!coreResource) {
      throw new Error(
        `Core access-control override cannot target application resource "${resource.id}".`,
      );
    }

    const coreActionIds = new Set(coreResource.actions.map((action) => action.id));

    for (const action of resource.actions ?? []) {
      if (!coreActionIds.has(action.id)) {
        throw new Error(
          `Core access-control override cannot target application action "${resource.id}.${action.id}".`,
        );
      }
    }
  }

  for (const role of layer.roles ?? []) {
    const coreRole = coreRoles.get(role.id);

    if (!coreRole) {
      throw new Error(
        `Core access-control override cannot target application role "${role.id}".`,
      );
    }

    const corePrivilegeIds = new Set(
      coreRole.privileges.map((privilege) => privilege.id),
    );

    for (const privilege of role.privileges ?? []) {
      if (!corePrivilegeIds.has(privilege.id)) {
        throw new Error(
          `Core access-control override cannot target application privilege "${role.id}.${privilege.id}".`,
        );
      }
    }
  }
}

/** Returns whether a partial layer contains at least one effective field change. */
export function ciAccessControlLayerHasChanges(layer: CiAccessControlLayer): boolean {
  return (
    (layer.domains ?? []).some((domain) => Object.keys(domain).some((key) => key !== "id")) ||
    (layer.resources ?? []).some(
      (resource) =>
        Object.keys(resource).some((key) => key !== "id" && key !== "actions") ||
        (resource.actions ?? []).some((action) =>
          Object.keys(action).some((key) => key !== "id"),
        ),
    ) ||
    (layer.roles ?? []).some(
      (role) =>
        Object.keys(role).some((key) => key !== "id" && key !== "privileges") ||
        (role.privileges ?? []).some((privilege) =>
          Object.keys(privilege).some((key) => key !== "id"),
        ),
    )
  );
}

/** Throws when any role other than SYSTEM_SUPER_ADMIN can reach the override capability. */
export function ciAssertExclusiveCoreOverrideRole(
  definition: CiAccessControlDefinition,
): void {
  const roles = new Map(definition.roles.map((role) => [role.id, role]));

  /** Returns whether one inheritance path reaches SYSTEM_SUPER_ADMIN. */
  function inheritsSystemSuperAdmin(
    roleId: string,
    visited: ReadonlySet<string>,
  ): boolean {
    if (roleId === "SYSTEM_SUPER_ADMIN") {
      return true;
    }

    if (visited.has(roleId)) {
      return false;
    }

    const nextVisited = new Set(visited).add(roleId);
    return (roles.get(roleId)?.inherits ?? []).some((inheritedRoleId) =>
      inheritsSystemSuperAdmin(inheritedRoleId, nextVisited),
    );
  }

  for (const role of definition.roles) {
    if (role.id === "SYSTEM_SUPER_ADMIN") {
      continue;
    }

    if (inheritsSystemSuperAdmin(role.id, new Set())) {
      throw new Error(
        `Access-control role "${role.id}" cannot inherit SYSTEM_SUPER_ADMIN.`,
      );
    }

    const grantsCoreOverride = role.privileges.some(
      (privilege) =>
        privilege.effect === "allow" &&
        privilege.scopeKinds.includes("system") &&
        ciMatchesAuthorizationPattern(
          privilege.resource,
          "platform.authorization.core",
        ) &&
        ciMatchesAuthorizationPattern(privilege.action, "override"),
    );

    if (grantsCoreOverride) {
      throw new Error(
        `Access-control role "${role.id}" cannot grant the core override capability.`,
      );
    }
  }
}
