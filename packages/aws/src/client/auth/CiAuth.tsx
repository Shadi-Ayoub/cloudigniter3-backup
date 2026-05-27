"use client";

// Note1: A username, email, or phone_number value is required for Cognito User Pools.
// The username field will only work with Gen 1 Auth. For more information about using
// username see https://docs.amplify.aws/react/build-a-backend/auth/concepts/usernames/.
//
// Notre2: Sign Up screen customization info can be find at:
// https://ui.docs.amplify.aws/react/connected-components/authenticator/customization#sign-up-fields
//
//

/**
 * Handles Authentication and Authorization logic!
 */

import { type ReactNode } from "react";
import {
  Authenticator,
  ThemeProvider,
  type AuthenticatorProps,
  type Theme,
} from "@aws-amplify/ui-react";
// import '@aws-amplify/ui-react/styles.css';

import { CiConsolePrint } from "@cloudigniter/core/client";
// import { defaultCiAuthenticatorStyleTheme } from "./default-authenticator-style-theme";
import { useCiAuthenticatorStyleTheme } from "./ci-use-authenticator-style-theme";

export interface AuthProps {
  authenticatorProps: AuthenticatorProps;
  authenticatorStyleTheme?: () => Theme;
  direction?: "ltr" | "rtl";
  children: ReactNode;
}
export const CiAuth = ({
  authenticatorProps,
  authenticatorStyleTheme,
  children,
}: AuthProps) => {
  const defaultTheme = useCiAuthenticatorStyleTheme();
  const theme = authenticatorStyleTheme ?? defaultTheme;

  return (
    <ThemeProvider theme={theme}>
      <Authenticator {...authenticatorProps} className="px-4 pt-8 pb-8">
        {children}
      </Authenticator>
      <CiConsolePrint
        label="Auth"
        message="Amplify Authenticator is loaded..."
        options={{ messageType: "SUCCESS" }}
      />
    </ThemeProvider>
  );
};
