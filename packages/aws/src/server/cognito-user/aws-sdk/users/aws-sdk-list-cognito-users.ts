import {
  ListUsersCommand,
  type CognitoIdentityProviderClient,
  type ListUsersCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';

/**
 * Lists users in a Cognito user pool.
 *
 * Supported input members include:
 * - UserPoolId (required)
 * - AttributesToGet
 * - Filter
 * - Limit
 * - PaginationToken
 *
 * Example:
 * {
 *   UserPoolId: 'eu-west-1_abc123',
 *   Limit: 25,
 *   Filter: 'email ^= "john"'
 * }
 */
export async function awsSdkListCognitoUsers(input: ListUsersCommandInput, client: CognitoIdentityProviderClient) {
  const command = new ListUsersCommand(input);
  return await client.send(command);
}
