import { z } from "zod";
import type {
  CiSettingsRegistryMap,
  CiSmartFormFieldSpec,
} from "@ci-core/types";
import { ciDefineSettingsRegistry } from "./ci-define-settings-registry";

const choices = (values: string[]) =>
  values.map((value) => ({ value, label: value }));
const preferenceFields: readonly CiSmartFormFieldSpec[] = [
  {
    name: "locale",
    label: "Language",
    required: true,
    type: {
      kind: "select",
      options: [
        { value: "en", label: "English" },
        { value: "ar", label: "Arabic" },
      ],
    },
  },
  {
    name: "theme",
    label: "Theme",
    required: true,
    type: { kind: "select", options: choices(["light", "dark", "system"]) },
  },
  {
    name: "timeFormat",
    label: "Time format",
    required: true,
    type: {
      kind: "select",
      options: [
        { value: "12h", label: "12 hour" },
        { value: "24h", label: "24 hour" },
      ],
    },
  },
  {
    name: "timeZone",
    label: "Time zone",
    required: true,
    description: "IANA time zone, for example UTC or Asia/Dubai.",
  },
];
const timeZone = z.string().refine((value) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}, "Enter a valid IANA time zone.");
const preferenceSchema = z.strictObject({
  locale: z.string().min(2).max(35),
  theme: z.enum(["light", "dark", "system"]),
  timeFormat: z.enum(["12h", "24h"]),
  timeZone,
});
const preferenceCookies = {
  locale: "ci-locale",
  theme: "ci-theme",
  timeFormat: "ci-time-format",
  timeZone: "ci-time-zone",
};

/** Core groups are individually persisted and requested; custom IDs cannot replace core IDs. */
export function ciCreateCoreSettingsRegistry(
  extensions: CiSettingsRegistryMap = {},
) {
  const core: CiSettingsRegistryMap = {
    "public.general": {
      scope: "public",
      defaults: { applicationName: "CloudIgniter" },
      schema: z.strictObject({
        applicationName: z.string().trim().min(1).max(120),
      }),
      fields: [
        { name: "applicationName", label: "Application name", required: true },
      ],
      meta: {
        title: "General",
        description: "Application information available to everyone.",
      },
    },
    "public.preferences": {
      scope: "public",
      alwaysLoad: true,
      allowClientRead: true,
      defaults: {
        locale: "en",
        theme: "light",
        timeFormat: "24h",
        timeZone: "UTC",
      },
      schema: preferenceSchema,
      fields: preferenceFields,
      cookies: preferenceCookies,
      meta: {
        title: "Default preferences",
        description:
          "Used when a browser preference or personal preference is absent.",
      },
    },
    "private.email": {
      scope: "private",
      defaults: { emailSender: "admin@example.com" },
      schema: z.strictObject({ emailSender: z.email() }),
      fields: [
        {
          name: "emailSender",
          label: "Sender email",
          required: true,
          type: { kind: "email" },
        },
      ],
      meta: {
        title: "Email",
        description:
          "Authenticated application configuration. Do not store credentials or API secrets here.",
      },
    },
    "user.preferences": {
      scope: "user",
      alwaysLoad: true,
      allowClientRead: true,
      allowClientWrite: true,
      defaults: { locale: "", theme: "", timeFormat: "", timeZone: "" },
      schema: z.strictObject({
        locale: preferenceSchema.shape.locale.or(z.literal("")),
        theme: preferenceSchema.shape.theme.or(z.literal("")),
        timeFormat: preferenceSchema.shape.timeFormat.or(z.literal("")),
        timeZone: timeZone.or(z.literal("")),
      }),
      fields: preferenceFields.map((field) => ({
        ...field,
        required: false,
        ...(field.type?.kind === "select"
          ? {
              type: {
                ...field.type,
                options: [
                  { value: "", label: "Application default" },
                  ...(field.type.options ?? []),
                ],
              },
            }
          : {}),
      })),
      cookies: preferenceCookies,
      meta: {
        title: "Preferences",
        description:
          "Choose your defaults, or leave a value empty to use the application default. Existing browser choices take precedence.",
      },
    },
  };
  for (const id of Object.keys(extensions)) {
    if (Object.hasOwn(core, id))
      throw new Error(`Settings extension cannot replace core group: ${id}`);
  }
  return ciDefineSettingsRegistry({ ...core, ...extensions });
}
