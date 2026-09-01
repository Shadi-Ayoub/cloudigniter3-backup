import { CI_AUTH_FUNCS_IDS } from "../../core-types/functions";

import type { CiCoreAuth } from "../../core-types/auth";
import type { CiPolicyFragment } from "../../core-types/policy";

const CI_COGNITO_USER_IAM_ACTIONS_BY_HANDLER = {
  ciCreateCognitoUserHandler: [
    "cognito-idp:AdminAddUserToGroup",
    "cognito-idp:AdminCreateUser",
    "cognito-idp:AdminGetUser",
    "cognito-idp:AdminListGroupsForUser",
  ],
  ciDeleteCognitoUserHandler: [
    "cognito-idp:AdminDeleteUser",
    "cognito-idp:AdminGetUser",
    "cognito-idp:AdminListGroupsForUser",
  ],
  ciGetCognitoUserHandler: [
    "cognito-idp:AdminGetUser",
    "cognito-idp:AdminListGroupsForUser",
  ],
  ciListCognitoUsersHandler: [
    "cognito-idp:AdminListGroupsForUser",
    "cognito-idp:ListUsers",
  ],
  ciSetCognitoUserEnabledHandler: [
    "cognito-idp:AdminDisableUser",
    "cognito-idp:AdminEnableUser",
    "cognito-idp:AdminGetUser",
    "cognito-idp:AdminListGroupsForUser",
  ],
  ciSetCognitoUserPasswordHandler: [
    "cognito-idp:AdminGetUser",
    "cognito-idp:AdminListGroupsForUser",
    "cognito-idp:AdminSetUserPassword",
  ],
  ciUpdateCognitoUserHandler: [
    "cognito-idp:AdminAddUserToGroup",
    "cognito-idp:AdminGetUser",
    "cognito-idp:AdminListGroupsForUser",
    "cognito-idp:AdminRemoveUserFromGroup",
    "cognito-idp:AdminUpdateUserAttributes",
  ],
} as const satisfies Record<
  (typeof CI_AUTH_FUNCS_IDS)[number],
  readonly string[]
>;

/**
 * Build Lambda-owned Cognito policies so Data resolver functions depend on
 * Auth without creating a reverse Auth-to-Data nested-stack reference.
 */
export function ciMakeCognitoUserPolicies(
  auth: CiCoreAuth | undefined,
): CiPolicyFragment {
  if (!auth?.userPoolArn) return {};

  return {
    inlinePolicies: CI_AUTH_FUNCS_IDS.map((handlerId) => ({
      for: handlerId,
      id: "CognitoUserPoolAccess",
      statements: [
        {
          effect: "Allow",
          actions: [...CI_COGNITO_USER_IAM_ACTIONS_BY_HANDLER[handlerId]],
          resources: [auth.userPoolArn],
        },
      ],
    })),
  };
}
