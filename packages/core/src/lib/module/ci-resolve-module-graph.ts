import type {
  CiModuleDependency,
  CiModuleHost,
  CiModuleId,
  CiModuleManifest,
  CiModuleRuntimeEnvironment,
  CiResolveModuleGraphOptions,
  CiResolvedModuleGraph,
} from "@ci-core/types";

import { CiModuleError } from "./CiModuleError";

const CI_MODULE_RUNTIME_ENVIRONMENTS = [
  "client",
  "server",
] as const satisfies readonly CiModuleRuntimeEnvironment[];

/**
 * Resolves and validates a collection of CloudIgniter Module manifests.
 *
 * Required Module dependencies are enabled automatically unless they have been
 * explicitly disabled. Optional dependencies are included only when they are
 * already enabled.
 *
 * Client and server dependency graphs are resolved independently because a
 * Module may implement one or both runtime facets and may declare dependencies
 * that apply only to a specific environment.
 *
 * @param manifests All available Module manifests.
 * @param options Module host and enablement options.
 * @returns The resolved Module graph and runtime-specific initialization order.
 *
 * @throws {CiModuleError}
 * Throws when manifests are invalid, dependencies are missing, runtime targets
 * are incompatible, host requirements are not satisfied, or a dependency
 * cycle is detected.
 */
export function ciResolveModuleGraph(
  manifests: readonly CiModuleManifest[],
  options: CiResolveModuleGraphOptions,
): CiResolvedModuleGraph {
  const manifestsById = ciCreateModuleManifestMap(manifests);

  ciValidateSelectedModuleIds(options.enabled, "enabled", manifestsById);

  ciValidateSelectedModuleIds(options.disabled, "disabled", manifestsById);

  const explicitlyEnabled = new Set<CiModuleId>(options.enabled ?? []);

  const explicitlyDisabled = new Set<CiModuleId>(options.disabled ?? []);

  ciValidateModuleSelectionConflict(explicitlyEnabled, explicitlyDisabled);

  const enabledModuleIds = ciCreateInitialEnabledModuleIds(
    manifestsById,
    explicitlyEnabled,
    explicitlyDisabled,
  );

  ciExpandRequiredModuleDependencies(
    enabledModuleIds,
    explicitlyDisabled,
    manifestsById,
  );

  const enabledManifestsById = ciCreateEnabledModuleManifestMap(
    enabledModuleIds,
    manifestsById,
  );

  ciValidateEnabledModuleTargets(enabledManifestsById, options.host);

  const clientManifests = ciResolveEnvironmentGraph(
    "client",
    enabledManifestsById,
  );

  const serverManifests = ciResolveEnvironmentGraph(
    "server",
    enabledManifestsById,
  );

  return {
    manifestsById: enabledManifestsById,
    clientManifests,
    serverManifests,
  };
}

/**
 * Creates and validates the complete manifest lookup map.
 */
function ciCreateModuleManifestMap(
  manifests: readonly CiModuleManifest[],
): ReadonlyMap<CiModuleId, CiModuleManifest> {
  const manifestsById = new Map<CiModuleId, CiModuleManifest>();

  const sortedManifests = [...manifests].sort((left, right) =>
    left.id.localeCompare(right.id),
  );

  for (const manifest of sortedManifests) {
    ciValidateModuleManifest(manifest);

    if (manifestsById.has(manifest.id)) {
      throw new CiModuleError({
        code: "DUPLICATE_MODULE",
        moduleId: manifest.id,
        message:
          `More than one Module uses the ID "${manifest.id}". ` +
          "Every Module must have a unique ID.",
      });
    }

    manifestsById.set(manifest.id, manifest);
  }

  return manifestsById;
}

/**
 * Validates the basic structure of a Module manifest.
 */
