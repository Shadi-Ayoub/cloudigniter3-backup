'use client';

import { View, Image, useTheme } from '@aws-amplify/ui-react';

const components = {
  Header() {
    const { tokens } = useTheme();
    const baseURL = typeof window !== 'undefined' ? window.location.origin : '';
    const logoImagePath = `${baseURL}/images/cloudigniter-logo.png`;

    return (
      <View textAlign='center' padding={tokens.space.large} marginTop='-50px'>
        <Image alt='Amplify logo' src={logoImagePath} width='200px' />
      </View>
    );
  },
};

export default components;
