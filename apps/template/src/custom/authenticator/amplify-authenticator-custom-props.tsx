"use client";

// https://ui.docs.amplify.aws/react/connected-components/authenticator/customization#sign-up-fields

import {
  View,
  Image,
  useTheme,
  type AuthenticatorProps,
} from "@aws-amplify/ui-react";

export const amplifyAuthenticatorCustomProps: Partial<AuthenticatorProps> = {
  formFields: {
    signUp: {
      // email: {
      //   label: 'Email',
      //   placeholder: 'Enter your Email',
      //   isRequired: true,
      //   order: 1,
      // },
      // password: {
      //   label: 'Password',
      //   placeholder: 'Enter your Password',
      //   isRequired: true,
      //   order: 2,
      // },
      // confirm_password: {
      //   label: 'Confirm Password',
      //   placeholder: 'Please Confirm your Password',
      //   isRequired: true,
      //   order: 3,
      // },
      preferred_username: {
        label: "Preferred Username",
        placeholder: "Choose a username",
        isRequired: false,
        order: 4,
      },
      given_name: {
        label: "First Name",
        placeholder: "Enter your first name",
        isRequired: false,
        order: 5,
      },
      middle_name: {
        label: "Middle Name",
        placeholder: "Enter your middle name",
        isRequired: false,
        order: 6,
      },
      family_name: {
        label: "Last Name",
        placeholder: "Enter your last name",
        isRequired: false,
        order: 7,
      },
      birthdate: {
        label: "Birthdate",
        placeholder: "Enter your birthdate",
        isRequired: false,
        order: 8,
      },
    },
  },
  components: {
    Header,
  },
};

function Header() {
  const { tokens } = useTheme();
  const baseURL = typeof window !== "undefined" ? window.location.origin : "";
  const logoImagePath = `${baseURL}/images/cloudigniter-logo.png`;
  // const marginTop = route === 'signUp' ? '200px' : '0px';

  return (
    <>
      <View textAlign="center" padding={tokens.space.large}>
        <Image
          alt="Amplify logo"
          src={logoImagePath}
          width="200px"
          // style={{ marginTop }}
        />
      </View>
      {/* <Text textAlign='center'>
          Only a username is required. Choose anything you want. We just use it
          in the UI to make it look friendlier.
        </Text> */}
    </>
  );
}
