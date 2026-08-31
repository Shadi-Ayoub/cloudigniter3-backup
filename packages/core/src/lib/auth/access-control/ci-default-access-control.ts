import type {
  CiAccessControlDefinition,
  CiAccessControlLayer,
} from "@ci-core/types";

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
export const CI_DEFAULT_ACCESS_CONTROL_DEFINITION =
  deepFreezeAccessControlValue(
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
            {
              id: "update",
              title: "Update platform settings",
              sensitive: true,
            },
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
            { id: "restore", title: "Restore tenants", sensitive: true },
            {
              id: "purge",
              title: "Permanently delete tenants",
              sensitive: true,
            },
          ],
          scopeKinds: ["system"],
        },
        {
          id: "platform.org-units",
          domainId: "platform",
          title: "Org Unit administration",
          actions: [
            { id: "read", title: "View Org Units" },
            { id: "create", title: "Create Org Units", sensitive: true },
            { id: "update", title: "Update Org Units", sensitive: true },
            { id: "share", title: "Share Org Units", sensitive: true },
            { id: "archive", title: "Archive Org Units", sensitive: true },
          ],
          scopeKinds: ["system", "global", "tenant", "orgUnit"],
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
            { id: "restore", title: "Restore users", sensitive: true },
            { id: "purge", title: "Permanently delete users", sensitive: true },
            { id: "assign-role", title: "Assign roles", sensitive: true },
            { id: "email", title: "Email users" },
            {
              id: "impersonate",
              title: "Impersonate users",
              sensitive: true,
            },
          ],
          scopeKinds: ["system", "global", "tenant", "orgUnit"],
        },
        {
          id: "developer.tools",
          domainId: "developer",
          title: "Developer tools",
          actions: [
            { id: "access", title: "Access developer tools" },
            {
              id: "execute",
              title: "Execute developer tools",
              sensitive: true,
            },
          ],
          scopeKinds: ["system"],
        },
      ],
      roles: [
        {
          id: "user",
          title: "User",
          precedence: CI_CORE_ROLE_PRECEDENCE.user,
          privileges: [
            {
              id: "read-dashboard",
              title: "View application dashboard",
              effect: "allow",
              resource: "platform.dashboard",
              action: "read",
              scopeKinds: ["system", "global", "tenant", "orgUnit"],
            },
          ],
        },
        {
          id: "developer",
          title: "Developer",
          precedence: CI_CORE_ROLE_PRECEDENCE.developer,
          inherits: ["user"],
          privileges: [
            {
              id: "use-developer-tools",
              title: "Use developer tools",
              effect: "allow",
              resource: "developer.tools",
              action: "*",
              scopeKinds: ["system"],
            },
          ],
        },
        {
          id: "admin",
          title: "Administrator",
          precedence: CI_CORE_ROLE_PRECEDENCE.admin,
          inherits: ["user"],
          privileges: [
            {
              id: "read-org-units",
              title: "View Org Units",
              effect: "allow",
              resource: "platform.org-units",
              action: "read",
              scopeKinds: ["global", "tenant", "orgUnit"],
            },
            {
              id: "update-org-units",
              title: "Update Org Units",
              effect: "allow",
              resource: "platform.org-units",
              action: "update",
              scopeKinds: ["global", "tenant", "orgUnit"],
            },
            {
              id: "read-users",
              title: "View users",
              effect: "allow",
              resource: "identity.users",
              action: "read",
              scopeKinds: ["global", "tenant", "orgUnit"],
            },
            {
              id: "update-users",
              title: "Update users",
              effect: "allow",
              resource: "identity.users",
              action: "update",
              scopeKinds: ["global", "tenant", "orgUnit"],
            },
            {
              id: "read-access-control",
              title: "View access control",
              effect: "allow",
              resource: "platform.authorization",
              action: "read",
              scopeKinds: ["global", "tenant", "orgUnit"],
            },
          ],
        },
        {
          id: "super-admin",
          title: "Super administrator",
          precedence: CI_CORE_ROLE_PRECEDENCE["super-admin"],
          inherits: ["admin"],
          privileges: [
            {
              id: "manage-org-units",
              title: "Manage Org Units",
              effect: "allow",
              resource: "platform.org-units",
              action: "*",
              scopeKinds: ["global", "tenant", "orgUnit"],
            },
            {
              id: "manage-users",
              title: "Manage users",
              effect: "allow",
              resource: "identity.users",
              action: "*",
              scopeKinds: ["global", "tenant", "orgUnit"],
            },
            {
              id: "manage-access-control",
              title: "Manage access control",
              effect: "allow",
              resource: "platform.authorization",
              action: "manage",
              scopeKinds: ["global", "tenant", "orgUnit"],
            },
          ],
        },
        {
          id: "system-admin",
          title: "System administrator",
          precedence: CI_CORE_ROLE_PRECEDENCE["system-admin"],
          inherits: ["user"],
          privileges: [
            {
              id: "manage-platform-settings",
              title: "Manage platform settings",
              effect: "allow",
              resource: "platform.settings",
              action: "*",
              scopeKinds: ["system"],
            },
            {
              id: "manage-tenants",
              title: "Manage tenants",
              effect: "allow",
              resource: "platform.tenants",
              action: "*",
              scopeKinds: ["system"],
            },
            {
              id: "manage-system-org-units",
              title: "Manage system Org Units",
              effect: "allow",
              resource: "platform.org-units",
              action: "*",
              scopeKinds: ["system"],
            },
            ...[
              "read",
              "create",
              "update",
              "delete",
              "restore",
              "purge",
              "assign-role",
              "email",
            ].map((action) => ({
              id: `manage-system-users-${action}`,
              title: `Manage system users: ${action}`,
              effect: "allow" as const,
              resource: "identity.users",
              action,
              scopeKinds: ["system" as const],
            })),
            {
              id: "manage-system-access-control",
              title: "Manage system access control",
              effect: "allow",
              resource: "platform.authorization",
              action: "manage",
              scopeKinds: ["system"],
            },
          ],
        },
        {
          id: "system-super-admin",
          title: "System super administrator",
          precedence: CI_CORE_ROLE_PRECEDENCE["system-super-admin"],
          inherits: ["system-admin"],
          privileges: [
            {
              id: "impersonate-system-users",
              title: "Impersonate system users",
              effect: "allow",
              resource: "identity.users",
              action: "impersonate",
              scopeKinds: ["system"],
            },
            {
              id: "override-core-access-control",
              title: "Override core access control",
              effect: "allow",
              resource: "platform.authorization.core",
              action: "override",
              scopeKinds: ["system"],
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
