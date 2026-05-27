import {
  AdminDeleteUserCommand,
  type AdminDeleteUserCommandInput,
  type CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

/**
 * Deletes a user from the specified Cognito user pool.
 *
 * Example:
 *
 * {
 *   UserPoolId: 'eu-west-1_abc123',
 *   Username: 'john.doe'
 * }
 */
export async function awsSdkDeleteCognitoUser(
  input: AdminDeleteUserCommandInput,
  client: CognitoIdentityProviderClient
) {
  const command = new AdminDeleteUserCommand(input);
  return await client.send(command);
}
