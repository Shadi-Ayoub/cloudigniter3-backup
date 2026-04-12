import { ciErrorResult } from "@cloudigniter/core";
import { type CiDeleteSettingsHandlerInput } from "@cloudigniter/core/server";
import { ciCreateLambdaHandler } from "../../";
import { ciCreateSettingsServiceFromEnv } from "../";

/**
 * Create a Lambda handler that deletes one settings override record.
 *
 * @returns Lambda handler.
 */
export function ciCreateDeleteSettingsHandler() {
  return ciCreateLambdaHandler<CiDeleteSettingsHandlerInput>({
    handlerName: "ciDeleteSettingsHandler",

    async run(runtime) {
      const { input } = runtime;

      const ciServiceResult = await ciCreateSettingsServiceFromEnv({
        env: runtime.env,
        clientConfig: runtime.clientConfig,
      });

      if (!ciServiceResult.ok) {
        return ciServiceResult;
      }

      const ciService = ciServiceResult.body;

      try {
        const ciDeleted = await ciService.deleteRecord({
          settingsId: input.settingsId,
          scope: input.scope,
          targetTenantScope: input.targetTenantScope,
          tenantId: input.tenantId,
          userId: input.userId,
        });

        return {
          ok: true,
          statusCode: 200,
          body: {
            deleted: ciDeleted,
          },
        };
      } catch (error) {
        const ciMessage =
          error instanceof Error ? error.message : "Failed to delete settings.";

        return ciErrorResult(500, ciMessage);
      }
    },
  });
}