function ciValidateModuleManifest(manifest: CiModuleManifest): void {
  if (!manifest || typeof manifest !== "object") {
    throw new CiModuleError({
      code: "INVALID_MANIFEST",
      message: "A Module manifest must be an object.",
    });
  }

  if (manifest.schemaVersion !== 1) {
    throw new CiModuleError({
      code: "INVALID_MANIFEST",
      moduleId: manifest.id,
      message:
        `Module "${manifest.id}" uses unsupported manifest ` +
        `schema version "${String(manifest.schemaVersion)}".`,
    });
  }

  if (
    typeof manifest.id !== "string" ||
    !manifest.id.trim() ||
    manifest.id !== manifest.id.trim() ||
    /\s/.test(manifest.id)
  ) {
    throw new CiModuleError({
      code: "INVALID_MANIFEST",
      moduleId: manifest.id,
      message: "A Module ID must be a non-empty string without whitespace.",
    });
  }

  if (typeof manifest.name !== "string" || !manifest.name.trim()) {
    throw new CiModuleError({
      code: "INVALID_MANIFEST",
      moduleId: manifest.id,
      message: `Module "${manifest.id}" must have a non-empty name.`,
    });
  }

  if (
    !manifest.runtime ||
    (manifest.runtime.client !== true && manifest.runtime.server !== true)
  ) {
    throw new CiModuleError({
      code: "INVALID_MANIFEST",
      moduleId: manifest.id,
      message:
        `Module "${manifest.id}" must implement at least one ` +
        "client or server runtime facet.",
    });
  }

  if (
    !manifest.target ||
    typeof manifest.target.framework !== "string" ||
    !manifest.target.framework.trim()
  ) {
    throw new CiModuleError({
      code: "INVALID_MANIFEST",
      moduleId: manifest.id,
      message: `Module "${manifest.id}" must declare a target framework.`,
    });
  }

  if (manifest.target.clouds && manifest.target.clouds.length === 0) {
    throw new CiModuleError({
      code: "INVALID_MANIFEST",
      moduleId: manifest.id,
      message:
        `Module "${manifest.id}" declares an empty cloud target ` +
        "list. Omit the clouds property for a cloud-agnostic Module.",
    });
  }

  if (
    manifest.target.clouds?.some(
      (cloud) => typeof cloud !== "string" || !cloud.trim(),
    )
  ) {
    throw new CiModuleError({
      code: "INVALID_MANIFEST",
      moduleId: manifest.id,
      message: `Module "${manifest.id}" contains an invalid cloud target.`,
    });
  }

  ciValidateModuleDependencies(manifest);
}

/**
 * Validates the Module dependencies declared by a manifest.
 */
function ciValidateModuleDependencies(manifest: CiModuleManifest): void {
  const dependencyIds = new Set<CiModuleId>();

  for (const dependency of manifest.dependencies ?? []) {
    if (typeof dependency.id !== "string" || !dependency.id.trim()) {
      throw new CiModuleError({
        code: "INVALID_MANIFEST",
        moduleId: manifest.id,
        message:
          `Module "${manifest.id}" contains a dependency ` +
          "without a valid Module ID.",
      });
    }

    if (dependency.id === manifest.id) {
      throw new CiModuleError({
        code: "CIRCULAR_DEPENDENCY",
        moduleId: manifest.id,
        message: `Module "${manifest.id}" cannot depend on itself.`,
      });
    }

    if (dependencyIds.has(dependency.id)) {
      throw new CiModuleError({
        code: "INVALID_MANIFEST",
        moduleId: manifest.id,
        message:
          `Module "${manifest.id}" declares dependency ` +
          `"${dependency.id}" more than once.`,
      });
    }

    dependencyIds.add(dependency.id);

    ciValidateDependencyEnvironments(manifest, dependency);
  }
}

/**
 * Validates the runtime environments assigned to a dependency.
 */
