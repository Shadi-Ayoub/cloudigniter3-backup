import { ciCreateLambdaHandler, ciUpdateCognitoUser } from "@ci-aws/lib";
import type { CiUpdateCognitoUserInterface } from "@ci-aws/types";

import {
  CI_COGNITO_USER_MUTATION_ENV,
  ciAuthorizeCognitoUserMutation,
  ciProtectCognitoUserMutationHandler,
} from "./ci-cognito-user-mutation-guard";

/**
 * Update a Cognito user.
 */
export const ciUpdateCognitoUserHandler = ciProtectCognitoUserMutationHandler(
  ciCreateLambdaHandler<
    CiUpdateCognitoUserInterface,
    typeof CI_COGNITO_USER_MUTATION_ENV
  >({
    handlerName: "CI_UPDATE_COGNITO_USER_HANDLER",
    requestMode: "direct-input",
    ciEnvVars: CI_COGNITO_USER_MUTATION_ENV,
    validate: async ({ input, event, env, region, ciValidationError }) => {
      const decision = await ciAuthorizeCognitoUserMutation({
        event,
        configuredUserPoolId: env.CI_USER_POOL_ID,
        targetUserPoolId: input.cognito.UserPoolId,
        targetUsername: input.cognito.Username,
        kind: "update",
        requestedRoleIds: input.groups,
        updateAttributeNames: input.cognito.UserAttributes.map(
          (attribute) => attribute.Name,
        ),
        accessControlTableName: env.CI_EMBERGUARD_ACCESS_TABLE,
        region,
        clientConfig: { region },
      });
      if (!decision.allowed) {
        return ciValidationError(decision.reason, decision.statusCode);
      }
    },
    run: ({ input, env, region }) =>
      ciUpdateCognitoUser({
        ...input,
        cognito: { ...input.cognito, UserPoolId: env.CI_USER_POOL_ID },
        CognitoClientConfig: { region },
      }),
  }),
);
