// see: https://docs.amplify.aws/nextjs/build-a-backend/functions/examples/create-user-profile-record/

import { a } from "@aws-amplify/backend";

// import { createUserHandler } from '../../functions/user/create-user/resource';
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
      username: a
        .string()
        .required()
        .authorization((allow) => [
          allow.ownerDefinedIn("profileOwner").to(["read"]),
          allow.group("admin"),
          allow.group("system-admin"),
          allow.group("system-super-admin"),
        ]),
      email: a
        .string()
        .authorization((allow) => [
          allow.ownerDefinedIn("profileOwner").to(["read"]),
          allow.group("admin"),
          allow.group("system-admin"),
          allow.group("system-super-admin"),
        ]),
      emailVerified: a
        .boolean()
        .authorization((allow) => [
          allow.ownerDefinedIn("profileOwner").to(["read"]),
          allow.group("admin"),
          allow.group("system-admin"),
          allow.group("system-super-admin"),
        ]),
      displayName: a.string(),
      title: a.string(),
      givenName: a.string(),
      middleName: a.string(),
      familyName: a.string(),
      avatarUrl: a.url(),
      avatarKey: a.string(),
      phoneNumber: a.phone(),
      locale: a.string(),
      timeZone: a.string(),
      bio: a.string(),
      birthDate: a.date(),
      gender: a.string(),
      address: a.json(),
      /** Single application-owned extension seam for additional profile data. */
      extensions: a.json(),
      status: a
        .string()
        .required()
        .authorization((allow) => [
          allow.ownerDefinedIn("profileOwner").to(["read"]),
          allow.group("admin"),
          allow.group("system-admin"),
          allow.group("system-super-admin"),
        ]),
      /** Trusted operational transition metadata, independent from deletion. */
      statusChange: a
        .json()
        .authorization((allow) => [
          allow.ownerDefinedIn("profileOwner").to(["read"]),
          allow.group("admin"),
          allow.group("system-admin"),
          allow.group("system-super-admin"),
        ]),
      roles: a
        .string()
        .array()
        .required()
        .authorization((allow) => [
          allow.ownerDefinedIn("profileOwner").to(["read"]),
          allow.group("admin"),
          allow.group("system-admin"),
          allow.group("system-super-admin"),
        ]),
      deletionState: a
        .string()
        .required()
        .authorization((allow) => [
          allow.ownerDefinedIn("profileOwner").to(["read"]),
          allow.group("admin"),
          allow.group("system-admin"),
          allow.group("system-super-admin"),
        ]),
      /** Reversible deletion metadata; operational status remains independent. */
      deletion: a
        .json()
        .authorization((allow) => [
          allow.ownerDefinedIn("profileOwner").to(["read"]),
          allow.group("admin"),
          allow.group("system-admin"),
          allow.group("system-super-admin"),
        ]),
      // We don't want people to change ownership of their profile
      profileOwner: a
        .string()
        .authorization((allow) => [
          allow.ownerDefinedIn("profileOwner").to(["read"]),
          allow.group("admin"),
          allow.group("system-admin"),
          allow.group("system-super-admin"),
        ]),
    })
    .identifier(["userId"]) // Not the default auto-generated id
    .secondaryIndexes((index) => [
      index("username"),
      index("email"),
      index("deletionState"),
    ])
    .authorization((allow) => [
      allow.ownerDefinedIn("profileOwner").to(["read", "update"]),
      allow.group("admin"),
      allow.group("system-admin"),
      allow.group("system-super-admin"),
    ]),

  // createUser: a
  //   .mutation()
  //   .arguments({
  //     inputString: a.string().required(), // JSON String
  //   })
  //   .handler(a.handler.function(createUserHandler))
  //   .returns(a.json())
  //   .authorization((allow) => [
  //     allow.group('admin'),
  //     allow.group('system-admin'),
  //   ]),
};

export default schemaUser;
