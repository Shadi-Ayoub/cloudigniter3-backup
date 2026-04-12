// import { type Context } from 'aws-lambda';

// import { getUser as getUserMethod } from '../../methods';
// import { response } from '../common';
// import { type CiLambdaEvent } from '../../../types';

// const getUser = async (event: CiLambdaEvent, context: Context) => {
//   try {
//     const inputString = event.arguments.inputString;

//     if (!inputString || typeof inputString !== 'string') {
//       const res = await response({
//         statusCode: 400,
//         body: {
//           error: `GET_USER_HANDLER: inputString is required and must be a string. (${inputString})`,
//         },
//         message: `inputString is required and must be a string. (${inputString})`,
//         parameter: event.arguments.inputString,
//         response: '',
//         event,
//         context,
//         env: [],
//       });

//       return res;
//     }

//     const { input, cognitoClientConfig } = JSON.parse(inputString);

//     const result = await getUserMethod({ input, cognitoClientConfig });

//     if (result?.statusCode != 200) {
//       const res = await response({
//         statusCode: 400,
//         body: {
//           error: `GET_USER_HANDLER: The user ${input.Username} account does not exist!`,
//         },
//         message: `The user ${input.Username} account does not exist!`,
//         parameter: event.arguments.inputString,
//         response: result.response,
//         event,
//         context,
//         env: [],
//       });

//       return res;
//     } else {
//       const res = await response({
//         statusCode: 200,
//         body: result.body,
//         message: result.message,
//         parameter: event.arguments.inputString,
//         response: result.response,
//         event,
//         context,
//         env: [],
//       });

//       return res;
//     }
//   } catch (error: any) {
//     const res = await response({
//       statusCode: 400,
//       body: {
//         error: `GET_USER_HANDLER: Failed to get the user Cognito account info!`,
//       },
//       message: 'Failed to get the user Cognito account info!',
//       parameter: event.arguments.inputString,
//       response: error.message,
//       event,
//       context,
//       env: [],
//     });

//     return res;
//   }
// };

// export { getUser };
