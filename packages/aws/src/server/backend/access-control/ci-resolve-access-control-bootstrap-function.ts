import {
  GetFunctionConfigurationCommand,
  LambdaClient,
  ListFunctionsCommand,
} from "@aws-sdk/client-lambda";

import { CI_ENV } from "../env/env.keys";

const CI_ACCESS_CONTROL_BOOTSTRAP_FUNCTION_TOKEN = "getemberguarddefinition";

function ciNormalizeFunctionName(value: string): string {
  return value.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
}

/**
 * Resolves the deployed access-control reader by its stable function-name token
 * and exact EmberGuard table binding.
 */
export async function ciResolveAccessControlBootstrapFunction(input: {
  accessControlTableName: string;
  client: Pick<LambdaClient, "send">;
}): Promise<string> {
  const candidates: string[] = [];
  let marker: string | undefined;

  do {
    const page = await input.client.send(
      new ListFunctionsCommand({ Marker: marker }),
    );
    for (const fn of page.Functions ?? []) {
      const functionName = fn.FunctionName;
      if (
        functionName &&
        ciNormalizeFunctionName(functionName).includes(
          CI_ACCESS_CONTROL_BOOTSTRAP_FUNCTION_TOKEN,
        )
      ) {
        candidates.push(functionName);
      }
    }
    marker = page.NextMarker;
  } while (marker);

  const matches: string[] = [];
  for (const functionName of candidates) {
    const configuration = await input.client.send(
      new GetFunctionConfigurationCommand({ FunctionName: functionName }),
    );
    if (
      configuration.Environment?.Variables?.[
        CI_ENV.CI_EMBERGUARD_ACCESS_TABLE_NAME
      ] === input.accessControlTableName
    ) {
      matches.push(functionName);
    }
  }

  if (matches.length === 1) return matches[0]!;
  if (matches.length > 1) {
    throw new Error(
      `[ciResolveAccessControlBootstrapFunction] More than one deployed handler targets table "${input.accessControlTableName}".`,
    );
  }
  throw new Error(
    `[ciResolveAccessControlBootstrapFunction] No deployed get-definition handler targets table "${input.accessControlTableName}".`,
  );
}
