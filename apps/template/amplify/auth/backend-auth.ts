// https://docs.amplify.aws/nextjs/build-a-backend/auth/grant-access-to-auth-resources/

import {
  type AuthAccessDefinition,
  type AuthAccessBuilder,
  type AmplifyAuthProps,
} from "@aws-amplify/backend-auth";
import { CI_CORE_ROLES_BY_PRECEDENCE } from "@cloudigniter/core/lib";

import { customBackendAuth } from "../custom/backend";

import { CI_CORE_AMPLIFY_FUNCTION_RESOURCES } from "../backend/ci-core-amplify-manifest";

const {
  createCognitoUserHandler,
  getCognitoUserHandler,
  setCognitoUserPasswordHandler,
} = CI_CORE_AMPLIFY_FUNCTION_RESOURCES;

// import { createUserHandler } from '../functions/user/create-user/resource';
// import { createUser, getUser } from '../functions/user';
// import { getUser } from '../functions/user';
// import { postConfirmation } from './post-confirmation/resource';

const customGroups = customBackendAuth.groups ?? [];

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
  groups: [...CI_CORE_ROLES_BY_PRECEDENCE, ...customGroups], // Cognito assigns lower (higher-priority) precedence to earlier groups.
  senders: customBackendAuth.senders,
  userAttributes: { ...customBackendAuth.userAttributes },
  multifactor: customBackendAuth.multifactor,
  accountRecovery: customBackendAuth.accountRecovery,
  access: customBackendAuth.access,
};

// const coreBackendAuthAccess = customBackendAuthAccess;
const backendAuthAccess = (allow: AuthAccessBuilder) => {
  const accessArray: AuthAccessDefinition[] = [
    // allow.resource(listCognitoUsers).to(['listUsers']),
    allow.resource(getCognitoUserHandler).to(["getUser"]),
    allow.resource(createCognitoUserHandler).to(["createUser"]),
    allow.resource(createCognitoUserHandler).to(["getUser"]),
    allow.resource(setCognitoUserPasswordHandler).to(["setUserPassword"]),
    // allow.resource(deleteCognitoUser).to(['disableUser']),
    // allow.resource(deleteCognitoUser).to(['deleteUser']),

    // allow.resource(getUser).to(['getUser']),
    // allow.resource(createUserHandler).to(['createUser']),
    // allow.resource(createUser).to(['getUser']),
  ];

  return accessArray;
};

export { backendAuth, backendAuthAccess };
