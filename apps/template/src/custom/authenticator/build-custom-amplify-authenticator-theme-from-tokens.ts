// https://ui.docs.amplify.aws/react/theming

import type { CiAuthenticatorThemeOverride } from "@cloudigniter/aws/client";

export function buildCustomAmplifyAuthenticatorThemeOverride(): CiAuthenticatorThemeOverride {
  return {
    name: "Application Authenticator Theme",

    tokens: {
      colors: {
        background: {
          primary: "var(--color-card)",
          secondary: "var(--color-surface-muted)",
          disabled: "var(--color-muted)",
        },

        border: {
          primary: "var(--color-input)",
          focus: "var(--color-ring)",
        },

        font: {
          primary: "var(--color-foreground)",
          secondary: "var(--color-muted-foreground)",
          interactive: "var(--color-primary)",
          hover: "var(--color-primary-700)",
          focus: "var(--color-primary)",
          inverse: "var(--color-primary-foreground)",
        },
      },

      components: {
        authenticator: {
          router: {
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
            borderWidth: "1px",
            boxShadow: "var(--shadow-xl)",
          },

          form: {
            padding: "1.5rem 2rem 2rem",
          },
        },

        button: {
          primary: {
            backgroundColor: "var(--color-primary)",
            borderColor: "var(--color-primary)",
            color: "var(--color-primary-foreground)",

            _hover: {
              backgroundColor: "var(--color-primary-700)",
              borderColor: "var(--color-primary-700)",
              color: "var(--color-primary-foreground)",
            },

            _focus: {
              backgroundColor: "var(--color-primary-700)",
              borderColor: "var(--color-ring)",
              boxShadow: "0 0 0 2px var(--color-ring)",
              color: "var(--color-primary-foreground)",
            },
          },

          link: {
            color: "var(--color-primary)",

            _hover: {
              color: "var(--color-primary-700)",
            },
          },
        },

        fieldcontrol: {
          borderColor: "var(--color-input)",
          borderRadius: "var(--radius-md)",
          color: "var(--color-foreground)",

          _focus: {
            borderColor: "var(--color-ring)",
            boxShadow: "0 0 0 2px var(--color-ring)",
          },
        },
      },
    },
  };
}
