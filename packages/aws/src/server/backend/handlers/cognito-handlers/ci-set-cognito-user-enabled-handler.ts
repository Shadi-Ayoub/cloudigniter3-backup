import { ciCreateLambdaHandler, ciSetCognitoUserEnabled } from "@ci-aws/lib";
import type { CISetCognitoUserEnabledInput } from "@ci-aws/types";

import {
  CI_COGNITO_USER_MUTATION_ENV,
  ciAuthorizeCognitoUserMutation,
  ciProtectCognitoUserMutationHandler,
} from "./ci-cognito-user-mutation-guard";

/** Enables or disables one Cognito identity. */
export const ciSetCognitoUserEnabledHandler =
  ciProtectCognitoUserMutationHandler(
    ciCreateLambdaHandler<
      CISetCognitoUserEnabledInput,
      typeof CI_COGNITO_USER_MUTATION_ENV
    >({
      handlerName: "CI_SET_COGNITO_USER_ENABLED_HANDLER",
      requestMode: "direct-input",
      ciEnvVars: CI_COGNITO_USER_MUTATION_ENV,
      validate: async ({ input, event, env, region, ciValidationError }) => {
        const decision = await ciAuthorizeCognitoUserMutation({
          event,
          configuredUserPoolId: env.CI_USER_POOL_ID,
          targetUserPoolId: input.userPoolId,
          targetUsername: input.username,
          kind: "set-enabled",
          requestedEnabled: input.enabled,
          accessControlTableName: env.CI_EMBERGUARD_ACCESS_TABLE,
          region,
          clientConfig: { region },
        });
        if (!decision.allowed) {
          return ciValidationError(decision.reason, decision.statusCode);
        }
      },
      run: ({ input, env, region }) =>
        ciSetCognitoUserEnabled({
          ...input,
          userPoolId: env.CI_USER_POOL_ID,
          clientConfig: { region },
        }),
    }),
  );
