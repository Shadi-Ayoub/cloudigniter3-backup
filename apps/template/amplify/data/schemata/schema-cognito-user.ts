import { a } from "@aws-amplify/backend";

import { CI_CORE_AMPLIFY_FUNCTION_RESOURCES } from "../../backend/ci-core-amplify-manifest";

const {
  createCognitoUserHandler,
  getCognitoUserHandler,
  setCognitoUserPasswordHandler,
} = CI_CORE_AMPLIFY_FUNCTION_RESOURCES;

const schemaCognitoUser = {
  GetCognitoUser: a
    .query()
    .arguments({
      inputString: a.string().required(), // JSON String
    })
    .handler(a.handler.function(getCognitoUserHandler))
    .returns(a.json())
    .authorization((allow) => [allow.group("SYSTEM_ADMIN")]),

  CreateCognitoUser: a
    .mutation()
    .arguments({
      inputString: a.string().required(), // JSON String
    })
    .handler(a.handler.function(createCognitoUserHandler))
    .returns(a.json())
    .authorization((allow) => [allow.group("SYSTEM_ADMIN")]),

  SetCognitoUserPassword: a
    .mutation()
    .arguments({
      inputString: a.string().required(), // JSON String
    })
    .handler(a.handler.function(setCognitoUserPasswordHandler))
    .returns(a.json())
    .authorization((allow) => [allow.group("SYSTEM_ADMIN")]),
};

export default schemaCognitoUser;
