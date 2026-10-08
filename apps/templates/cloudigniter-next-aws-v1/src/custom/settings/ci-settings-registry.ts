import { z } from "zod";
import {
  ciCreateCoreSettingsRegistry,
  CiMainMenuSettingsSchema,
} from "@cloudigniter/core/lib";
import type { CiSettingsRegistryMap } from "@cloudigniter/core/types";

/** Application-owned groups. Each entry becomes a section in its category's form. */
export const appSettingsExtensions: CiSettingsRegistryMap = {
  "private.navigation": {
    scope: "private",
    alwaysLoad: true,
    defaults: {
      items: [
        {
          id: "home",
          label: "Home",
          url: "/",
          icon: "House",
          hidden: false,
          target: "_self",
        },
        {
          id: "dashboard",
          label: "Dashboard",
          url: "/dashboard",
          icon: "LayoutDashboard",
          hidden: false,
          target: "_self",
          subMenu: {
            Development: {
              id: "develope",
              label: "Develope",
              icon: "Code",
              hidden: false,
              target: "_self",
              subMenu: {
                Sandbox: {
                  id: "sandbox",
                  label: "Sandbox",
                  url: "/cp/dev/sandbox",
                  icon: "Codesandbox",
                  hidden: false,
                  target: "_self",
                },
                Manual: {
                  id: "manual",
                  label: "Manual",
                  url: "/cp/dev/manual",
                  icon: "BookOpenText",
                  hidden: false,
                  target: "_self",
                },
              },
            },
          },
        },
      ],
    },
    schema: z.strictObject({ items: CiMainMenuSettingsSchema }),
    fields: [
      {
        name: "items",
        label: "Navigation items",
        type: { kind: "jsonEditor", objectOnly: false },
      },
    ],
    meta: {
      title: "Navigation",
      description: "Shared navigation for signed-in users.",
    },
  },
  "public.branding": {
    scope: "public",
    alwaysLoad: false,
    meta: {
      title: "Branding",
      description: "Application-specific public copy.",
    },
    defaults: { tagline: "Welcome to our application" },
    schema: z.strictObject({ tagline: z.string().max(180) }),
    fields: [{ name: "tagline", label: "Tagline", type: { kind: "text" } }],
  },
  "private.operations": {
    scope: "private",
    alwaysLoad: false,
    meta: {
      title: "Operations",
      description: "Application-specific values for authenticated routes.",
    },
    defaults: { contactEmail: "support@example.com" },
    schema: z.strictObject({ contactEmail: z.email() }),
    fields: [
      {
        name: "contactEmail",
        label: "Contact email",
        required: true,
        type: { kind: "email" },
      },
    ],
  },
  "user.notifications": {
    scope: "user",
    alwaysLoad: false,
    meta: {
      title: "Notifications",
      description: "Your application notification preferences.",
    },
    defaults: { email: true },
    schema: z.strictObject({ email: z.boolean() }),
    fields: [
      {
        name: "email",
        label: "Email notifications",
        type: { kind: "boolean" },
      },
    ],
  },
};

export function ciBuildSettingsRegistry() {
  return ciCreateCoreSettingsRegistry(appSettingsExtensions);
}
export const ciBuildServiceSettingsRegistry = ciBuildSettingsRegistry;
