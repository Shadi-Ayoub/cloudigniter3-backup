import {
  AdminGetUserCommand,
  type AdminGetUserCommandInput,
  type CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

/**
 * Use a bare-bones client and the command you need to make an API call.
 * This method requires UserPoolId and Username in the input parameter. It
 * returns the user details:
 * { // AdminGetUserResponse
 *   Username: "STRING_VALUE", // required
 *   UserAttributes: [ // AttributeListType
 *    { // AttributeType
 *      Name: "STRING_VALUE", // required
 *      Value: "STRING_VALUE",
 *    },
 *   ],
 *   UserCreateDate: new Date("TIMESTAMP"),
 *   UserLastModifiedDate: new Date("TIMESTAMP"),
 *   Enabled: true || false,
 *   UserStatus: "UNCONFIRMED" || "CONFIRMED" || "ARCHIVED" || "COMPROMISED" || "UNKNOWN" || "RESET_REQUIRED" || "FORCE_CHANGE_PASSWORD" || "EXTERNAL_PROVIDER",
 *   MFAOptions: [ // MFAOptionListType
 *    { // MFAOptionType
 *      DeliveryMedium: "SMS" || "EMAIL",
 *      AttributeName: "STRING_VALUE",
 *    },
 *   ],
 *   PreferredMfaSetting: "STRING_VALUE",
 *   UserMFASettingList: [ // UserMFASettingListType
 *    "STRING_VALUE",
 *   ],
 * };
 *
 * @param input
 * @param client
 * @returns
 */
export async function awsSdkGetCognitoUser(input: AdminGetUserCommandInput, client: CognitoIdentityProviderClient) {
  const command = new AdminGetUserCommand(input);
  return await client.send(command);
}
