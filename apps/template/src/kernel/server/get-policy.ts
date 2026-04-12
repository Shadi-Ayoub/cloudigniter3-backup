/**
 * By turning the root-level fetch logic into cached functions, and then calling those
 * same functions everywhere, Next.js will only run it once per request. Hence, improved
 * performance!
 *
 * getPolicy need to be called from a component or an asction server function. This way,
 * the federated jwt will be sent with the request.
 */
// import { cache } from 'react';
// import type { ClientUsingSSRCookies } from '@aws-amplify/adapter-nextjs/api';

// import { getPolicy as _getPolicy } from '@cloudigniter/next/server';
// import type { Policy, GetPolicy } from '@cloudigniter/next/types';

// import type { Schema } from '@/../amplify/data/resource';

// export const getPolicy = cache(
//   async (client: ClientUsingSSRCookies<Schema>) => {
//     // force the literal into the exact GetSettings type so TS won't compare deep generics:

//     const policy = await _getPolicy<Schema>(client);

//     return policy;
//   }
// );
