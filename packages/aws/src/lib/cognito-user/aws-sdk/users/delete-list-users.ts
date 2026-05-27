import {
  ListUsersCommand,
  type CognitoIdentityProviderClientConfig,
  type CognitoIdentityProviderClient,
  type ListUsersCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';

// see: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-cognito-identity-provider/Interface/ListUsersCommandInput/
interface CognitoListUsersParameters {
  input: ListUsersCommandInput;
  config: CognitoIdentityProviderClientConfig | []; // At least pass the region
}

/**
 * example call: getUsers(input: {UserPoolId: abcdefg}, config: {region: 'us-west-2'})
 * see: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/cognito-identity-provider/
 * see: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/cognito-identity-provider/command/ListUsersCommand/
 * see: // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-cognito-identity-provider/TypeAlias/CognitoIdentityProviderClientConfigType/
 */
export async function listUsers(
  params: CognitoListUsersParameters,
  client: CognitoIdentityProviderClient
) {
  let input: ListUsersCommandInput = {
    UserPoolId: params.input.UserPoolId, // required
  };

  if (params.input.AttributesToGet !== undefined) {
    input.AttributesToGet = params.input.AttributesToGet;
  }

  if (params.input.Filter !== undefined) {
    input.Filter = params.input.Filter;
  }

  if (params.input.Limit !== undefined) {
    input.Limit = params.input.Limit;
  }

  if (params.input.PaginationToken !== undefined) {
    input.PaginationToken = params.input.PaginationToken;
  }

  const command = new ListUsersCommand(input);
  const response = await client.send(command);

  return response;
}
