import { CognitoIdentityProviderServiceException } from '@aws-sdk/client-cognito-identity-provider';

/**
 * Type guard for AWS Cognito SDK service exceptions.
 */
export function ciIsCognitoServiceException(error: unknown): error is CognitoIdentityProviderServiceException {
  return error instanceof CognitoIdentityProviderServiceException;
}

/**
 * Returns true when the thrown error means the target user does not exist.
 */
export function ciIsCognitoUserNotFoundError(error: unknown): boolean {
  return ciIsCognitoServiceException(error) && error.name === 'UserNotFoundException';
}

/**
 * Returns true when the thrown error means the target user already exists.
 */
export function ciIsCognitoUsernameExistsError(error: unknown): boolean {
  return ciIsCognitoServiceException(error) && error.name === 'UsernameExistsException';
}
