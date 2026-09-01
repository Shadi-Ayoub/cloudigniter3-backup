import { ciCreateLambdaHandler, ciSetCognitoUserPassword } from "@ci-aws/lib";
import type { CiSetCognitoUserPasswordInterface } from "@ci-aws/types";

import {
  CI_COGNITO_USER_MUTATION_ENV,
  ciAuthorizeCognitoUserMutation,
  ciProtectCognitoUserMutationHandler,
} from "./ci-cognito-user-mutation-guard";

/**
 * Set a Cognito user password.
 */
export const ciSetCognitoUserPasswordHandler =
  ciProtectCognitoUserMutationHandler(
    ciCreateLambdaHandler<
      CiSetCognitoUserPasswordInterface,
      typeof CI_COGNITO_USER_MUTATION_ENV
    >({
      handlerName: "CI_SET_COGNITO_USER_PASSWORD_HANDLER",
      requestMode: "direct-input",
      ciEnvVars: CI_COGNITO_USER_MUTATION_ENV,
      validate: async ({ input, event, env, region, ciValidationError }) => {
        const decision = await ciAuthorizeCognitoUserMutation({
          event,
          configuredUserPoolId: env.CI_USER_POOL_ID,
          targetUserPoolId: input.command.UserPoolId,
          targetUsername: input.command.Username,
          kind: "set-password",
          accessControlTableName: env.CI_EMBERGUARD_ACCESS_TABLE,
          region,
          clientConfig: { region },
        });
        if (!decision.allowed) {
          return ciValidationError(decision.reason, decision.statusCode);
        }
      },
      run: ({ input, env, region }) =>
        ciSetCognitoUserPassword({
          ...input,
          command: { ...input.command, UserPoolId: env.CI_USER_POOL_ID },
          options: { ...input.options, CognitoClientConfig: { region } },
        }),
    }),
  );
