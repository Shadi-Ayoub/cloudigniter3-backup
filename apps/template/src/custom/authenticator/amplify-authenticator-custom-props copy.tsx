// custom/authenticator/amplify-authenticator-custom-props.tsx
"use client";

// https://ui.docs.amplify.aws/react/connected-components/authenticator/customization

import type { AuthenticatorProps } from "@aws-amplify/ui-react";
import { usePathname } from "next/navigation";
import { appLoginPageContent } from "./app-login-page-content";

export function buildAmplifyAuthenticatorCustomProps(): Partial<AuthenticatorProps> {
  return {
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
      Header: AuthenticatorHeader,
    },
  };
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
