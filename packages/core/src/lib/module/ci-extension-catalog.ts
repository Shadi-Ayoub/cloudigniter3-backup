import type {
  CiExtensionConfiguration,
  CiExtensionManifest,
  CiModuleHost,
} from "@ci-core/types";

/** Core capabilities never participate in the extension lifecycle. */
export const CI_FIXED_MODULES = Object.freeze([
  { id: "security", name: "Security" },
  { id: "tenant", name: "Tenants" },
  { id: "org-unit", name: "Org Units" },
  { id: "appearance", name: "Appearance" },
  { id: "users", name: "Users" },
  { id: "admins", name: "Administrators" },
  { id: "settings", name: "Settings" },
  { id: "modules", name: "Modules" },
]);

export function ciValidateExtensionManifest(
  manifest: CiExtensionManifest,
): void {
  if (
    !manifest ||
    manifest.schemaVersion !== 1 ||
    manifest.kind !== "extension" ||
    !/^[a-z][a-z0-9-]{0,47}$/.test(manifest.id) ||
    ["constructor", "prototype"].includes(manifest.id) ||
    CI_FIXED_MODULES.some((item) => item.id === manifest.id) ||
    !manifest.name?.trim() ||
    manifest.name.length > 120 ||
    !/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(manifest.version) ||
    !manifest.target?.framework ||
    !manifest.runtime ||
    (!manifest.runtime.client && !manifest.runtime.server)
  ) {
    throw new Error("Invalid extension manifest or reserved core module ID.");
  }
  const settings = new Set<string>();
  for (const setting of manifest.settings ?? []) {
    if (
      !/^[a-zA-Z][a-zA-Z0-9]{0,47}$/.test(setting.key) ||
      settings.has(setting.key) ||
      !setting.title ||
      !["boolean", "string"].includes(typeof setting.default) ||
      (typeof setting.default === "string" &&
        (!setting.options?.length ||
          !setting.options.includes(setting.default)))
    )
      throw new Error(`Invalid setting in extension ${manifest.id}.`);
    settings.add(setting.key);
  }
  if (
    new Set((manifest.dependencies ?? []).map((d) => d.id)).size !==
    (manifest.dependencies ?? []).length
  )
    throw new Error(`Duplicate dependencies in extension ${manifest.id}.`);
  if (
    manifest.dependencies?.some(
      (dependency) =>
        dependency.id === manifest.id ||
        !/^[a-z][a-z0-9.-]{0,95}$/.test(dependency.id),
    )
  )
    throw new Error(`Invalid dependency in extension ${manifest.id}.`);
  const permissions = new Set<string>();
  for (const permission of manifest.permissions ?? []) {
    if (
      !/^[a-z][a-z0-9-]{0,47}$/.test(permission.id) ||
      permissions.has(permission.id) ||
      !permission.title?.trim() ||
      !["read", "write"].includes(permission.accessMode)
    )
      throw new Error(`Invalid permission in extension ${manifest.id}.`);
    permissions.add(permission.id);
  }
  if (
    manifest.authenticatedAccess !== undefined &&
    typeof manifest.authenticatedAccess !== "boolean"
  )
    throw new Error(
      `Invalid authenticated access in extension ${manifest.id}.`,
    );
  if (
    manifest.dashboard &&
    (!manifest.runtime.client || !manifest.dashboard.title?.trim())
  )
    throw new Error(
      `A dashboard page requires a client facet and title in extension ${manifest.id}.`,
    );
}

export function ciIsExtensionCompatible(
  manifest: CiExtensionManifest,
  host: CiModuleHost,
): boolean {
  return (
    manifest.target.framework === host.framework &&
    (!manifest.target.clouds?.length ||
      (!!host.cloud && manifest.target.clouds.includes(host.cloud)))
  );
}

export function ciResolveExtensionConfiguration(
  manifest: CiExtensionManifest,
  input: CiExtensionConfiguration = {},
): CiExtensionConfiguration {
  const result: CiExtensionConfiguration = {};
  for (const key of Object.keys(input)) {
    if (!manifest.settings?.some((setting) => setting.key === key))
      throw new Error(`Unknown module setting: ${key}.`);
  }
  for (const setting of manifest.settings ?? []) {
    const value = input[setting.key] ?? setting.default;
    if (
      typeof value !== typeof setting.default ||
      (setting.options && !setting.options.includes(String(value)))
    )
      throw new Error(`Invalid value for ${setting.title}.`);
    result[setting.key] = value;
  }
  return result;
}
