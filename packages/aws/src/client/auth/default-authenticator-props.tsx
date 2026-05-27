// https://ui.docs.amplify.aws/react/connected-components/authenticator/customization#sign-up-fields

'use client';

// import * as React from 'react';
// import { View, Image, useTheme, type AuthenticatorProps } from '@aws-amplify/ui-react';
import type { AuthenticatorProps } from '@aws-amplify/ui-react';

/**
 * CloudIgniter default Authenticator props.
 *
 * Notes:
 * - Keep this as the "base layer" that works out-of-the-box.
 * - Consumers can override any subset via `buildAuthenticatorProps()`.
 * - `components` contains React components (functions), so downstream merging
 *   should treat it carefully.
 */
export function defaultCiAuthenticatorProps(): AuthenticatorProps {
  return {
    formFields: {
      signUp: {
        email: {
          label: 'Email',
          placeholder: 'Enter your Email',
          isRequired: true,
          order: 1,
        },
        password: {
          label: 'Password',
          placeholder: 'Enter your Password',
          isRequired: true,
          order: 2,
        },
        confirm_password: {
          label: 'Confirm Password',
          placeholder: 'Please Confirm your Password',
          isRequired: true,
          order: 3,
        },
        // preferred_username: {
        //   label: 'Preferred Username',
        //   placeholder: 'Choose a username',
        //   isRequired: false,
        //   order: 4,
        // },
        // given_name: {
        //   label: 'First Name',
        //   placeholder: 'Enter your first name',
        //   isRequired: false,
        //   order: 5,
        // },
        // middle_name: {
        //   label: 'Middle Name',
        //   placeholder: 'Enter your middle name',
        //   isRequired: false,
        //   order: 6,
        // },
        // family_name: {
        //   label: 'Last Name',
        //   placeholder: 'Enter your last name',
        //   isRequired: false,
        //   order: 7,
        // },
        // birthdate: {
        //   label: 'Birthdate',
        //   placeholder: 'Enter your birthdate',
        //   isRequired: false,
        //   order: 8,
        // },
      },
    },
    // components: {
    //   Header: DefaultHeader,
    // },
  };
}

/**
 * Default Authenticator Header (CloudIgniter branding).
 * Consumers may replace this by providing `components.Header` in the override.
 */
// function DefaultHeader() {
//   const { tokens } = useTheme();

//   // Avoid SSR issues while still allowing a stable asset path:
//   // - If you use Next.js public/ assets, you can just reference `/images/...`
//   // - No need to compute origin unless you truly need absolute URLs.
//   const logoImagePath = '/images/cloudigniter-logo.png';

//   return (
//     <View textAlign='center' padding={tokens.space.large}>
//       <Image alt='CloudIgniter' src={logoImagePath} width='200px' />
//     </View>
//   );
// }
