import {
  AdminUpdateUserAttributesCommand,
  type AdminUpdateUserAttributesCommandInput,
  type CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

/**
 * Updates attributes for an existing Cognito user.
 *
 * Notes:
 * - This is an admin operation and requires IAM-authorized credentials.
 * - To remove an attribute, pass the attribute with an empty string value.
 * - Custom attributes must use the `custom:` prefix.
 *
 * Example:
 * {
 *   UserPoolId: 'eu-west-1_abc123',
 *   Username: 'john.doe',
 *   UserAttributes: [
 *     { Name: 'email', Value: 'john@company.com' },
 *     { Name: 'custom:department', Value: 'IT' },
 *   ]
 * }
 */
export async function awsSdkUpdateCognitoUser(
  input: AdminUpdateUserAttributesCommandInput,
  client: CognitoIdentityProviderClient
) {
  const command = new AdminUpdateUserAttributesCommand(input);
  return await client.send(command);
}