function ciValidateDependencyEnvironments(
  manifest: CiModuleManifest,
  dependency: CiModuleDependency,
): void {
  if (!dependency.environments) {
    return;
  }

  if (dependency.environments.length === 0) {
    throw new CiModuleError({
      code: "INVALID_MANIFEST",
      moduleId: manifest.id,
      message:
        `Dependency "${dependency.id}" in Module ` +
        `"${manifest.id}" declares no runtime environments.`,
    });
  }

  const environments = new Set<CiModuleRuntimeEnvironment>();

  for (const environment of dependency.environments) {
    if (!CI_MODULE_RUNTIME_ENVIRONMENTS.includes(environment)) {
      throw new CiModuleError({
        code: "INVALID_MANIFEST",
        moduleId: manifest.id,
        message:
          `Dependency "${dependency.id}" in Module ` +
          `"${manifest.id}" uses invalid environment ` +
          `"${String(environment)}".`,
      });
    }

    if (environments.has(environment)) {
      throw new CiModuleError({
        code: "INVALID_MANIFEST",
        moduleId: manifest.id,
        message:
          `Dependency "${dependency.id}" in Module ` +
          `"${manifest.id}" declares environment ` +
          `"${environment}" more than once.`,
      });
    }

    environments.add(environment);

    if (!ciModuleSupportsEnvironment(manifest, environment)) {
      throw new CiModuleError({
        code: "INVALID_MANIFEST",
        moduleId: manifest.id,
        message:
          `Dependency "${dependency.id}" applies to the ` +
          `"${environment}" environment, but Module ` +
          `"${manifest.id}" does not implement that facet.`,
      });
    }
  }
}

/**
 * Validates IDs provided through the enabled or disabled options.
 */
function ciValidateSelectedModuleIds(
  selectedModuleIds: readonly CiModuleId[] | undefined,
  selectionName: "enabled" | "disabled",
  manifestsById: ReadonlyMap<CiModuleId, CiModuleManifest>,
): void {
  if (!selectedModuleIds) {
    return;
  }

  const encounteredIds = new Set<CiModuleId>();

  for (const moduleId of selectedModuleIds) {
    if (encounteredIds.has(moduleId)) {
      throw new CiModuleError({
        code: "INVALID_MANIFEST",
        moduleId,
        message:
          `Module "${moduleId}" appears more than once in the ` +
          `${selectionName} Module list.`,
      });
    }

    encounteredIds.add(moduleId);

    if (!manifestsById.has(moduleId)) {
      throw new CiModuleError({
        code: "INVALID_MANIFEST",
        moduleId,
        message:
          `The ${selectionName} Module list references unknown ` +
          `Module "${moduleId}".`,
      });
    }
  }
}

/**
 * Prevents a Module from being explicitly enabled and disabled.
 */
function ciValidateModuleSelectionConflict(
  explicitlyEnabled: ReadonlySet<CiModuleId>,
  explicitlyDisabled: ReadonlySet<CiModuleId>,
): void {
  for (const moduleId of explicitlyEnabled) {
    if (!explicitlyDisabled.has(moduleId)) {
      continue;
    }

    throw new CiModuleError({
      code: "INVALID_MANIFEST",
      moduleId,
      message:
        `Module "${moduleId}" cannot be explicitly enabled and ` +
        "disabled at the same time.",
    });
  }
}

/**
 * Creates the initial set of enabled Modules.
 */
function ciCreateInitialEnabledModuleIds(
  manifestsById: ReadonlyMap<CiModuleId, CiModuleManifest>,
  explicitlyEnabled: ReadonlySet<CiModuleId>,
  explicitlyDisabled: ReadonlySet<CiModuleId>,
): Set<CiModuleId> {
  const enabledModuleIds = new Set<CiModuleId>();

  for (const manifest of manifestsById.values()) {
    if (
      manifest.enabledByDefault !== false &&
      !explicitlyDisabled.has(manifest.id)
    ) {
      enabledModuleIds.add(manifest.id);
    }
  }

  for (const moduleId of explicitlyEnabled) {
    enabledModuleIds.add(moduleId);
  }

  return enabledModuleIds;
}

/**
 * Enables all required transitive Module dependencies.
 */
