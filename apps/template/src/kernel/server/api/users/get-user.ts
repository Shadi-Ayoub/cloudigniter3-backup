// // see https://react.dev/reference/rsc/use-server

// 'use server';

// import { cookies } from 'next/headers';
// import {
//   generateServerClientUsingCookies,
//   type ClientUsingSSRCookies,
// } from '@aws-amplify/adapter-nextjs/api';

// import type { CiAmplifyOutputs } from '@cloudigniter/next/types';

// import outputs from '@/../amplify_outputs.json';
// import type { Schema } from '@/../amplify/data/resource';

// import {
//   parseApiResponse,
//   type ApiResponse,
//   type GetUserInterface,
//   type CiResponse,
// } from '@cloudigniter/next';

// // import { server } from '../server';

// const config = outputs as CiAmplifyOutputs;

// /**
//  * Returns a Result object where the user infor is in the data property. If an error is returned,
//  * the data property will be null and the error code & error message properties are set.
//  *
//  * @param {Object} param0 - The input object containing userPoolId and username.
//  * @param {string} param0.userPoolId - The ID of the user pool to which the user belongs.
//  * @param {string} param0.username - The username of the user to retrieve.
//  * @returns {Promise<any>} - A promise that resolves to the Result object having the user data object in the body property or error if the user does not exist.
//  */
// export async function getUser({
//   userPoolId,
//   username,
// }: GetUserInterface): Promise<CiResponse> {
//   const input = {
//     input: {
//       UserPoolId: userPoolId,
//       Username: username,
//     },
//   };

//   const inputJSONString = JSON.stringify(input);

//   const amplifyClient = generateServerClientUsingCookies<Schema>({
//     config,
//     cookies,
//   }) as ClientUsingSSRCookies<Schema>;

//   const response: ApiResponse = await amplifyClient.queries.GetCognitoUser({
//     inputString: inputJSONString,
//   });

//   return parseApiResponse(response);

//   // return parseApiResponse({ data: {} });
// }
