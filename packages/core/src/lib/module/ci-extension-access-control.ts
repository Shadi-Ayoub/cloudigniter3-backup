import type { CiAccessControlLayer, CiExtensionManifest } from "@ci-core/types";
import { ciValidateExtensionManifest } from "./ci-extension-catalog";

/** Registers stable module actions without changing the protected core catalog. */
export function ciExtensionAccessControl(
  manifests: readonly CiExtensionManifest[],
): CiAccessControlLayer {
  manifests.forEach(ciValidateExtensionManifest);
  return {
    domains: manifests.map((module) => ({
      id: `module-${module.id}`,
      title: module.name,
    })),
    resources: manifests.map((module) => ({
      id: `module-${module.id}.features`,
      domainId: `module-${module.id}`,
      title: module.name,
      scopeKinds: ["system"],
      actions: module.permissions ?? [],
    })),
    roles: manifests
      .filter((module) => module.authenticatedAccess)
      .map((module) => ({
        id: `module-${module.id}-user`,
        title: `${module.name} user`,
        precedence: 1000,
        privileges: (module.permissions ?? []).map((permission) => ({
          id: `module-${module.id}-${permission.id}`,
          title: permission.title,
          resource: `module-${module.id}.features`,
          action: permission.id,
          effect: "allow",
          scopeKinds: ["system"],
        })),
      })),
  };
}
