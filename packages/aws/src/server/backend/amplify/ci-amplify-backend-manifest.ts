import type { CiCoreFunctionId } from "../core-types/functions";
import type { CiCoreTableKey } from "../core-types/tables";
import type { CiCompiledBackendManifest } from "../resources/backend-manifest";

export type CiAmplifyResourceGroupName = "auth" | "data";

export type CiAmplifyFunctionBinding<
  TResource extends object = object,
  TBackendKey extends string = string,
> = {
  backendKey: TBackendKey;
  resource: TResource;
};

export type CiAmplifyTableBinding = {
  modelName: string;
  outputName: string;
};

export type CiAmplifyFeature = {
  status: "active";
  resourceGroupName: CiAmplifyResourceGroupName;
  functions?: Partial<Record<CiCoreFunctionId, CiAmplifyFunctionBinding>>;
  tables?: Partial<Record<CiCoreTableKey, CiAmplifyTableBinding>>;
};

export type CiAmplifyBackendManifest = {
  features: Record<string, CiAmplifyFeature>;
};

type CiUnionToIntersection<T> = (
  T extends unknown ? (value: T) => void : never
) extends (value: infer TIntersection) => void
  ? TIntersection
  : never;

type CiFeatureFunctionsForGroup<
  TManifest extends CiAmplifyBackendManifest,
  TGroup extends CiAmplifyResourceGroupName,
> = CiUnionToIntersection<
  {
    [
      TFeatureId in keyof TManifest["features"]
    ]: TManifest["features"][TFeatureId] extends {
      resourceGroupName: TGroup;
      functions: infer TFunctions;
    }
      ? TFunctions
      : object;
  }[keyof TManifest["features"]]
>;

type CiFunctionResources<TBindings extends object> = {
  [
    TFunctionId in keyof TBindings as TBindings[TFunctionId] extends {
      backendKey: infer TBackendKey extends string;
    }
      ? TBackendKey
      : never
  ]: TBindings[TFunctionId] extends { resource: infer TResource }
    ? TResource
    : never;
};

type CiFeatureTablesForGroup<
  TManifest extends CiAmplifyBackendManifest,
  TGroup extends CiAmplifyResourceGroupName,
> = CiUnionToIntersection<
  {
    [
      TFeatureId in keyof TManifest["features"]
    ]: TManifest["features"][TFeatureId] extends {
      resourceGroupName: TGroup;
      tables: infer TTables;
    }
      ? TTables
      : object;
  }[keyof TManifest["features"]]
>;

type CiBackendFunctionInstances<TBindings extends object> = {
  [
    TFunctionId in keyof TBindings as TBindings[TFunctionId] extends {
      backendKey: infer TBackendKey extends string;
    }
      ? TBackendKey
      : never
  ]: {
    resources: { lambda: unknown };
  };
};

type CiBackendFunctionLambdas<
  TBindings extends object,
  TBackend extends object,
> = {
  [TFunctionId in keyof TBindings]: TBindings[TFunctionId] extends {
    backendKey: infer TBackendKey extends keyof TBackend;
  }
    ? TBackend[TBackendKey] extends {
        resources: { lambda: infer TLambda };
      }
      ? TLambda
      : never
    : never;
};

type CiAmplifyDataTable = {
  tableArn: string;
  tableName: string;
};

const CI_RESERVED_AMPLIFY_BACKEND_KEYS = new Set(["auth", "data"]);

function ciGetFunctionResourceGroup(resource: object): string | undefined {
  const props = (resource as { props?: unknown }).props;
  if (!props || typeof props !== "object") return undefined;

  const resourceGroupName = (props as { resourceGroupName?: unknown })
    .resourceGroupName;

  return typeof resourceGroupName === "string" ? resourceGroupName : "function";
}

/** Validate an Amplify manifest while preserving its inferred resource types. */
export function ciDefineAmplifyBackendManifest<
  const TManifest extends CiAmplifyBackendManifest,
