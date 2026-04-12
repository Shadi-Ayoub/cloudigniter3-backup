import { ciErrorResult, type CiSettingsRegistry } from "@cloudigniter/core";
import { type CiSetSettingsHandlerInput } from "@cloudigniter/core/server";
import { ciCreateLambdaHandler, ciCreateSettingsServiceFromEnv } from "../../";

/**
 * Create a Lambda handler that persists one settings override record.
 *
 * @returns Lambda handler.
 */
export function ciCreateSetSettingsHandler() {
  return ciCreateLambdaHandler<CiSetSettingsHandlerInput>({
    handlerName: "ciSetSettingsHandler",

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
        const ciRecord = await ciService.setRecord({
          settingsId: input.settingsId,
          scope: input.scope,
          targetTenantScope: input.targetTenantScope,
          tenantId: input.tenantId,
          userId: input.userId,
          value: input.value,
        });

        return {
          ok: true,
          statusCode: 200,
          body: ciRecord,
        };
      } catch (error) {
        const ciMessage =
          error instanceof Error
            ? error.message
            : "Failed to persist settings.";

        return ciErrorResult(500, ciMessage);
      }
    },
  });
}