function ciExpandRequiredModuleDependencies(
  enabledModuleIds: Set<CiModuleId>,
  explicitlyDisabled: ReadonlySet<CiModuleId>,
  manifestsById: ReadonlyMap<CiModuleId, CiModuleManifest>,
): void {
  const pendingModuleIds = [...enabledModuleIds].sort();

  while (pendingModuleIds.length > 0) {
    const moduleId = pendingModuleIds.shift();

    if (!moduleId) {
      continue;
    }

    const manifest = manifestsById.get(moduleId);

    if (!manifest) {
      continue;
    }

    const dependencies = [...(manifest.dependencies ?? [])].sort(
      (left, right) => left.id.localeCompare(right.id),
    );

    for (const dependency of dependencies) {
      if (dependency.optional) {
        continue;
      }

      const dependencyManifest = manifestsById.get(dependency.id);

      if (!dependencyManifest) {
        throw new CiModuleError({
          code: "MISSING_DEPENDENCY",
          moduleId: manifest.id,
          message:
            `Module "${manifest.id}" requires missing Module ` +
            `"${dependency.id}".`,
        });
      }

      if (explicitlyDisabled.has(dependency.id)) {
        throw new CiModuleError({
          code: "MISSING_DEPENDENCY",
          moduleId: manifest.id,
          message:
            `Module "${manifest.id}" requires Module ` +
            `"${dependency.id}", but it has been explicitly disabled.`,
        });
      }

      ciValidateDependencyRuntimeCompatibility(
        manifest,
        dependency,
        dependencyManifest,
      );

      if (!enabledModuleIds.has(dependency.id)) {
        enabledModuleIds.add(dependency.id);
        pendingModuleIds.push(dependency.id);
        pendingModuleIds.sort();
      }
    }
  }
}

/**
 * Validates that a dependency implements every environment in which it is used.
 */
function ciValidateDependencyRuntimeCompatibility(
  manifest: CiModuleManifest,
  dependency: CiModuleDependency,
  dependencyManifest: CiModuleManifest,
): void {
  const applicableEnvironments = ciGetDependencyEnvironments(
    manifest,
    dependency,
  );

  for (const environment of applicableEnvironments) {
    if (ciModuleSupportsEnvironment(dependencyManifest, environment)) {
      continue;
    }

    throw new CiModuleError({
      code: "MISSING_DEPENDENCY",
      moduleId: manifest.id,
      message:
        `Module "${manifest.id}" requires Module ` +
        `"${dependency.id}" in the "${environment}" environment, ` +
        `but "${dependency.id}" does not implement that facet.`,
    });
  }
}

/**
 * Creates a deterministic lookup containing enabled Modules only.
 */
function ciCreateEnabledModuleManifestMap(
  enabledModuleIds: ReadonlySet<CiModuleId>,
  manifestsById: ReadonlyMap<CiModuleId, CiModuleManifest>,
): ReadonlyMap<CiModuleId, CiModuleManifest> {
  const enabledManifestsById = new Map<CiModuleId, CiModuleManifest>();

  const sortedModuleIds = [...enabledModuleIds].sort();

  for (const moduleId of sortedModuleIds) {
    const manifest = manifestsById.get(moduleId);

    if (manifest) {
      enabledManifestsById.set(moduleId, manifest);
    }
  }

  return enabledManifestsById;
}

/**
 * Validates framework and cloud requirements for enabled Modules.
 */
function ciValidateEnabledModuleTargets(
  manifestsById: ReadonlyMap<CiModuleId, CiModuleManifest>,
  host: CiModuleHost,
): void {
  for (const manifest of manifestsById.values()) {
    if (manifest.target.framework !== host.framework) {
      throw new CiModuleError({
        code: "INCOMPATIBLE_TARGET",
        moduleId: manifest.id,
        message:
          `Module "${manifest.id}" targets framework ` +
          `"${manifest.target.framework}", but the current host uses ` +
          `"${host.framework}".`,
      });
    }

    const supportedClouds = manifest.target.clouds;

    if (!supportedClouds || supportedClouds.length === 0) {
      continue;
    }

    if (!host.cloud || !supportedClouds.includes(host.cloud)) {
      throw new CiModuleError({
        code: "INCOMPATIBLE_TARGET",
        moduleId: manifest.id,
        message:
          `Module "${manifest.id}" supports cloud ` +
          `${ciFormatValues(supportedClouds)}, but the current host ` +
          `uses "${host.cloud ?? "unspecified"}".`,
      });
    }
  }
}

