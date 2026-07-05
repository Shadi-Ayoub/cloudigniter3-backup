'use client';

import { View, Image, useTheme } from '@aws-amplify/ui-react';

// type AuthenticatorRoute =
//   | 'signIn'
//   | 'signUp'
//   | 'forceNewPassword'
//   | 'confirmSignUp'
//   | 'confirmResetPassword'
//   | 'setupTotp'
//   | 'resetPassword';

// type AuthenticatorHeaderProps = {
//   route: AuthenticatorRoute;
// };

const components = {
  Header() {
    const { tokens } = useTheme();
    const baseURL = typeof window !== 'undefined' ? window.location.origin : '';
    const logoImagePath = `${baseURL}/images/Cloudigniter-Logo.png`;
    // const marginTop = route === 'signUp' ? '200px' : '0px';

    return (
      <>
        <View textAlign='center' padding={tokens.space.large}>
          <Image
            alt='Amplify logo'
            src={logoImagePath}
            width='200px'
            // style={{ marginTop }}
          />
        </View>
        {/* <Text textAlign='center'>
          Only a username is required. Choose anything you want. We just use it
          in the UI to make it look friendlier.
        </Text> */}
      </>
    );
  },
};

export default components;
