import {
  AdminDisableUserCommand,
  AdminEnableUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { ciMapCognitoError } from "@ci-aws/lib";
import type { CISetCognitoUserEnabledInput } from "@ci-aws/types";
import { ciOk200 } from "@cloudigniter/core/lib";
import type { CiResult } from "@cloudigniter/core/types";
import { ciCreateCognitoClient } from "./helpers";

/** Enables or disables a Cognito identity without deleting it. */
export async function ciSetCognitoUserEnabled(
  input: CISetCognitoUserEnabledInput,
): Promise<CiResult<{ enabled: boolean }>> {
  try {
    const cognito = await ciCreateCognitoClient(input.clientConfig);
    const client = await cognito.getIdentityProviderClient();
    const commandInput = {
      UserPoolId: input.userPoolId,
      Username: input.username,
    };
    await client.send(
      input.enabled
        ? new AdminEnableUserCommand(commandInput)
        : new AdminDisableUserCommand(commandInput),
    );
    return ciOk200({ enabled: input.enabled });
  } catch (error) {
    return ciMapCognitoError<{ enabled: boolean }>(error);
  }
}
