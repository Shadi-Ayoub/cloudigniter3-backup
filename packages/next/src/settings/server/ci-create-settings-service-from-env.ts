import { ciOk200, type CiDynamoDbClientConfig } from "../../../";
import { Dynamodb } from "@CI/server";

import { ciCreateDynamoSettingsStore } from "./ci-create-dynamo-settings-store";
import { ciCreateSettingsDdbAdapter } from "./ci-create-settings-ddb-adapter";
import { ciCreateSettingsService } from "./ci-create-settings-service";
import { ciResolveRequiredSettingsEnv } from "./ci-resolve-required-settings-env";
import { ciWithDdbClient } from "./ci-with-ddb-client";

import type { CiSettingsService } from "./types/CiSettingsService";
import type { CiResolvedSettingsEnv } from "./types/CiResolvedSettingsEnv";
import type { CiResult, CiErrorBody, CiErrorStatus } from "../../../";

/**
 * Input used to create a settings service from runtime environment values.
 */
export type CiCreateSettingsServiceFromEnvInput = {
  /**
   * Raw environment object, usually `process.env`.
   */
  env: Record<string, string | undefined>;

  /**
   * Optional CloudIgniter DynamoDB client configuration.
   */
  clientConfig?: CiDynamoDbClientConfig;
};

/**
 * Create a DynamoDB-backed settings service using runtime environment values.
 *
 * This version delegates DynamoDB initialization to the shared
 * `ciWithDdbClient` helper so settings persistence stays aligned with the rest
 * of CloudIgniter server infrastructure.
 *
 * Important:
 * - this function returns a `CiResult`
 * - callers must check `ok` before using `data`
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
