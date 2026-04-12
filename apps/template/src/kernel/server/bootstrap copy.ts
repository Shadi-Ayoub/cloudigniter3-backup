// import { cache } from 'react';

// import { bootstrap as _bootstrap } from '@cloudigniter/next/server';
// import { getCurrentUser } from '@cloudigniter/next/server';
// import { guard } from '@cloudigniter/next/shield/server';
// import { getErrorMessage } from '@cloudigniter/next/utility';
// import type {
//   ServerErrorPayload,
//   Setup,
//   CiAmplifyOutputs,
// } from '@cloudigniter/next/types';

// import { getSettings } from '@/kernel/api/server';
// import { getServerStatus } from './get-server-status';
// import { getSystemConfig } from '@/kernel/get-system-config';

// import outputs from '@/../amplify_outputs.json';

// const amplifyOutputs = outputs as CiAmplifyOutputs;

// // called by the root layout or each page route layout
// export const bootstrap = cache(async (mode: 'root' | 'page') => {
//   try {
//     // App/system config (includes i18n, theme, cloudigniter.config spreads, etc.)
//     const config = await getSystemConfig();
//     const user = await getCurrentUser(amplifyOutputs);

//     // redirect to login if no user and path is protected
//     await guard(user, config);

//     // throw new Error(JSON.stringify(user));

//     if (mode == 'page') {
//       let setup: Setup;
//       // Only call Amplify-backed APIs when user exists (has federated JWT)
//       if (user) {
//         const settings = await getSettings();
//         const status = await getServerStatus(settings, amplifyOutputs);
//         setup = await _bootstrap(mode, config, settings, status);
//       } else {
//         setup = await _bootstrap(mode, config);
//       }

//       return setup;
//     }

//     if (mode == 'root') {
//       const setup = {
//         rootConfig: config,
//       } as Setup;

//       return setup;
//     }

//     throw new Error(
//       JSON.stringify({
//         title: 'Bootstrapping CloudIgniter failed!',
//         message: "Invalid parameter! mode should be 'page' | 'root'",
//         severity: 'critical',
//         showRetry: true,
//       } satisfies ServerErrorPayload)
//     );
//   } catch (error) {
//     const errorMessage = getErrorMessage(error);
//     if (errorMessage === 'NEXT_REDIRECT') {
//       // rethrow error! in case of redirect action!
//       throw error;
//     }

//     throw new Error(
//       JSON.stringify({
//         title: 'Bootstrapping CloudIgniter failed!',
//         message: getErrorMessage(error),
//         severity: 'critical',
//         showRetry: true,
//       } satisfies ServerErrorPayload)
//     );
//   }
// });
