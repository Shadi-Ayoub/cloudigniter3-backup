import type {
  CiAccessControlDefinition,
  CiAccessControlLayer,
  CiActionDefinition,
  CiActionDefinitionLayer,
  CiPrivilege,
  CiPrivilegeLayer,
  CiResourceDefinition,
  CiResourceDefinitionLayer,
  CiResourceDomainDefinition,
  CiResourceDomainDefinitionLayer,
  CiRoleDefinition,
  CiRoleDefinitionLayer,
} from "../../types";

import { ciAssertValidAccessControlDefinition } from "./ci-validate-access-control";

/** Merges action entries by identifier while retaining their original order. */
function mergeActions(
  base: readonly CiActionDefinition[],
  layer: readonly CiActionDefinitionLayer[],
): readonly CiActionDefinition[] {
  const merged = new Map<string, CiActionDefinition>(
    base.map((action) => [action.id, { ...action }]),
  );

  for (const action of layer) {
    merged.set(action.id, { ...merged.get(action.id), ...action } as CiActionDefinition);
  }

  return [...merged.values()];
}

/** Merges privilege entries by identifier while retaining their original order. */
function mergePrivileges(
  base: readonly CiPrivilege[],
  layer: readonly CiPrivilegeLayer[],
): readonly CiPrivilege[] {
  const merged = new Map<string, CiPrivilege>(
    base.map((privilege) => [
      privilege.id,
      { ...privilege, scopeKinds: [...privilege.scopeKinds] },
    ]),
  );

  for (const privilege of layer) {
    const current = merged.get(privilege.id);
    merged.set(privilege.id, {
      ...current,
      ...privilege,
      scopeKinds: privilege.scopeKinds
        ? [...privilege.scopeKinds]
        : [...(current?.scopeKinds ?? [])],
    } as CiPrivilege);
  }

  return [...merged.values()];
}

/** Merges domain entries by identifier while retaining their original order. */
function mergeDomains(
  base: readonly CiResourceDomainDefinition[],
  layer: readonly CiResourceDomainDefinitionLayer[],
): readonly CiResourceDomainDefinition[] {
  const merged = new Map<string, CiResourceDomainDefinition>(
    base.map((domain) => [domain.id, { ...domain }]),
  );

  for (const domain of layer) {
    merged.set(domain.id, {
      ...merged.get(domain.id),
      ...domain,
    } as CiResourceDomainDefinition);
  }

  return [...merged.values()];
}

/** Merges resources and their nested actions by identifier. */
function mergeResources(
  base: readonly CiResourceDefinition[],
  layer: readonly CiResourceDefinitionLayer[],
): readonly CiResourceDefinition[] {
  const merged = new Map<string, CiResourceDefinition>(
    base.map((resource) => [
      resource.id,
      {
        ...resource,
        actions: mergeActions(resource.actions, []),
        scopeKinds: [...resource.scopeKinds],
      },
    ]),
  );

  for (const resource of layer) {
    const current = merged.get(resource.id);
    merged.set(resource.id, {
      ...current,
      ...resource,
      actions: resource.actions
        ? mergeActions(current?.actions ?? [], resource.actions)
        : [...(current?.actions ?? [])],
      scopeKinds: resource.scopeKinds
        ? [...resource.scopeKinds]
        : [...(current?.scopeKinds ?? [])],
    } as CiResourceDefinition);
  }

  return [...merged.values()];
}

/** Merges roles and their nested privileges by identifier. */
function mergeRoles(
  base: readonly CiRoleDefinition[],
  layer: readonly CiRoleDefinitionLayer[],
): readonly CiRoleDefinition[] {
  const merged = new Map<string, CiRoleDefinition>(
    base.map((role) => [
      role.id,
      {
        ...role,
        ...(role.inherits ? { inherits: [...role.inherits] } : {}),
        privileges: mergePrivileges(role.privileges, []),
      },
    ]),
  );

  for (const role of layer) {
    const { privilegesMode, ...roleFields } = role;
    const current = merged.get(role.id);
    merged.set(role.id, {
      ...current,
      ...roleFields,
      ...(role.inherits
        ? { inherits: [...role.inherits] }
        : current?.inherits
          ? { inherits: [...current.inherits] }
          : {}),
      privileges: role.privileges
        ? mergePrivileges(
            privilegesMode === "replace" ? [] : (current?.privileges ?? []),
            role.privileges,
          )
        : [...(current?.privileges ?? [])],
    } as CiRoleDefinition);
  }

  return [...merged.values()];
}

/** Throws a focused error when a newly added merge entry omits required fields. */
function assertMergedDefinitionShape(definition: CiAccessControlDefinition): void {
  for (const domain of definition.domains) {
    if (typeof domain.title !== "string" || domain.title.trim().length === 0) {
      throw new Error(`Access-control domain "${domain.id}" requires a title.`);
    }
  }

  for (const resource of definition.resources) {
    if (
      typeof resource.domainId !== "string" ||
      resource.domainId.length === 0 ||
      typeof resource.title !== "string" ||
      resource.title.trim().length === 0
    ) {
      throw new Error(
        `Access-control resource "${resource.id}" requires domainId and title fields.`,
      );
    }

    for (const action of resource.actions) {
      if (typeof action.title !== "string" || action.title.trim().length === 0) {
        throw new Error(
          `Access-control action "${resource.id}.${action.id}" requires a title.`,
        );
      }
    }
  }

  for (const role of definition.roles) {
    if (
      typeof role.title !== "string" ||
      role.title.trim().length === 0 ||
      !Number.isFinite(role.precedence)
    ) {
      throw new Error(
        `Access-control role "${role.id}" requires title and precedence fields.`,
      );
    }

    for (const privilege of role.privileges) {
      if (
        typeof privilege.title !== "string" ||
        privilege.title.trim().length === 0 ||
        (privilege.effect !== "allow" && privilege.effect !== "deny") ||
        typeof privilege.resource !== "string" ||
        typeof privilege.action !== "string"
      ) {
        throw new Error(
          `Access-control privilege "${role.id}.${privilege.id}" requires title, effect, resource, and action fields.`,
        );
      }
    }
  }
}

/**
 * Deeply merges access-control layers and validates the resulting catalog.
 *
 * Domains, resources, actions, roles, and privileges are merged by `id`. The
 * latest defined scalar wins. Value arrays such as `scopeKinds` and `inherits`
 * replace earlier arrays instead of being concatenated. A role layer can set
 * `privilegesMode` to `replace` when it represents a complete privilege set.
 */
export function ciMergeAccessControlDefinitions(
  ...layers: readonly (CiAccessControlLayer | null | undefined)[]
): CiAccessControlDefinition {
  let definition: CiAccessControlDefinition = {
    domains: [],
    resources: [],
    roles: [],
  };

  for (const layer of layers) {
    if (!layer) {
      continue;
    }

    definition = {
      domains: layer.domains
        ? mergeDomains(definition.domains, layer.domains)
        : mergeDomains(definition.domains, []),
      resources: layer.resources
        ? mergeResources(definition.resources, layer.resources)
        : mergeResources(definition.resources, []),
      roles: layer.roles
        ? mergeRoles(definition.roles, layer.roles)
        : mergeRoles(definition.roles, []),
    };
  }

  assertMergedDefinitionShape(definition);
  ciAssertValidAccessControlDefinition(definition);

  return definition;
}