>(manifest: TManifest): TManifest {
  const functionOwners = new Map<string, string>();
  const backendKeyOwners = new Map<string, string>();
  const tableOwners = new Map<string, string>();
  const tableModels = new Map<string, string>();
  const outputOwners = new Map<string, string>();

  for (const [featureId, feature] of Object.entries(manifest.features)) {
    if (!featureId.trim()) {
      throw new Error(
        "[ciDefineAmplifyBackendManifest] Feature IDs must not be empty.",
      );
    }

    const functionEntries = Object.entries(feature.functions ?? {});
    const tableEntries = Object.entries(feature.tables ?? {});
    if (functionEntries.length === 0 && tableEntries.length === 0) {
      throw new Error(
        `[ciDefineAmplifyBackendManifest] Active feature "${featureId}" has no bindings.`,
      );
    }

    for (const [functionId, binding] of functionEntries) {
      const owner = functionOwners.get(functionId);
      if (owner) {
        throw new Error(
          `[ciDefineAmplifyBackendManifest] Function "${functionId}" is bound by both "${owner}" and "${featureId}".`,
        );
      }
      functionOwners.set(functionId, featureId);

      const functionResourceGroup = ciGetFunctionResourceGroup(
        binding.resource,
      );
      if (
        functionResourceGroup !== undefined &&
        functionResourceGroup !== feature.resourceGroupName
      ) {
        throw new Error(
          `[ciDefineAmplifyBackendManifest] Function "${functionId}" is assigned to resource group "${feature.resourceGroupName}" by feature "${featureId}", but defineFunction uses "${functionResourceGroup}".`,
        );
      }

      if (!binding.backendKey.trim()) {
        throw new Error(
          `[ciDefineAmplifyBackendManifest] Function "${functionId}" has an empty backend key.`,
        );
      }
      if (CI_RESERVED_AMPLIFY_BACKEND_KEYS.has(binding.backendKey)) {
        throw new Error(
          `[ciDefineAmplifyBackendManifest] Function "${functionId}" uses reserved backend key "${binding.backendKey}".`,
        );
      }

      const backendKeyOwner = backendKeyOwners.get(binding.backendKey);
      if (backendKeyOwner) {
        throw new Error(
          `[ciDefineAmplifyBackendManifest] Backend key "${binding.backendKey}" is used by both "${backendKeyOwner}" and "${functionId}".`,
        );
      }
      backendKeyOwners.set(binding.backendKey, functionId);
    }

    for (const [tableId, table] of tableEntries) {
      if (!table.modelName.trim() || !table.outputName.trim()) {
        throw new Error(
          `[ciDefineAmplifyBackendManifest] Table "${tableId}" must define non-empty model and output names.`,
        );
      }

      const tableOwner = tableOwners.get(tableId);
      if (tableOwner) {
        throw new Error(
          `[ciDefineAmplifyBackendManifest] Table "${tableId}" is bound by both "${tableOwner}" and "${featureId}".`,
        );
      }
      tableOwners.set(tableId, featureId);

      const modelOwner = tableModels.get(table.modelName);
      if (modelOwner) {
        throw new Error(
          `[ciDefineAmplifyBackendManifest] Data model "${table.modelName}" is bound by both "${modelOwner}" and "${featureId}".`,
        );
      }
      tableModels.set(table.modelName, featureId);

      const outputOwner = outputOwners.get(table.outputName);
      if (outputOwner) {
        throw new Error(
          `[ciDefineAmplifyBackendManifest] Output "${table.outputName}" is bound by both "${outputOwner}" and "${featureId}".`,
        );
      }
      outputOwners.set(table.outputName, featureId);
    }
  }

  return manifest;
}

/** Collect all function bindings assigned to one Amplify resource group. */
export function ciGetAmplifyFunctionBindings<
  const TManifest extends CiAmplifyBackendManifest,
  const TGroup extends CiAmplifyResourceGroupName,
>(
  manifest: TManifest,
  group: TGroup,
): CiFeatureFunctionsForGroup<TManifest, TGroup> {
  const bindings: Record<string, CiAmplifyFunctionBinding> = {};
  for (const feature of Object.values(manifest.features)) {
    if (feature.resourceGroupName === group) {
      Object.assign(bindings, feature.functions);
    }
  }
  return bindings as CiFeatureFunctionsForGroup<TManifest, TGroup>;
}

/** Re-key function factories by the property consumed by `defineBackend(...)`. */
export function ciGetAmplifyFunctionResourcesFromBindings<
  const TBindings extends object,
>(bindings: TBindings): CiFunctionResources<TBindings> {
  const runtimeBindings = bindings as Record<string, CiAmplifyFunctionBinding>;
  return Object.fromEntries(
    Object.values(runtimeBindings).map((binding) => [
      binding.backendKey,
      binding.resource,
    ]),
  ) as CiFunctionResources<TBindings>;
}

/** Resolve stable function IDs to Lambda constructs created by Amplify. */
export function ciResolveAmplifyFunctionLambdas<
  const TBindings extends object,
  const TBackend extends object,
>(
  backend: TBackend & CiBackendFunctionInstances<TBindings>,
  bindings: TBindings,
): CiBackendFunctionLambdas<TBindings, TBackend> {
  const functions: Record<string, unknown> = {};
  const backendInstances = backend as Record<
    string,
    { resources: { lambda: unknown } } | undefined
  >;

  for (const [functionId, binding] of Object.entries(bindings) as [
    string,
    CiAmplifyFunctionBinding,
  ][]) {
    const instance = backendInstances[binding.backendKey];
    if (!instance) {
      throw new Error(
        `[ciResolveAmplifyFunctionLambdas] Backend resource "${binding.backendKey}" for function "${functionId}" is not defined.`,
      );
    }
    functions[functionId] = instance.resources.lambda;
  }
  return functions as CiBackendFunctionLambdas<TBindings, TBackend>;
}

