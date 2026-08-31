import {
  CognitoIdentityProviderClient,
  type AdminCreateUserCommandInput,
  type AdminDeleteUserCommandInput,
  type AdminGetUserCommandInput,
  type AdminSetUserPasswordCommandInput,
  type AdminUpdateUserAttributesCommandInput,
  type CognitoIdentityProviderClientConfig,
  type ListUsersCommandInput,
} from "@aws-sdk/client-cognito-identity-provider";
import { fetchAuthSession } from "aws-amplify/auth";
import { ciOk200 } from "@cloudigniter/core/lib";
import { ciGeneratePassword as generateCognitoUserPassword } from "@cloudigniter/core/lib";
import { ciMapCognitoError } from "@ci-aws/lib";
import {
  type CiCognitoCreateUserResult,
  type CiCognitoDeleteUserResult,
  type CiCognitoGetUserResult,
  type CiCognitoListUsersResult,
  type CiCognitoSetUserPasswordResult,
  type CiCognitoUpdateUserResult,
} from "@ci-aws/types";

import {
  awsSdkCreateCognitoUser,
  awsSdkDeleteCognitoUser,
  awsSdkGetCognitoUser,
  awsSdkListCognitoUsers,
  awsSdkSetCognitoUserPassword,
  awsSdkUpdateCognitoUser,
} from "../aws-sdk";

/**
 * CloudIgniter Cognito service wrapper.
 *
 * Responsibilities:
 * - lazily initialize the AWS Cognito client
 * - support both Lambda runtime and authenticated browser/server-session runtime
 * - expose CloudIgniter-standard result objects (`CiResult`)
 * - normalize AWS Cognito exceptions through `ciMapCognitoError`
 */
export class Cognito {
  private client: CognitoIdentityProviderClient | null = null;
  private cognitoClientConfig?: CognitoIdentityProviderClientConfig | null =
    null;

  constructor(clientConfig?: CognitoIdentityProviderClientConfig | null) {
    this.cognitoClientConfig = clientConfig ?? null;
  }

  /**
   * Lazily initialize the Cognito client.
   *
   * Runtime behavior:
   * - In AWS Lambda: use the Lambda execution role automatically.
   * - Outside Lambda: attempt to resolve temporary AWS credentials from Amplify Auth.
   */
  public async initialize(): Promise<void> {
    if (this.client) return;

    if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
      this.client = this.cognitoClientConfig
        ? new CognitoIdentityProviderClient(this.cognitoClientConfig)
        : new CognitoIdentityProviderClient();

      return;
    }

