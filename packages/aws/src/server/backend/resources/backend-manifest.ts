import type { CiCoreFunctionId } from "../core-types/functions";
import type { CiCoreTableKey } from "../core-types/tables";
import type {
  CiResourceEnvKeyAllowlist,
  CiResourceModule,
} from "./resource-module.types";
import type { CiCoreResources } from "./resource-types";

type CiBackendManifestModule = {
  [TId in keyof CiCoreResources & string]: CiResourceModule<
    TId,
    string,
    CiCoreFunctionId,
    CiCoreResources[TId]
  >;
}[keyof CiCoreResources & string];

export type CiBackendManifestInput<
  TModules extends readonly CiBackendManifestModule[],
> = {
  modules: TModules;
};

export type CiCompiledBackendManifest<
  TModule extends CiBackendManifestModule = CiBackendManifestModule,
> = {
  modules: readonly TModule[];
  moduleIds: readonly TModule["id"][];
  resourceIds: readonly TModule["id"][];
  handlerIds: readonly CiCoreFunctionId[];
  tableKeys: readonly CiCoreTableKey[];
  envKeyAllowlist: CiResourceEnvKeyAllowlist;
};

/**
 * Compile a backend manifest and fail fast when active registrations drift.
 */
export function ciCompileBackendManifest<
  const TModules extends readonly CiBackendManifestModule[],
>(
  input: CiBackendManifestInput<TModules>,
): CiCompiledBackendManifest<TModules[number]> {
  const moduleIds = new Set<string>();
  const handlerIds = new Set<CiCoreFunctionId>();
  const tableKeys = new Set<CiCoreTableKey>();

  for (const module of input.modules) {
    if (!module.id.trim()) {
      throw new Error("Backend manifest module IDs must not be empty.");
    }

    if (moduleIds.has(module.id)) {
      throw new Error(`Duplicate backend manifest module ID: "${module.id}".`);
    }
    moduleIds.add(module.id);

    const localHandlerIds = new Set<CiCoreFunctionId>();
    for (const handlerId of module.handlers) {
      if (localHandlerIds.has(handlerId)) {
        throw new Error(
          `Duplicate handler ID "${handlerId}" in backend module "${module.id}".`,
        );
      }
      localHandlerIds.add(handlerId);

      if (handlerIds.has(handlerId)) {
        throw new Error(
          `Duplicate backend manifest handler ID: "${handlerId}".`,
        );
      }
      handlerIds.add(handlerId);
    }

    for (const allowlistHandlerId of Object.keys(
      module.envKeyAllowlist,
    ) as CiCoreFunctionId[]) {
      if (!localHandlerIds.has(allowlistHandlerId)) {
        throw new Error(
          `Backend module "${module.id}" declares environment keys for unknown handler "${allowlistHandlerId}".`,
        );
      }
    }

    if ((module.status ?? "active") === "active") {
      for (const handlerId of module.handlers) {
        if (!Object.hasOwn(module.envKeyAllowlist, handlerId)) {
          throw new Error(
            `Active backend handler "${handlerId}" in module "${module.id}" is missing an environment allowlist.`,
          );
        }

        const envKeys = module.envKeyAllowlist[handlerId] ?? [];
        if (new Set(envKeys).size !== envKeys.length) {
          throw new Error(
            `Active backend handler "${handlerId}" in module "${module.id}" has duplicate environment keys.`,
          );
        }
      }
    }

    const localTableKeys = new Set<CiCoreTableKey>();
    for (const tableKey of module.tableKeys ?? []) {
      if (localTableKeys.has(tableKey)) {
        throw new Error(
          `Duplicate table key "${tableKey}" in backend module "${module.id}".`,
        );
      }
      localTableKeys.add(tableKey);

      if (tableKeys.has(tableKey)) {
        throw new Error(`Duplicate backend manifest table key: "${tableKey}".`);
      }
      tableKeys.add(tableKey);
    }
  }

  const activeModules = input.modules.filter(
    (module) => (module.status ?? "active") === "active",
  );
  const activeModuleIds = new Set(activeModules.map((module) => module.id));

  for (const module of activeModules) {
    for (const dependencyId of module.dependencies ?? []) {
      if (!activeModuleIds.has(dependencyId)) {
        throw new Error(
          `Active backend module "${module.id}" depends on inactive or missing module "${String(dependencyId)}".`,
        );
      }
    }
  }

  const activeHandlerIds = activeModules.flatMap((module) => module.handlers);
  const activeTableKeys = activeModules.flatMap(
    (module) => module.tableKeys ?? [],
  );
  const envKeyAllowlist = activeModules.reduce<CiResourceEnvKeyAllowlist>(
    (acc, module) => {
      for (const handlerId of module.handlers) {
        const keys = module.envKeyAllowlist[handlerId];
        if (keys) acc[handlerId] = [...keys];
      }
      return acc;
    },
    {},
  );

  return {
    modules: activeModules,
    moduleIds: activeModules.map((module) => module.id),
    resourceIds: activeModules.map((module) => module.id),
    handlerIds: activeHandlerIds,
    tableKeys: activeTableKeys,
    envKeyAllowlist,
  };
}

/**
 * Define and validate a backend manifest at its single registration point.
 */
export function ciDefineBackendManifest<
  const TModules extends readonly CiBackendManifestModule[],
>(
  input: CiBackendManifestInput<TModules>,
): CiCompiledBackendManifest<TModules[number]> {
  return ciCompileBackendManifest(input);
}
