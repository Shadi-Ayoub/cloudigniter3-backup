import { a } from '@aws-amplify/backend';

import { createUserHandler } from '../../functions/user/create-user/resource';
// import { getUser } from '../../functions/user/get-user/resource';

const schemaUser = {
  // GetUser: a
  //   .query()
  //   .arguments({
  //     inputString: a.string().required(), // JSON String
  //   })
  //   .handler(a.handler.function(getUser))
  //   .returns(a.json())
  //   .authorization((allow) => [allow.group('ADMINS')]),

  // UserProfile: a
  //   .model({
  //     userId: a.string().required(),
  //     profile: a.string().required(),
  //   })
  //   .identifier(['userId'])
  //   .authorization((allow) => [allow.group('ADMINS')]),

  UserProfile: a
    .model({
      userId: a.id().required(),
      username: a.string().required(),
      // displayUsername: a.string(),
      // We don't want people to change their email directly in the db. Better if we allow them to change it via Cognito, and then update it in the db using a Lambda function.
      // Also, we don't want other people to see other people's email addresses. Note the use of ownerDefinedIn("profileOwner") in the email field.
      email: a
        .string()
        .authorization((allow) => [
          allow.group('SYSTEM_ADMIN'),
          allow.ownerDefinedIn('profileOwner').to(['read']),
        ]),
      // dob: a.date(),
      profilePicture: a.string(),
      city: a.string(),
      country: a.string(),
      address: a.string(),
      landline: a.phone(),
      mobile: a.phone(),
      // We don't want people to change ownership of their profile
      profileOwner: a
        .string()
        .authorization((allow) => [
          allow.ownerDefinedIn('profileOwner').to(['read']),
          allow.group('SYSTEM_ADMIN'),
          allow.guest().to(['read']),
          allow.authenticated().to(['read']),
        ]),
    })
    .identifier(['userId']) // Not the default auto-generated id
    .secondaryIndexes((index) => [index('username'), index('email')])
    .authorization((allow) => [
      allow.ownerDefinedIn('profileOwner').to(['read', 'update']),
      allow.group('SYSTEM_ADMIN'),
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
    ]),

  createUser: a
    .mutation()
    .arguments({
      inputString: a.string().required(), // JSON String
    })
    .handler(a.handler.function(createUserHandler))
    .returns(a.json())
    .authorization((allow) => [
      allow.group('ADMIN'),
      allow.group('SYSTEM_ADMIN'),
    ]),
};

export default schemaUser;
