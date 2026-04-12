/**
 * To use the Amplify library on the client side in a Next.js app, you will need to set ssr to true
 * when calling Amplify.configure. This instructs the Amplify library to store tokens in the cookie
 * store of a browser. Cookies will be sent along with requests to your Next.js server for authentication.
 * see: https://docs.amplify.aws/nextjs/build-a-backend/server-side-rendering/#configure-amplify-library-for-client-side-usage
 *
 * To avoid repetitive calls to Amplify.configure, you can call it once in a top-level client-side rendered layout component.
 *
 * Make sure that the CloudIgniterAmplifyProvider is active! This is necessary to make sure that Amplify is configured for
 * the client!
 *
 * authMode is defined here rather in each request as a parameter. The authMethod here dectates using the authorizer lambda to
 * verify that the user is authorized to perform the corresponding action on the specified scope.
 *
 * References:
 * https://aws-amplify.github.io/amplify-js/api/functions/aws_amplify.api.generateClient.html
 *
 */

import { Amplify, type ResourcesConfig } from 'aws-amplify';
import {
  type AmplifyOutputs,
  type LegacyConfig,
} from 'aws-amplify/adapter-core';

import amplifyOutputs from '../../amplify_outputs.json';

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

// let configured = false;
// export function configureAmplify() {
//   if (!configured) {
//     Amplify.configure(amplifyOutputs, { ssr: true }); // IMPORTANT for Next/SSR
//     configured = true;
//   }
// }

Amplify.configure(
  amplifyOutputs as ResourcesConfig | LegacyConfig | AmplifyOutputs
);

// console.log(JSON.stringify(Amplify.getConfig()));

export const dataClient = generateClient<Schema>({ authMode: 'userPool' });