/** Collect all table bindings assigned to one Amplify resource group. */
export function ciGetAmplifyTableBindings<
  const TManifest extends CiAmplifyBackendManifest,
  const TGroup extends CiAmplifyResourceGroupName,
>(
  manifest: TManifest,
  group: TGroup,
): CiFeatureTablesForGroup<TManifest, TGroup> {
  const bindings: Record<string, CiAmplifyTableBinding> = {};
  for (const feature of Object.values(manifest.features)) {
    if (feature.resourceGroupName === group) {
      Object.assign(bindings, feature.tables);
    }
  }
  return bindings as CiFeatureTablesForGroup<TManifest, TGroup>;
}

/** Resolve logical table bindings against synthesized Amplify Data tables. */
export function ciCompileAmplifyDataBindings<
  const TBindings extends Record<string, CiAmplifyTableBinding>,
>(amplifyTables: object, bindings: TBindings) {
  const resolvedTables = amplifyTables as Record<
    string,
    CiAmplifyDataTable | undefined
  >;
  const tables: Record<string, { arn: string; name: string }> = {};
  const tableArns: Record<string, string> = {};
  const outputs: Record<string, string> = {};

  for (const [tableId, binding] of Object.entries(bindings)) {
    const table = resolvedTables[binding.modelName];
    if (!table) {
      throw new Error(
        `[ciCompileAmplifyDataBindings] Required Amplify data model "${binding.modelName}" for table "${tableId}" is not defined.`,
      );
    }
    tables[tableId] = { name: table.tableName, arn: table.tableArn };
    tableArns[tableId] = table.tableArn;
    outputs[binding.outputName] = table.tableName;
  }

  return {
    tables: tables as Record<keyof TBindings, { arn: string; name: string }>,
    tableArns: tableArns as Record<keyof TBindings, string>,
    outputs: outputs as Record<
      TBindings[keyof TBindings]["outputName"],
      string
    >,
  };
}

/** Fail synthesis when package contract and concrete Amplify bindings drift. */
export function ciAssertAmplifyBackendContract(
  contract: Pick<CiCompiledBackendManifest, "handlerIds" | "tableKeys">,
  manifest: CiAmplifyBackendManifest,
): void {
  const functionIds = Object.values(manifest.features).flatMap((feature) =>
    Object.keys(feature.functions ?? {}),
  );
  const tableKeys = Object.values(manifest.features).flatMap((feature) =>
    Object.keys(feature.tables ?? {}),
  );
  const expectedFunctionIds = new Set<string>(contract.handlerIds);
  const actualFunctionIds = new Set(functionIds);
  const expectedTableKeys = new Set<string>(contract.tableKeys);
  const actualTableKeys = new Set(tableKeys);
  const missingFunctions = [...expectedFunctionIds].filter(
    (id) => !actualFunctionIds.has(id),
  );
  const unexpectedFunctions = [...actualFunctionIds].filter(
    (id) => !expectedFunctionIds.has(id),
  );
  const missingTables = [...expectedTableKeys].filter(
    (id) => !actualTableKeys.has(id),
  );
  const unexpectedTables = [...actualTableKeys].filter(
    (id) => !expectedTableKeys.has(id),
  );

  if (
    missingFunctions.length ||
    unexpectedFunctions.length ||
    missingTables.length ||
    unexpectedTables.length
  ) {
    throw new Error(
      [
        "[ciAssertAmplifyBackendContract] Active package contract and Amplify bindings are out of sync.",
        `Missing functions: ${missingFunctions.join(", ") || "none"}.`,
        `Unexpected functions: ${unexpectedFunctions.join(", ") || "none"}.`,
        `Missing tables: ${missingTables.join(", ") || "none"}.`,
        `Unexpected tables: ${unexpectedTables.join(", ") || "none"}.`,
      ].join(" "),
    );
  }
}

/** Compile every application projection after validating package parity. */
export function ciCompileAmplifyBackendBindings<
  const TManifest extends CiAmplifyBackendManifest,
>(
  contract: Pick<CiCompiledBackendManifest, "handlerIds" | "tableKeys">,
  manifest: TManifest,
) {
  ciAssertAmplifyBackendContract(contract, manifest);

  const authFunctionBindings = ciGetAmplifyFunctionBindings(manifest, "auth");
  const dataFunctionBindings = ciGetAmplifyFunctionBindings(manifest, "data");
  const functionBindings = Object.assign(
    {},
    authFunctionBindings,
    dataFunctionBindings,
  );

  return {
    authFunctionBindings,
    dataFunctionBindings,
    functionBindings,
    functionResources:
      ciGetAmplifyFunctionResourcesFromBindings(functionBindings),
    tableBindings: ciGetAmplifyTableBindings(manifest, "data"),
  };
}
