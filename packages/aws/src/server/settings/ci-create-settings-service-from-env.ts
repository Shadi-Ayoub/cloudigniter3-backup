import {
  ciOk200,
  type CiErrorBody,
  type CiErrorStatus,
  type CiResult,
} from "@cloudigniter/core";
import {
  type CiResolvedSettingsEnv,
  type CiSettingsService,
} from "@cloudigniter/core/server";

import {
  Dynamodb,
  ciCreateDynamoSettingsStore,
  ciCreateSettingsService,
  ciResolveRequiredSettingsEnv,
} from "../";
import {
  ciCreateSettingsDdbAdapter,
  type CiCreateSettingsServiceFromEnvInput,
} from "../";
import { ciWithDdbClient } from "../";

/**
 * Create a DynamoDB-backed settings service using runtime environment values.
 *
 * Overview
 * --------
 * This helper is the AWS bootstrap layer for the CloudIgniter settings service.
 * It performs the following steps:
 *
 * 1. Resolve the required settings-related environment variables
 * 2. Initialize the CloudIgniter `Dynamodb` wrapper
 * 3. Create the settings DynamoDB adapter
 * 4. Create the settings store
 * 5. Create the final settings service
 *
 * Architecture
 * ------------
 * - Settings domain contracts and pure builders come from `@cloudigniter/core`
 * - AWS-specific client/bootstrap logic stays in the AWS package
 *
 * Important
 * ---------
 * - this function returns a `CiResult`
 * - callers must check `ok` before using `body`
 *
 * @param input - Service creation input.
 * @returns Result containing the configured settings service.
 */
export async function ciCreateSettingsServiceFromEnv(
  input: CiCreateSettingsServiceFromEnvInput,
): Promise<CiResult<CiSettingsService, CiErrorBody, 200, CiErrorStatus>> {
  const { env, clientConfig } = input;

  let ciResolvedEnv: CiResolvedSettingsEnv;

  try {
    ciResolvedEnv = ciResolveRequiredSettingsEnv(env);
  } catch (error) {
    const ciMessage =
      error instanceof Error
        ? error.message
        : "Failed to resolve required settings environment variables.";

    return {
      ok: false,
      statusCode: 500,
      body: {
        error: ciMessage,
      },
    };
  }

  const ciDdb = new Dynamodb(clientConfig);

  return ciWithDdbClient(ciDdb, async (ciInitializedDdb) => {
    const ciAdapter = ciCreateSettingsDdbAdapter(ciInitializedDdb);

    const ciStore = ciCreateDynamoSettingsStore({
      adapter: ciAdapter,
      publicSettingsTableName: ciResolvedEnv.publicSettingsTableName,
      privateSettingsTableName: ciResolvedEnv.privateSettingsTableName,
      userSettingsTableName: ciResolvedEnv.userSettingsTableName,
    });

    const ciService = ciCreateSettingsService(ciStore);

    return ciOk200(ciService);
  });
}
