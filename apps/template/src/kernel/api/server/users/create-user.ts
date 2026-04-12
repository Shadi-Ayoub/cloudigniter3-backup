// import {
//   parseApiResponse,
//   type ApiResponse,
//   type UserType,
// } from '@cloudigniter/next';
// import { cookies } from 'next/headers';
// import {
//   generateServerClientUsingCookies,
//   type ClientUsingSSRCookies,
// } from '@aws-amplify/adapter-nextjs/api';

// import {
//   type AdminCreateUserCommandInput,
//   type CreateUserOptions,
// } from '@cloudigniter/next/types';
// import { getCognitoAttributeValue } from '@cloudigniter/next/utility';
// import type { CiAmplifyOutputs } from '@cloudigniter/next/types';

// import outputs from '@/../amplify_outputs.json';
// import type { Schema } from '@/../amplify/data/resource';
// import { type ProfileRecord } from '@/custom/amplify';

// const config = outputs as CiAmplifyOutputs;

// export async function createUser(
//   cognitoInput: AdminCreateUserCommandInput,
//   profileInput: ProfileRecord,
//   options: CreateUserOptions
// ) {
//   const inputJSONString = JSON.stringify({ input: cognitoInput, options });

//   const amplifyClient = generateServerClientUsingCookies<Schema>({
//     config,
//     cookies,
//   }) as ClientUsingSSRCookies<Schema>;

//   const response1: ApiResponse =
//     await amplifyClient.mutations.CreateCognitoUser({
//       inputString: inputJSONString,
//     });

//   const result1 = parseApiResponse(response1);

//   if (result1.statusCode !== 200) {
//     return result1;
//   }

//   const cognitoUser = result1.body as UserType;
//   const username = cognitoUser.Username as string;

//   let input = {
//     userId: username,
//     username,
//     profileOwner: username,
//     ...profileInput,
//   };

//   if (cognitoUser.Attributes) {
//     const email = getCognitoAttributeValue(
//       cognitoUser.Attributes,
//       'email'
//     ) as string;

//     if (email) {
//       input = { ...input, email };
//     }
//   }

//   const response2 = await amplifyClient.models.UserProfile.create(input);

//   return parseApiResponse(response2);
// }

// // import {
// //   parseApiResponse,
// //   type AdminCreateUserCommandInput,
// //   type ApiResponse,
// //   type CognitoIdentityProviderClientConfig,
// //   type CreateUserInterface,
// //   type CreateUserOptions,
// //   type DynamoDBClientConfig,
// //   type CiResponse,
// // } from '@cloudigniter/next';

// // import amplifyOutputs from '../../../../../amplify_outputs.json';

// // import { server } from '../server';

// // export async function createUser(
// //   cognitoInput: AdminCreateUserCommandInput,
// //   profileInput: Record<string, string>,
// //   options: CreateUserOptions
// // ): Promise<CiResponse> {
// //   const cognitoClientConfig: CognitoIdentityProviderClientConfig = {
// //     region: amplifyOutputs.auth.aws_region,
// //   };

// //   const dynamodbClientConfig: DynamoDBClientConfig = {
// //     region: amplifyOutputs.auth.aws_region,
// //   };

// //   cognitoInput.UserPoolId = amplifyOutputs.auth.user_pool_id;

// //   const input: CreateUserInterface = {
// //     cognitoInput,
// //     profileInput,
// //     cognitoClientConfig,
// //     dynamodbClientConfig,
// //     options,
// //   };

// //   const inputJSONString = JSON.stringify(input);

// //   const response: ApiResponse = await server.client.mutations.CreateUser({
// //     inputString: inputJSONString,
// //   });

// //   return parseApiResponse(response);

// //   // return parseApiResponse({ data: {} });
// // }
