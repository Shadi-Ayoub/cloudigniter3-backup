import {
  type CiCoreFunctionId,
  type CiCoreTables,
  ciCompileAmplifyDataBindings,
  ciPickEnvKeyAllowlistForFunctions,
  ciResolveAmplifyFunctionLambdas,
  resourceEnvKeyAllowlist,
} from "@cloudigniter/aws/server/backend";
import {
  CI_CORE_AMPLIFY_DATA_FUNCTION_BINDINGS,
  CI_CORE_AMPLIFY_TABLE_BINDINGS,
} from "./ci-core-amplify-manifest";
import type { CiBackend } from "./types";

export const ciGetDataStack = (backend: CiBackend) => {
  const compiledData = ciCompileAmplifyDataBindings(
    backend.data.resources.tables,
    CI_CORE_AMPLIFY_TABLE_BINDINGS,
  );
  const tables: CiCoreTables = compiledData.tables;
  const tableArns = compiledData.tableArns;

  const functions = ciResolveAmplifyFunctionLambdas(
    backend,
    CI_CORE_AMPLIFY_DATA_FUNCTION_BINDINGS,
  );

  const CI_DATA_FUNCS_IDS = Object.keys(
    CI_CORE_AMPLIFY_DATA_FUNCTION_BINDINGS,
  ) as (keyof typeof functions & CiCoreFunctionId)[];

  const envKeyAllowlist = ciPickEnvKeyAllowlistForFunctions(
    resourceEnvKeyAllowlist,
    functions,
  );

  return {
    tables,
    tableArns,
    outputs: compiledData.outputs,
    functions,
    CI_DATA_FUNCS_IDS,
    envKeyAllowlist,
  };
};