    try {
      const session = await fetchAuthSession();
      const credentials = session.credentials;

      if (!credentials) {
        throw new Error("No valid AWS credentials found in the user session.");
      }

      const resolvedCredentials = {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      };

      this.client = this.cognitoClientConfig
        ? new CognitoIdentityProviderClient({
            ...this.cognitoClientConfig,
            credentials: resolvedCredentials,
          })
        : new CognitoIdentityProviderClient({
            credentials: resolvedCredentials,
          });
    } catch (error) {
      console.warn("Unable to retrieve user session credentials:", error);
      throw new Error(
        "Could not load credentials: Ensure the user is authenticated.",
      );
    }
  }

  /**
   * Returns an initialized Cognito client instance.
   */
  private async getClient(): Promise<CognitoIdentityProviderClient> {
    await this.initialize();

    if (!this.client) {
      throw new Error("Cognito client initialization failed.");
    }

    return this.client;
  }

  /** Returns the initialized SDK client for provider services in this package. */
  async getIdentityProviderClient(): Promise<CognitoIdentityProviderClient> {
    return this.getClient();
  }

  /**
   * Retrieve a Cognito user by username.
   *
   * Example:
   *
   * const result = await cognito.getUser({
   *  UserPoolId: 'eu-central-1_xxxxx',
   *  Username: 'john.doe',
   * });
   *
   * if (!result.ok) {
   *  console.error(result.statusCode, result.body.error, result.body.errorMeta);
   *  return;
   * }
   *
   * console.log(result.body.Username);
   * console.log(result.body.UserStatus);
   * console.log(result.body.Enabled);
   * console.log(result.body.UserAttributes);
   *
   * @param input
   * @returns
   */
  async getUser(
    input: AdminGetUserCommandInput,
  ): Promise<CiCognitoGetUserResult> {
    try {
      const client = await this.getClient();
      const response = await awsSdkGetCognitoUser(input, client);

      return ciOk200(response);
    } catch (error) {
      return ciMapCognitoError(error);
    }
  }

  /**
   * Create a new Cognito user.
   *
   * Example:
   *
   * const result = await cognito.createUser({
   *    UserPoolId: 'eu-central-1_xxxxx',
   *    Username: 'john.doe',
   *    UserAttributes: [
   *      { Name: 'email', Value: 'john@example.com' },
   *      { Name: 'email_verified', Value: 'true' },
   *    ],
   * });
   *
   * if (!result.ok) {
   *   console.error(result.body.error);
   *  return;
   * }
   *
   * console.log(result.body.User?.Username);
   *
   * @param input
   * @returns
   */
  async createUser(
    input: AdminCreateUserCommandInput,
  ): Promise<CiCognitoCreateUserResult> {
    try {
      const client = await this.getClient();
      const response = await awsSdkCreateCognitoUser(input, client);

      return ciOk200(response);
    } catch (error) {
      return ciMapCognitoError(error);
    }
  }

  /**
   * Update one or more Cognito user attributes.
   *
   *  Example:
   *
   *  const result = await cognito.updateUser({
   *    UserPoolId: 'eu-central-1_xxxxx',
   *    Username: 'john.doe',
   *    UserAttributes: [
   *      { Name: 'given_name', Value: 'John' },
   *      { Name: 'family_name', Value: 'Doe' },
   *      { Name: 'custom:department', Value: 'Technology' },
   *    ],
   *  });
   *
   *  if (!result.ok) {
   *    console.error(result.body);
   *  }
   *
   * @param input
   * @returns
   */
  async updateUser(
    input: AdminUpdateUserAttributesCommandInput,
  ): Promise<CiCognitoUpdateUserResult> {
    try {
      const client = await this.getClient();
      const response = await awsSdkUpdateCognitoUser(input, client);

      return ciOk200(response);
    } catch (error) {
      return ciMapCognitoError(error);
    }
  }

  /**
   * Delete a Cognito user.
   *
   * Example:
   *
   * const result = await cognito.deleteUser({
   *  UserPoolId: 'eu-central-1_xxxxx',
   *  Username: 'john.doe',
   * });
   *
   * if (!result.ok) {
   *  console.error(result.body.error);
   * }
   *
   * @param input
   * @returns
   */
  async deleteUser(
    input: AdminDeleteUserCommandInput,
  ): Promise<CiCognitoDeleteUserResult> {
    try {
      const client = await this.getClient();
      const response = await awsSdkDeleteCognitoUser(input, client);

      return ciOk200(response);
    } catch (error) {
      return ciMapCognitoError(error);
    }
  }

  /**
   * List users in a Cognito user pool.
   *
   * Example:
   *
   * const result = await cognito.listUsers({
   *  UserPoolId: 'eu-central-1_xxxxx',
   *  Limit: 20,
   * });
   *
   * if (result.ok) {
   *   console.log(result.body.Users);
   * }
   *
   * @param input
   * @returns
   */
  async listUsers(
    input: ListUsersCommandInput,
  ): Promise<CiCognitoListUsersResult> {
    try {
      const client = await this.getClient();
      const response = await awsSdkListCognitoUsers(input, client);

      return ciOk200(response);
    } catch (error) {
      return ciMapCognitoError(error);
    }
  }

  /**
   * Set a Cognito user's temporary or permanent password.
   */
  async setUserPassword(
    input: AdminSetUserPasswordCommandInput,
  ): Promise<CiCognitoSetUserPasswordResult> {
    try {
      const client = await this.getClient();
      const response = await awsSdkSetCognitoUserPassword(input, client);

      return ciOk200(response);
    } catch (error) {
      return ciMapCognitoError(error);
    }
  }

  /**
   * Generate a password using the shared CloudIgniter password utility.
   */
  generatePassword(length?: number): string {
    return generateCognitoUserPassword(length);
  }
}
