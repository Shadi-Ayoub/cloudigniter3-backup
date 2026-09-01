import { ciCreateCognitoUser, ciCreateLambdaHandler } from "@ci-aws/lib";
import type { CiCreateCognitoUserInterface } from "@ci-aws/types";

import {
  CI_COGNITO_USER_MUTATION_ENV,
  ciAuthorizeCognitoUserMutation,
  ciProtectCognitoUserMutationHandler,
} from "./ci-cognito-user-mutation-guard";

/**
 * Create a Cognito user.
 */
export const ciCreateCognitoUserHandler = ciProtectCognitoUserMutationHandler(
  ciCreateLambdaHandler<
    CiCreateCognitoUserInterface,
    typeof CI_COGNITO_USER_MUTATION_ENV
  >({
    handlerName: "CI_CREATE_COGNITO_USER_HANDLER",
    requestMode: "direct-input",
    ciEnvVars: CI_COGNITO_USER_MUTATION_ENV,
    validate: async ({ input, event, env, region, ciValidationError }) => {
      const decision = await ciAuthorizeCognitoUserMutation({
        event,
        configuredUserPoolId: env.CI_USER_POOL_ID,
        targetUserPoolId: input.cognito.UserPoolId,
        targetUsername: input.cognito.Username,
        kind: "create",
        requestedRoleIds: input.groups ?? [],
        accessControlTableName: env.CI_EMBERGUARD_ACCESS_TABLE,
        region,
        clientConfig: { region },
      });
      if (!decision.allowed) {
        return ciValidationError(decision.reason, decision.statusCode);
      }
    },
    run: ({ input, env, region }) =>
      ciCreateCognitoUser({
        ...input,
        cognito: { ...input.cognito, UserPoolId: env.CI_USER_POOL_ID },
        CognitoClientConfig: { region },
      }),
  }),
);
