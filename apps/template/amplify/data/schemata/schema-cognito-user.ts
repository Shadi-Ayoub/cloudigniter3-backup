import { a } from '@aws-amplify/backend';

import { createCognitoUserHandler } from '../../auth/cognito-user/cognito-create-user/resource';
import { getCognitoUserHandler } from '../../auth/cognito-user/cognito-get-user/resource';
import { setCognitoUserPasswordHandler } from '../../auth/cognito-user/cognito-set-user-password/resource';

const schemaCognitoUser = {
  GetCognitoUser: a
    .query()
    .arguments({
      inputString: a.string().required(), // JSON String
    })
    .handler(a.handler.function(getCognitoUserHandler))
    .returns(a.json())
    .authorization((allow) => [allow.group('SYSTEM_ADMIN')]),

  CreateCognitoUser: a
    .mutation()
    .arguments({
      inputString: a.string().required(), // JSON String
    })
    .handler(a.handler.function(createCognitoUserHandler))
    .returns(a.json())
    .authorization((allow) => [allow.group('SYSTEM_ADMIN')]),

  SetCognitoUserPassword: a
    .mutation()
    .arguments({
      inputString: a.string().required(), // JSON String
    })
    .handler(a.handler.function(setCognitoUserPasswordHandler))
    .returns(a.json())
    .authorization((allow) => [allow.group('SYSTEM_ADMIN')]),
};

export default schemaCognitoUser;
