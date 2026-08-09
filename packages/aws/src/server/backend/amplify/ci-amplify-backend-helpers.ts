import type { CiCoreFunctionId } from "../core-types/functions";
import type { CiCoreRuntime } from "../core-types/runtime";
import type { CiCoreTables } from "../core-types/tables";
import type { CiResourceEnvKeyAllowlist } from "../resources/resource-module.types";

/** Narrow a global environment allowlist to a concrete function collection. */
export function ciPickEnvKeyAllowlistForFunctions<
  TFunctions extends Partial<Record<CiCoreFunctionId, unknown>>,
>(
  allowlist: CiResourceEnvKeyAllowlist,
  functions: TFunctions,
): Partial<
  Record<Extract<keyof TFunctions, CiCoreFunctionId>, readonly string[]>
> {
  const result: Partial<
    Record<Extract<keyof TFunctions, CiCoreFunctionId>, readonly string[]>
  > = {};

  for (const fnId of Object.keys(functions) as Extract<
    keyof TFunctions,
    CiCoreFunctionId
  >[]) {
    const keys = allowlist[fnId];
    if (keys) result[fnId] = keys;
  }
  return result;
}

/** Merge application resources with protected core resources. */
export function ciMergeAmplifyBackendResources<
  TCore extends object,
  TCustom extends object,
>(coreResources: TCore, customResources: TCustom): TCore & TCustom {
  const conflicts = Object.keys(customResources).filter(
    (key) => key in coreResources,
  );
  if (conflicts.length > 0) {
    throw new Error(
      `Extension conflict: The following resource keys already exist in core and cannot be overridden: ${conflicts.join(", ")}`,
    );
  }
  return { ...coreResources, ...customResources };
}

/** Build the provider-neutral runtime consumed by the core post-build planner. */
export function ciCreateAmplifyCoreRuntime(input: {
  region: string;
  envMode?: string;
  tables: CiCoreTables;
}): CiCoreRuntime {
  return {
    region: input.region,
    envMode: input.envMode ?? "live",
    resources: {
      ...input.tables,
      auth: { enabled: true },
    },
  };
}
