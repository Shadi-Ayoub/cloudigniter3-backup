// import { cache } from 'react';
// import { headers } from 'next/headers';

// import { resolveRoute } from '@cloudigniter/next/routing';
// import type {
//   CiAmplifyOutputs,
//   Context,
// } from '@cloudigniter/next/types';

// import { getCurrentUser } from '@cloudigniter/next/server';
// import { getRoutes } from '@/kernel/server';
// import { getSettings } from '@/kernel/api/server';
// import { getServerStatus } from '@/kernel/server';
// import { getSystemConfig } from '@/kernel/get-system-config';

// import outputs from '@/../amplify_outputs.json';

// const amplifyOutputs = outputs as CiAmplifyOutputs;

// export const getContext = cache(async () => {
//   try {
//     const hdr = await headers();
//     const config = await getSystemConfig();
//     const user = await getCurrentUser(amplifyOutputs);
//     const routes = getRoutes();

//     const urlRoute = hdr.get('x-request-path') ?? '/';

//     const route = resolveRoute(urlRoute, routes);

//     const context = {
//       amplifyOutputs: config.amplifyOutputs,
//       locale: config.locale,
//       direction: config.direction,
//       settings: {},
//       status: {},
//       route,
//     } as Context;

//     if (user) {
//       const settings = await getSettings();
//       const status = await getServerStatus(settings, amplifyOutputs);

//       context.settings = settings;
//       context.status = status;
//     }

//     return context;
//   } catch (error) {
//     throw error;
//   }
// });
