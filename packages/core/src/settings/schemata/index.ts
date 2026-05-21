import { z } from "zod";
import type { CiMainMenuItem } from "@/client/ui/components/types/components-types/main-menu-types/CiMainMenuItem";
import type { CiSettings, CiSettingsValue } from "@/types";

// export type CiSettingsValue =
//   | string
//   | number
//   | boolean
//   | null
//   | CiSettingsValue[]
//   | {
//       [key: string]: CiSettingsValue | undefined;
//     };

// export type CiSettings = Record<string, CiSettingsValue>;

export const CiSettingsValueSchema: z.ZodType<CiSettingsValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(CiSettingsValueSchema),
    z.record(z.string(), CiSettingsValueSchema),
  ]),
);

export const CiGeneralSettingsSchema = z.object({
  applicationName: z.string(),
});

export const CiLocaleEntrySchema = z.object({
  code: z.string(),
  name: z.string(),
});

export const CiI18nSettingsSchema = z.object({
  locales: z.array(CiLocaleEntrySchema),
  defaultLocale: z.string(),
  cookieName: z.string(),
});

export const CiThemeSettingsSchema = z.object({
  defaultTheme: z.string(),
  storageKey: z.string(),
  enableSystem: z.boolean(),
  enableColorScheme: z.boolean(),
  disableTransitionOnChange: z.boolean(),
  themes: z.array(z.string()),
  attribute: z.string(),
});

export const CiSecuritySettingsSchema = z.object({
  enable2FA: z.boolean(),
});

export const CiEmailSettingsSchema = z.object({
  emailSender: z.string().email(),
});

export const CiMainMenuTargetSchema = z.enum(["_self", "_blank"]);

export const CiMainMenuItemSchema: z.ZodType<CiMainMenuItem> = z.lazy(() =>
  z.object({
    id: z.string(),
    label: z.string(),
    url: z.string().optional(),
    icon: z.string().optional(),
    hidden: z.boolean().optional(),
    target: CiMainMenuTargetSchema.optional(),
    subMenu: z.record(z.string(), CiMainMenuItemSchema).optional(),
  }),
);

export const CiMainMenuSettingsSchema = z.array(CiMainMenuItemSchema);

export const CiPublicCoreSettingsSchema = z.object({
  general: CiGeneralSettingsSchema,
  i18n: CiI18nSettingsSchema,
  theme: CiThemeSettingsSchema,
});

export const CiPrivateCoreSettingsSchema = z.object({
  security: CiSecuritySettingsSchema,
  email: CiEmailSettingsSchema,
  mainMenu: CiMainMenuSettingsSchema,
});

export const CiUserCoreSettingsSchema = z.object({
  locale: z
    .object({
      preferredLocale: z.string().optional(),
    })
    .optional(),
  theme: z
    .object({
      preferredTheme: z.string().optional(),
    })
    .optional(),
});

export const CiCoreSettingsFormSchema = z.looseObject({
  public: CiPublicCoreSettingsSchema,
  private: CiPrivateCoreSettingsSchema,
});

export const CiUserSettingsFormSchema = z.looseObject({
  ...CiUserCoreSettingsSchema,
});
