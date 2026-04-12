// import { type Context } from 'aws-lambda';
// import type { UserType } from '@aws-sdk/client-cognito-identity-provider';

// import { getErrorMessage } from '@CI/utility';
// import { err, ok } from '@CI/utility/server';
// import type {
//   CreateUserHandlerInterface,
//   CloudIgniterUser,
//   CreateCognitoUserInterface,
//   CiLambdaEvent,
//   Profile,
//   CiResponse,
// } from '@CI/types';

// import { createCognitoUser, createUserProfile } from '@CI/server';

// export const createUserHandler = async (event: CiLambdaEvent, context: Context): Promise<CiResponse> => {
//   const tableName = process.env.CI_USER_PROFILE_TABLE_NAME!;
//   const region = process.env.CI_REGION;

//   if (typeof tableName === undefined) {
//     return await err(
//       400,
//       { error: `CREATE_USER_HANDLER: No CI_USER_PROFILE_TABLE_NAME environment variable is defined.` },
//       {
//         message: `No CI_USER_PROFILE_TABLE_NAME environment variable is defined`,
//         parameter: event.arguments.inputString,
//         response: '',
//         event,
//         context,
//         env: [],
//       }
//     );
//   }

//   if (typeof region === undefined) {
//     return await err(
//       400,
//       { error: `SET_SETTINGS_HANDLER: No CI_REGION environment variable is defined.` },
//       {
//         message: `No CI_REGION environment variable is defined`,
//         parameter: event.arguments.inputString,
//         response: '',
//         event,
//         context,
//         env: [],
//       }
//     );
//   }

//   const inputString = event.arguments.inputString;

//   if (!inputString || typeof inputString !== 'string') {
//     return await err(
//       400,
//       { error: `CREATE_USER_HANDLER: inputString is required and must be a string. (${inputString})` },
//       {
//         message: `inputString is required and must be a string. (${inputString})`,
//         parameter: event.arguments.inputString,
//         response: '',
//         event,
//         context,
//         env: [],
//       }
//     );
//   }

//   const input = JSON.parse(inputString) as CreateUserHandlerInterface;

//   try {
//     const cognitoCreateUserInput: CreateCognitoUserInterface = {
//       cognito: input.cognito,
//       setPassword: input.setPassword,
//       password: input.password,
//       permanent: input.permanent,
//       CognitoClientConfig: input.CognitoClientConfig,
//     };
//     const response1: CiResponse = await createCognitoUser(cognitoCreateUserInput);

//     if (response1.statusCode !== 200) {
//       return response1;
//     }

//     // Cognito account is created successfully.
//     // Insert the default profile JSON into the userProfile table

//     const cognitoUser = response1.body as UserType;
//     const response2: CiResponse<string> = await createUserProfile({
//       tableName,
//       userId: cognitoUser.Username as string,
//       profile: input.profile,
//       DynamoDbClientConfig: input.DynamoDbClientConfig ?? { region },
//     });

//     if (response2.statusCode !== 200) {
//       return response2;
//     }

//     const profile = JSON.parse(response2.body as string) as Profile;

//     let user = { ...cognitoUser, profile } as CloudIgniterUser;

//     let response = await ok(user);
//     response = { ...response, parameter: event.arguments.inputString, event, context, env: [] };

//     return response;
//   } catch (error: any) {
//     return await err(
//       400,
//       { error: `CREATE_USER_HANDLER: ${getErrorMessage(error)}` },
//       {
//         message: `Failed to create the user account for ${input.cognito.Username}!`,
//         parameter: event.arguments.inputString,
//         response: error,
//         event,
//         context,
//         env: [],
//       }
//     );
//   }
// };
