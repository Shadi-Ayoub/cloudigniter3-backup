// import { cache } from 'react';
// import { cookies } from 'next/headers';
// import { runWithAmplifyServerContext } from '@cloudigniter/next/server';
// import { fetchAuthSession } from 'aws-amplify/auth/server';

// import type {
//   ApiAuthMode,
//   GetSettingsHandlerInput,
//   CiGraphQLResponse,
//   CiRequest,
//   ServerErrorPayload,
//   Settings,
// } from '@cloudigniter/next/types';
// import { getErrorMessage } from '@cloudigniter/next/utility';
// import { unwrapSettings } from '@cloudigniter/next/server';
// // import { fetchAuthSession } from 'aws-amplify/auth';

// import { client } from '@/kernel/api/server';
// import { extendedSettingsDefaultValues } from '@/custom/settings';
// import ciConfig from '@/../cloudigniter.config';

// // import outputs from '@/../amplify_outputs.json'; // Gen 2 file

// /**
//  * Fetches application settings from the backend API for a server component.
//  *
//  * This function is cached using React's `cache` function to prevent multiple
//  * network requests for the same data within the same component hierarchy.
//  * It dynamically handles both authenticated and unauthenticated (guest) users
//  * by attempting to fetch a user session first and falling back to guest credentials
//  * via apiKey authentication if no session is found.
//  *
//  * This function is wrapped in `runWithAmplifyServerContext` to securely access
//  * the user's session from cookies on the server. It determines if a user is
//  * authenticated and sets the appropriate `authMode` for the API call.
//  * The result is cached per-request using React's `cache`.
//  *
//  * @async
//  * @returns {Promise<Settings>} A promise that resolves with the application settings.
//  * @throws {Error} Throws an error with a JSON payload of type `ServerErrorPayload`
//  *   if the API call fails or the settings cannot be unwrapped.
//  */
// export const getSettings = cache(async () => {
//   try {
//     // This function securely handles server-side Amplify operations
//     const settings = await runWithAmplifyServerContext({
//       nextServerContext: { cookies }, // <-- Provides request cookies to Amplify
//       operation: async (contextSpec) => {
//         let authMode: ApiAuthMode = 'apiKey';

//         try {
//           // This server-side fetchAuthSession uses the cookies from the context
//           const session = await fetchAuthSession(contextSpec);
//           const hasUser = !!session.tokens?.idToken;
//           authMode = hasUser ? 'userPool' : 'apiKey';
//         } catch (error) {
//           // No valid session found in cookies, proceed as a guest.
//           // This is expected for unauthenticated users, so we don't need to throw.
//           console.log('No active session found, fetching settings as guest.');
//           authMode = 'apiKey';
//         }

//         const input: CiRequest<GetSettingsHandlerInput> = {
//           input: { extendedSettingsDefaultValues },
//           options: {
//             DynamoDbClientConfig: ciConfig.dynamodb.clientConfig,
//           },
//           scope: '',
//           action: '',
//         };

//         const inputString = JSON.stringify(input);

//         // Make the API call with the determined authMode
//         const apiResponse: CiGraphQLResponse = await client.queries.getSettings(
//           { inputString },
//           { authMode }
//         );

//         return unwrapSettings(apiResponse) as Settings;
//       },
//     });

//     return settings;
//   } catch (error: unknown) {
//     throw new Error(
//       JSON.stringify({
//         title: 'Settings fetch failed',
//         message: `Failed to get the settings! ${getErrorMessage(error)}`,
//         severity: 'critical',
//         showRetry: true,
//       } as ServerErrorPayload)
//     );
//   }
// });
