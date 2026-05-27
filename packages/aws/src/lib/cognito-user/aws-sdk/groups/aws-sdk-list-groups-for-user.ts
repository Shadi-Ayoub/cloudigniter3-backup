import {
  AdminListGroupsForUserCommand,
  type AdminListGroupsForUserCommandInput,
  type CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

/**
 * Lists the groups that a user belongs to.
 *
 * Amazon Cognito evaluates Identity and Access Management (IAM) policies in
 * requests for this API operation. For this operation, you must use IAM credentials
 * to authorize requests, and you must grant yourself the corresponding IAM
 * permission in a policy.
 *
 * Example input:
 *
 *  {
 *
 *      Username: 'STRING_VALUE', // required
 *      UserPoolId: 'STRING_VALUE', // required
 *      Limit: Number('int'),
 *      NextToken: 'STRING_VALUE',
 *  }
 *
 * Example response:
 *
 * {
 *
 *      Groups: [
 *
 *                  // GroupListType
 *                  { // GroupType
 *                      GroupName: "STRING_VALUE", // Can be undefined
 *                      UserPoolId: "STRING_VALUE", // Can be undefined
 *                      Description: "STRING_VALUE", // Can be undefined
 *                      RoleArn: "STRING_VALUE", // Can be undefined
 *                      Precedence: Number("int"), // Can be undefined
 *                      LastModifiedDate: new Date("TIMESTAMP"), // Can be undefined
 *                      CreationDate: new Date("TIMESTAMP"), // Can be undefined
 *                  },
 *              ],
 *      NextToken: "STRING_VALUE",
 * }
 *
 * @param params
 * @returns
 */
export async function listGroupsForUser(
  params: AdminListGroupsForUserCommandInput,
  client: CognitoIdentityProviderClient
) {
  const command = new AdminListGroupsForUserCommand(params);
  const response = await client.send(command);
  return response;
}