/**
 * Resolves one runtime-specific dependency graph.
 */
function ciResolveEnvironmentGraph(
  environment: CiModuleRuntimeEnvironment,
  manifestsById: ReadonlyMap<CiModuleId, CiModuleManifest>,
): readonly CiModuleManifest[] {
  const orderedManifests: CiModuleManifest[] = [];
  const states = new Map<CiModuleId, "visiting" | "visited">();
  const traversalPath: CiModuleId[] = [];

  const environmentManifests = [...manifestsById.values()]
    .filter((manifest) => ciModuleSupportsEnvironment(manifest, environment))
    .sort((left, right) => left.id.localeCompare(right.id));

  function visit(manifest: CiModuleManifest): void {
    const state = states.get(manifest.id);

    if (state === "visited") {
      return;
    }

    if (state === "visiting") {
      const cycleStartIndex = traversalPath.indexOf(manifest.id);

      const cyclePath = [...traversalPath.slice(cycleStartIndex), manifest.id];

      throw new CiModuleError({
        code: "CIRCULAR_DEPENDENCY",
        moduleId: manifest.id,
        message:
          `Circular ${environment} Module dependency detected: ` +
          cyclePath.join(" → "),
      });
    }

    states.set(manifest.id, "visiting");
    traversalPath.push(manifest.id);

    const dependencies = [...(manifest.dependencies ?? [])]
      .filter((dependency) =>
        ciDependencyAppliesToEnvironment(manifest, dependency, environment),
      )
      .sort((left, right) => left.id.localeCompare(right.id));

    for (const dependency of dependencies) {
      const dependencyManifest = manifestsById.get(dependency.id);

      if (!dependencyManifest) {
        if (dependency.optional) {
          continue;
        }

        throw new CiModuleError({
          code: "MISSING_DEPENDENCY",
          moduleId: manifest.id,
          message:
            `Module "${manifest.id}" requires missing Module ` +
            `"${dependency.id}" in the "${environment}" environment.`,
        });
      }

      if (!ciModuleSupportsEnvironment(dependencyManifest, environment)) {
        throw new CiModuleError({
          code: "MISSING_DEPENDENCY",
          moduleId: manifest.id,
          message:
            `Module "${manifest.id}" depends on Module ` +
            `"${dependency.id}" in the "${environment}" environment, ` +
            `but "${dependency.id}" does not implement that facet.`,
        });
      }

      visit(dependencyManifest);
    }

    traversalPath.pop();
    states.set(manifest.id, "visited");
    orderedManifests.push(manifest);
  }

  for (const manifest of environmentManifests) {
    visit(manifest);
  }

  return orderedManifests;
}

/**
 * Returns the environments in which a dependency applies.
 */
function ciGetDependencyEnvironments(
  manifest: CiModuleManifest,
  dependency: CiModuleDependency,
): readonly CiModuleRuntimeEnvironment[] {
  if (dependency.environments) {
    return dependency.environments;
  }

  return CI_MODULE_RUNTIME_ENVIRONMENTS.filter((environment) =>
    ciModuleSupportsEnvironment(manifest, environment),
  );
}

/**
 * Returns whether a dependency applies to a runtime environment.
 */
function ciDependencyAppliesToEnvironment(
  manifest: CiModuleManifest,
  dependency: CiModuleDependency,
  environment: CiModuleRuntimeEnvironment,
): boolean {
  return ciGetDependencyEnvironments(manifest, dependency).includes(
    environment,
  );
}

/**
 * Returns whether a Module implements a runtime facet.
 */
function ciModuleSupportsEnvironment(
  manifest: CiModuleManifest,
  environment: CiModuleRuntimeEnvironment,
): boolean {
  return manifest.runtime[environment] === true;
}

/**
 * Formats a collection of values for diagnostic messages.
 */
function ciFormatValues(values: readonly string[]): string {
  return values.map((value) => `"${value}"`).join(", ");
}
