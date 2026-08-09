import type { CiAccessControlDefinition, CiAccessControlLayer } from "../../types";

import { CI_CORE_ROLE_PRECEDENCE } from "../ci-role-precedence";
import {
  ciAssertAppAccessControlLayerDoesNotOverrideCore,
  ciAssertExclusiveCoreOverrideRole,
} from "./ci-access-control-protection";
import { ciMergeAccessControlDefinitions } from "./ci-merge-access-control";
import { ciDefineAccessControl } from "./ci-validate-access-control";

/** Recursively freezes serializable catalog data at runtime. */
function deepFreezeAccessControlValue<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const nestedValue of Object.values(value)) {
    deepFreezeAccessControlValue(nestedValue);
  }

  return Object.freeze(value);
}

/** Runtime-immutable CloudIgniter domains, resources, actions, roles, and privileges. */
export const CI_DEFAULT_ACCESS_CONTROL_DEFINITION = deepFreezeAccessControlValue(
  ciDefineAccessControl({
  domains: [
    { id: "platform", title: "Platform" },
    { id: "identity", title: "Identity and access" },
    { id: "developer", title: "Developer tools" },
  ],
  resources: [
    {
      id: "platform.dashboard",
      domainId: "platform",
      title: "Application dashboard",
      actions: [{ id: "read", title: "View dashboard" }],
      scopeKinds: ["system", "global", "tenant", "orgUnit"],
    },
    {
      id: "platform.authorization",
      domainId: "platform",
      title: "Access-control administration",
      actions: [
        { id: "read", title: "View access control" },
        { id: "manage", title: "Manage access control", sensitive: true },
      ],
      scopeKinds: ["system", "global", "tenant", "orgUnit"],
    },
    {
      id: "platform.authorization.core",
      domainId: "platform",
      title: "Core access-control administration",
      actions: [
        { id: "read", title: "View core access control" },
        {
          id: "override",
          title: "Override core access control",
          sensitive: true,
        },
      ],
      scopeKinds: ["system"],
    },
    {
      id: "platform.settings",
      domainId: "platform",
      title: "Platform settings",
      actions: [
        { id: "read", title: "View platform settings" },
        { id: "update", title: "Update platform settings", sensitive: true },
      ],
      scopeKinds: ["system"],
    },
    {
      id: "platform.tenants",
      domainId: "platform",
      title: "Tenant administration",
      actions: [
        { id: "read", title: "View tenants" },
        { id: "create", title: "Create tenants", sensitive: true },
        { id: "update", title: "Update tenants", sensitive: true },
        { id: "delete", title: "Delete tenants", sensitive: true },
      ],
      scopeKinds: ["system"],
    },
    {
      id: "identity.users",
      domainId: "identity",
      title: "User administration",
      actions: [
        { id: "read", title: "View users" },
        { id: "create", title: "Create users", sensitive: true },
        { id: "update", title: "Update users", sensitive: true },
        { id: "delete", title: "Delete users", sensitive: true },
        { id: "assign-role", title: "Assign roles", sensitive: true },
      ],
      scopeKinds: ["system", "global", "tenant", "orgUnit"],
    },
    {
      id: "developer.tools",
      domainId: "developer",
      title: "Developer tools",
      actions: [
        { id: "access", title: "Access developer tools" },
        { id: "execute", title: "Execute developer tools", sensitive: true },
      ],
      scopeKinds: ["system"],
    },
  ],
  roles: [
    {
      id: "USER",
      title: "User",
      precedence: CI_CORE_ROLE_PRECEDENCE.USER,
      privileges: [
        {
          id: "read-dashboard",
          effect: "allow",
          resource: "platform.dashboard",
          action: "read",
          scopeKinds: ["system", "global", "tenant", "orgUnit"],
        },
      ],
    },
    {
      id: "DEVELOPER",
      title: "Developer",
      precedence: CI_CORE_ROLE_PRECEDENCE.DEVELOPER,
      inherits: ["USER"],
      privileges: [
        {
          id: "use-developer-tools",
          effect: "allow",
          resource: "developer.tools",
          action: "*",
          scopeKinds: ["system"],
        },
      ],
    },
    {
      id: "ADMIN",
      title: "Administrator",
      precedence: CI_CORE_ROLE_PRECEDENCE.ADMIN,
      inherits: ["USER"],
      privileges: [
        {
          id: "read-users",
          effect: "allow",
          resource: "identity.users",
          action: "read",
          scopeKinds: ["global", "tenant", "orgUnit"],
        },
        {
          id: "update-users",
          effect: "allow",
          resource: "identity.users",
          action: "update",
          scopeKinds: ["global", "tenant", "orgUnit"],
        },
        {
          id: "read-access-control",
          effect: "allow",
          resource: "platform.authorization",
          action: "read",
          scopeKinds: ["global", "tenant", "orgUnit"],
        },
      ],
    },
    {
      id: "SUPER_ADMIN",
      title: "Super administrator",
      precedence: CI_CORE_ROLE_PRECEDENCE.SUPER_ADMIN,
      inherits: ["ADMIN"],
      privileges: [
        {
          id: "manage-users",
          effect: "allow",
          resource: "identity.users",
          action: "*",
          scopeKinds: ["global", "tenant", "orgUnit"],
        },
        {
          id: "manage-access-control",
          effect: "allow",
          resource: "platform.authorization",
          action: "manage",
          scopeKinds: ["global", "tenant", "orgUnit"],
        },
      ],
    },
    {
      id: "SYSTEM_ADMIN",
      title: "System administrator",
      precedence: CI_CORE_ROLE_PRECEDENCE.SYSTEM_ADMIN,
      inherits: ["SUPER_ADMIN"],
      privileges: [
        {
          id: "manage-platform-settings",
          effect: "allow",
          resource: "platform.settings",
          action: "*",
          scopeKinds: ["system"],
        },
        {
          id: "manage-tenants",
          effect: "allow",
          resource: "platform.tenants",
          action: "*",
          scopeKinds: ["system"],
        },
        {
          id: "manage-system-access-control",
          effect: "allow",
          resource: "platform.authorization",
          action: "*",
          scopeKinds: ["system"],
        },
      ],
    },
    {
      id: "SYSTEM_SUPER_ADMIN",
      title: "System super administrator",
      precedence: CI_CORE_ROLE_PRECEDENCE.SYSTEM_SUPER_ADMIN,
      inherits: ["SYSTEM_ADMIN"],
      privileges: [
        {
          id: "full-platform-access",
          effect: "allow",
          resource: "*",
          action: "*",
          scopeKinds: ["system", "global", "tenant", "orgUnit"],
        },
      ],
    },
  ],
  } as const satisfies CiAccessControlDefinition),
);

/**
 * Creates the application catalog by merging protected core and app entries.
 *
 * Application layers may add domains, resources, actions, roles, and
 * privileges, but cannot redefine core-owned entries. A new application role
 * should inherit a core role instead of modifying that role in place.
 */
export function ciCreateAppAccessControl(
  ...extensions: readonly (CiAccessControlLayer | null | undefined)[]
): CiAccessControlDefinition {
  for (const extension of extensions) {
    if (extension) {
      ciAssertAppAccessControlLayerDoesNotOverrideCore(
        CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
        extension,
      );
    }
  }

  const definition = ciMergeAccessControlDefinitions(
    CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
    ...extensions,
  );
  ciAssertExclusiveCoreOverrideRole(definition);
  return definition;
}

/**
 * Creates the application catalog by merging protected core and app entries.
 *
 * @deprecated Use `ciCreateAppAccessControl()`; this alias remains for compatibility.
 */
export function ciCreateCoreAccessControl(
  ...extensions: readonly (CiAccessControlLayer | null | undefined)[]
): CiAccessControlDefinition {
  return ciCreateAppAccessControl(...extensions);
}
