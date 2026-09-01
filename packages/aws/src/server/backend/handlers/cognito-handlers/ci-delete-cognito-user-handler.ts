import { ciCreateLambdaHandler, ciDeleteCognitoUser } from "@ci-aws/lib";
import type { CiDeleteCognitoUserInterface } from "@ci-aws/types";

import {
  CI_COGNITO_USER_MUTATION_ENV,
  ciAuthorizeCognitoUserMutation,
  ciProtectCognitoUserMutationHandler,
} from "./ci-cognito-user-mutation-guard";

/**
 * Delete a Cognito user.
 */
export const ciDeleteCognitoUserHandler = ciProtectCognitoUserMutationHandler(
  ciCreateLambdaHandler<
    CiDeleteCognitoUserInterface,
    typeof CI_COGNITO_USER_MUTATION_ENV
  >({
    handlerName: "CI_DELETE_COGNITO_USER_HANDLER",
    requestMode: "direct-input",
    ciEnvVars: CI_COGNITO_USER_MUTATION_ENV,
    validate: async ({ input, event, env, region, ciValidationError }) => {
      const decision = await ciAuthorizeCognitoUserMutation({
        event,
        configuredUserPoolId: env.CI_USER_POOL_ID,
        targetUserPoolId: input.cognito.UserPoolId,
        targetUsername: input.cognito.Username,
        kind: "delete",
        accessControlTableName: env.CI_EMBERGUARD_ACCESS_TABLE,
        region,
        clientConfig: { region },
      });
      if (!decision.allowed) {
        return ciValidationError(decision.reason, decision.statusCode);
      }
    },
    run: ({ input, env, region }) =>
      ciDeleteCognitoUser({
        ...input,
        cognito: { ...input.cognito, UserPoolId: env.CI_USER_POOL_ID },
        CognitoClientConfig: { region },
      }),
  }),
);
