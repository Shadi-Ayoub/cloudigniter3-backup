// https://docs.amplify.aws/nextjs/build-a-backend/auth/grant-access-to-auth-resources/
// https://docs.amplify.aws/nextjs/build-a-backend/auth/concepts/user-attributes/

import { type AmplifyAuthProps } from '@aws-amplify/backend-auth';

const customBackendAuth: AmplifyAuthProps = {
  loginWith: {
    email: {
      verificationEmailSubject:
        'Welcome to Cloudigniter app! Please verify your email address!',
      verificationEmailBody: (code) =>
        `Here is your verification code: ${code()}`,
      verificationEmailStyle: 'CODE',
    },
  }, // mandatory property.
  userAttributes: {
    givenName: {
      mutable: true,
      required: true,
    },
    middleName: {
      mutable: true,
      required: false,
    },
    familyName: {
      mutable: true,
      required: true,
    },
  },
};

export { customBackendAuth };
