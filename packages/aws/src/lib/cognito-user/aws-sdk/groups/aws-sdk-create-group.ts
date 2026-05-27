import {
  CreateGroupCommand,
  type CognitoIdentityProviderClient,
  type CreateGroupCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';

/**
 * Creates a new group in the specified user pool.
 *
 * Amazon Cognito evaluates Identity and Access Management (IAM) policies in requests for
 * this API operation. For this operation, you must use IAM credentials to authorize requests,
 * and you must grant yourself the corresponding IAM permission in a policy.
 *
 * see: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-cognito-identity-provider/Class/CreateGroupCommand/
 *
 * @param params
 * @returns
 */
export async function createGroup(
  params: CreateGroupCommandInput,
  client: CognitoIdentityProviderClient
) {
  const command = new CreateGroupCommand(params);
  const response = await client.send(command);

  return response;
}
