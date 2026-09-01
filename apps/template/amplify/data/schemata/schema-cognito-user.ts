import { a } from "@aws-amplify/backend";

import { CI_CORE_AMPLIFY_FUNCTION_RESOURCES } from "../../backend/ci-core-amplify-manifest";

const {
  createCognitoUserHandler,
  deleteCognitoUserHandler,
  getCognitoUserHandler,
  listCognitoUsersHandler,
  setCognitoUserEnabledHandler,
  setCognitoUserPasswordHandler,
  updateCognitoUserHandler,
} = CI_CORE_AMPLIFY_FUNCTION_RESOURCES;

/** Cognito groups allowed to cross the AppSync user-administration boundary. */
export const CI_COGNITO_USER_ADMIN_GROUPS = [
  "admin",
  "super-admin",
  "system-admin",
  "system-super-admin",
] as const;

const userAdminGroups = [...CI_COGNITO_USER_ADMIN_GROUPS];

const schemaCognitoUser = {
  DeleteCognitoUser: a
    .mutation()
    .arguments({ inputString: a.string().required() })
    .handler(a.handler.function(deleteCognitoUserHandler))
    .returns(a.json())
    .authorization((allow) => [allow.groups(userAdminGroups)]),

  GetCognitoUser: a
    .query()
    .arguments({
      inputString: a.string().required(), // JSON String
    })
    .handler(a.handler.function(getCognitoUserHandler))
    .returns(a.json())
    .authorization((allow) => [allow.groups(userAdminGroups)]),

  ListCognitoUsers: a
    .query()
    .arguments({ inputString: a.string().required() })
    .handler(a.handler.function(listCognitoUsersHandler))
    .returns(a.json())
    .authorization((allow) => [allow.groups(userAdminGroups)]),

  CreateCognitoUser: a
    .mutation()
    .arguments({
      inputString: a.string().required(), // JSON String
    })
    .handler(a.handler.function(createCognitoUserHandler))
    .returns(a.json())
    .authorization((allow) => [allow.groups(userAdminGroups)]),

  SetCognitoUserPassword: a
    .mutation()
    .arguments({
      inputString: a.string().required(), // JSON String
    })
    .handler(a.handler.function(setCognitoUserPasswordHandler))
    .returns(a.json())
    .authorization((allow) => [allow.groups(userAdminGroups)]),

  SetCognitoUserEnabled: a
    .mutation()
    .arguments({ inputString: a.string().required() })
    .handler(a.handler.function(setCognitoUserEnabledHandler))
    .returns(a.json())
    .authorization((allow) => [allow.groups(userAdminGroups)]),

  UpdateCognitoUser: a
    .mutation()
    .arguments({ inputString: a.string().required() })
    .handler(a.handler.function(updateCognitoUserHandler))
    .returns(a.json())
    .authorization((allow) => [allow.groups(userAdminGroups)]),
};

export default schemaCognitoUser;
