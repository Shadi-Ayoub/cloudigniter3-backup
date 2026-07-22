"use client";

// https://ui.docs.amplify.aws/react/connected-components/authenticator/customization
import { usePathname } from "next/navigation";
import { Authenticator, type AuthenticatorProps } from "@aws-amplify/ui-react";

import { appLoginPageContent } from "./app-login-page-content";

export type AppAuthenticatorPageMode = "signIn" | "signUp";

interface BuildAmplifyAuthenticatorCustomPropsOptions {
  mode?: AppAuthenticatorPageMode;
}

export function buildAmplifyAuthenticatorCustomProps({
  mode = "signIn",
}: BuildAmplifyAuthenticatorCustomPropsOptions = {}): Partial<AuthenticatorProps> {
  return {
    initialState: mode,

    /*
     * On the login page, this removes the Create Account tab while
     * retaining Amplify's built-in Forgot Password flow.
     */
    hideSignUp: mode === "signIn",

    formFields: {
      signUp: {
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
        family_name: {
          label: "Last Name",
          placeholder: "Enter your last name",
          isRequired: false,
          order: 6,
        },
        middle_name: {
          label: "Middle Name",
          placeholder: "Enter your middle name",
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
      Header: AuthenticatorHeader,
      SignUp: {
        Header: SignUpHeader,
        FormFields: SignUpFormFields,
      },
    },
  };
}

function SignUpHeader() {
  return (
    <div className="border-border/70 flex flex-col gap-2 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-10">
      <h2 className="text-lg font-semibold tracking-tight">Account details</h2>

      <p className="text-muted-foreground shrink-0 text-xs">
        <span
          className="font-semibold text-(--color-destructive,var(--color-red-600,#dc2626))"
          aria-hidden="true"
        >
          *
        </span>{" "}
        Required fields
      </p>
    </div>
  );
}

function SignUpFormFields() {
  return (
    <div className="ci-sign-up-fields">
      <Authenticator.SignUp.FormFields />
    </div>
  );
}

function AuthenticatorHeader() {
  const pathname = usePathname();
  const { brand, accountNavigation } = appLoginPageContent;

  const normalizedPathname = pathname.replace(/\/+$/, "");

  const isCreateAccountPage =
    normalizedPathname === accountNavigation.signUpHref ||
    normalizedPathname.endsWith(accountNavigation.signUpHref);

  if (isCreateAccountPage) {
    return null;
  }

  if (!brand.logoSrc && !brand.name) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-3 px-6 pt-7 pb-2 lg:hidden">
      {brand.logoSrc ? (
        <img
          src={brand.logoSrc}
          alt={brand.logoAlt}
          className="h-10 max-w-48 object-contain"
        />
      ) : null}

      {brand.name ? (
        <span className="text-foreground text-base font-semibold tracking-tight">
          {brand.name}
        </span>
      ) : null}
    </div>
  );
}
