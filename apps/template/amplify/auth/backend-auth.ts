// https://docs.amplify.aws/nextjs/build-a-backend/auth/grant-access-to-auth-resources/

import { type AmplifyAuthProps } from "@aws-amplify/backend-auth";
import { CI_COGNITO_ROOT_USER_GROUP } from "@cloudigniter/aws/lib";
import { CI_CORE_ROLES_BY_PRECEDENCE } from "@cloudigniter/core/lib";

import { customBackendAuth } from "../custom/backend";

// import { createUserHandler } from '../functions/user/create-user/resource';
// import { createUser, getUser } from '../functions/user';
// import { getUser } from '../functions/user';
// import { postConfirmation } from './post-confirmation/resource';

const customGroups = customBackendAuth.groups ?? [];
const applicationGroups = customGroups.filter(
  (group) => group !== CI_COGNITO_ROOT_USER_GROUP,
);

// const coreBackendAuth = { ...customBackendAuth };
const backendAuth: AmplifyAuthProps = {
  name: customBackendAuth.name,
  loginWith: customBackendAuth.loginWith ?? {
    email: true,
  },
  triggers: {
    // postConfirmation,
    ...customBackendAuth.triggers,
  },
  // The Root marker is last because it identifies an account; it is not an application role.
  groups: [
    ...CI_CORE_ROLES_BY_PRECEDENCE,
    ...applicationGroups,
    CI_COGNITO_ROOT_USER_GROUP,
  ], // Cognito assigns lower (higher-priority) precedence to earlier groups.
  senders: customBackendAuth.senders,
  userAttributes: { ...customBackendAuth.userAttributes },
  multifactor: customBackendAuth.multifactor,
  accountRecovery: customBackendAuth.accountRecovery,
  access: customBackendAuth.access,
};

export { backendAuth };
