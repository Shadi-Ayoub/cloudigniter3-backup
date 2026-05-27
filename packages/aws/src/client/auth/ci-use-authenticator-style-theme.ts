"use client";

import { useTheme } from "@aws-amplify/ui-react";
import type { Theme } from "@aws-amplify/ui-react";

export function useCiAuthenticatorStyleTheme(): Theme {
  const { tokens } = useTheme();

  return {
    name: "ci-authenticator-default-style-theme",
    tokens: {
      components: {
        authenticator: {
          router: {
            boxShadow: `0 0 16px ${tokens.colors.overlay["10"]}`,
            borderWidth: "0",
          },
          form: {
            padding: `${tokens.space.medium} ${tokens.space.xl} ${tokens.space.medium}`,
          },
        },
        button: {
          primary: {
            backgroundColor: tokens.colors.neutral["100"],
          },
          link: {
            color: tokens.colors.purple["80"],
          },
        },
        fieldcontrol: {
          _focus: {
            boxShadow: `0 0 0 2px ${tokens.colors.purple["60"]}`,
          },
        },
        tabs: {
          item: {
            color: tokens.colors.neutral["80"],
            _active: {
              borderColor: tokens.colors.neutral["100"],
              color: tokens.colors.purple["100"],
            },
          },
        },
      },
    },
  };
}
