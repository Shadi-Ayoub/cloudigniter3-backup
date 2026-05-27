import type { UserType as AwsCognitoUserType } from '@aws-sdk/client-cognito-identity-provider';

import type { CiUserRole, CiUserProfile, CiCognitoAttributes, CiCognitoAttributesMap } from './';

export type CiUser = AwsCognitoUserType & {
  roles: CiUserRole[];
  isActive: boolean;
  /** App profile (stored as JSON in DynamoDB) */
  profile: CiUserProfile;
  /** Cognito attributes flattened for quick access */
  attributes: CiCognitoAttributesMap;
  /** Typed projection of app-declared attributes (custom:* etc.) */
  customAttributes: Partial<CiCognitoAttributes>;
};
