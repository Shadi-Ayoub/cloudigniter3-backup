// import { type AppSyncResolverEvent } from 'aws-lambda';
// // import { cognito, ci } from '@cloudigniter/server';

// import { type CiResponse } from '../../../types';
// import { Cognito } from '../../cognito';

// const setUserPassword = async (
//   event: AppSyncResolverEvent<
//     {
//       inputString: string;
//     },
//     Record<string, any> | null
//   >
// ) => {
//   try {
//     const inputString = event.arguments.inputString;

//     // Validate input (for example, checking if a field is present)
//     if (!inputString || typeof inputString !== 'string') {
//       // throw new Error(
//       //   `inputString is required and must be a string. (${inputString})`
//       // );
//       const response: CiResponse = {
//         statusCode: 400,
//         body: {
//           error: `SET_USER_PASSWORD_HANDLER: inputString is required and must be a string. (${inputString})`,
//         },
//         message: `inputString is required and must be a string. (${inputString})`,
//         parameter: event.arguments.inputString,
//         response: '',
//       };

//       return response;
//     }

//     // Convert from JSON string into JavaScript Object
//     const input = JSON.parse(inputString);

//     const cognito = new Cognito();

//     const result = await cognito.setUserPassword(input);

//     const response: CiResponse = {
//       statusCode: 200,
//       body: result,
//       message: 'User password was set successfully.',
//       response: result,
//       parameter: JSON.stringify(input),
//     };

//     return response;
//   } catch (error: any) {
//     const response: CiResponse = {
//       statusCode: 400,
//       body: { error: `Failed to set the new password!` },
//       message: 'SET_USER_PASSWORD_HANDLER: Failed to set the new password!',
//       response: error,
//       parameter: event.arguments.inputString,
//     };

//     return response;
//   }
// };

// export { setUserPassword };
