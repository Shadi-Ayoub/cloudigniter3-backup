import {
  AdminCreateUserCommand,
  type AdminCreateUserCommandInput,
  type CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

/**
 * Creates a new user in Cognito specified user pool and a record in the users table.
 *
 * AdminCreateUserCommand:
 * If MessageAction isn't set, the default is to send a welcome message via email or phone (SMS).
 *
 * This action might generate an SMS text message. Starting June 1, 2021, US telecom carriers require
 * you to register an origination phone number before you can send SMS messages to US phone numbers.
 * If you use SMS text messages in Amazon Cognito, you must register a phone number with Amazon Pinpoint.
 * Amazon Cognito uses the registered number automatically. Otherwise, Amazon Cognito users who must receive
 * SMS messages might not be able to sign up, activate their accounts, or sign in.
 *
 * If you have never used SMS text messages with Amazon Cognito or any other Amazon Web Servicesservice, Amazon
 * Simple Notification Service might place your account in the SMS sandbox. In sandbox mode, you can send
 * messages only to verified phone numbers. After you test your app while in the sandbox environment, you
 * can move out of the sandbox and into production. For more information, see SMS message settings for Amazon
 * Cognito user pools in the Amazon Cognito Developer Guide.
 *
 * This message is based on a template that you
 * configured in your call to create or update a user pool. This template includes your custom sign-up
 * instructions and placeholders for user name and temporary password.
 *
 * Alternatively, you can call AdminCreateUser with SUPPRESS for the MessageAction parameter, and Amazon Cognito
 * won't send any email. In either case, the user will be in the FORCE_CHANGE_PASSWORD state until they sign in
 * and change their password.
 *
 * Amazon Cognito evaluates Identity and Access Management (IAM) policies in requests for this API operation.
 * For this operation, you must use IAM credentials to authorize requests, and you must grant yourself the
 * corresponding IAM permission in a policy.
 *
 * see: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-cognito-identity-provider/Class/AdminCreateUserCommand/
 *
 * @param params
 * @returns
 */
export async function awsSdkCreateCognitoUser(
  input: AdminCreateUserCommandInput,
  client: CognitoIdentityProviderClient
) {
  const command = new AdminCreateUserCommand(input);
  return await client.send(command);
}
