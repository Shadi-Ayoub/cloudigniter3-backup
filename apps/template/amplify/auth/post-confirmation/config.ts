import { Amplify } from 'aws-amplify';
// import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';

import { env } from '$amplify/env/post-confirmation-handler';

Amplify.configure(
  {
    API: {
      GraphQL: {
        endpoint: env.AMPLIFY_DATA_GRAPHQL_ENDPOINT,
        region: env.AWS_REGION,
        defaultAuthMode: 'iam',
      },
    },
  },
  {
    Auth: {
      credentialsProvider: {
        getCredentialsAndIdentityId: async () => ({
          credentials: {
            accessKeyId: env.AWS_ACCESS_KEY_ID,
            secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            sessionToken: env.AWS_SESSION_TOKEN,
          },
        }),
        clearCredentialsAndIdentityId: () => {
          /* noop */
        },
      },
    },
  }
);

// const { resourceConfig, libraryOptions } =
//   await getAmplifyDataClientConfig(env);

// Amplify.configure(resourceConfig, libraryOptions);
