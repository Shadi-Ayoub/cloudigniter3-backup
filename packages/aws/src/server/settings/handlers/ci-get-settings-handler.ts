import { ciErrorResult, type CiSettingsRegistry } from "@cloudigniter/core";
import { type CiGetSettingsHandlerInput } from "@cloudigniter/core/server";
import { ciCreateLambdaHandler, ciCreateSettingsServiceFromEnv } from "../../";

/**
 * Create a Lambda handler that resolves final merged settings.
 *
 * The consuming backend/application layer provides the settings registry.
 *
 * @param registry - Settings registry used for resolution.
 * @returns Lambda handler.
 */
export function ciCreateGetSettingsHandler(registry: CiSettingsRegistry) {
  return ciCreateLambdaHandler<CiGetSettingsHandlerInput>({
    handlerName: "ciGetSettingsHandler",

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
        const ciResolved = await ciService.getResolved({
          registry,
          settingsId: input.settingsId,
          scope: input.scope,
          context: input.context,
        });

        return {
          ok: true,
          statusCode: 200,
          body: ciResolved,
        };
      } catch (error) {
        const ciMessage =
          error instanceof Error
            ? error.message
            : "Failed to resolve settings.";

        return ciErrorResult(500, ciMessage);
      }
    },
  });
}
