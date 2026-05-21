import { useTranslations } from "next-intl";
import { CiThemeSettingsSchema } from "@cloudigniter/core";
import { CiSmartFormField } from "@cloudigniter/core/client";
import { CiSettingsFormSection } from "./CiSettingsFormSection";

interface CiThemeSettingsSectionProps {
  direction?: "ltr" | "rtl";
}

export const CiThemeSettingsSection = ({
  direction,
}: CiThemeSettingsSectionProps) => {
  const t = useTranslations("systemSettings");

  return (
    <CiSettingsFormSection title={`${t("sections.theme.title")}`}>
      {/* <SmartFormField
        type='textarea'
        name='i18n'
        label='Configurations'
        iconType='warning'
      /> */}
      <CiSmartFormField
        type="jsonEditor"
        name="theme"
        label=""
        iconType="warning"
        description={`${t("sections.theme.description")}`}
        schema={CiThemeSettingsSchema} // optional: Zod shape validation
        height="300px"
        jsonSchema={{
          uri: "http://cloudigniter/theme.schema.json",
          fileMatch: ["*"],
          schema: ThemeSettingsJsonSchema,
        }}
        readOnly={true}
        direction={direction}
      />
    </CiSettingsFormSection>
  );
};

export const ThemeSettingsJsonSchema = {
  $id: "http://cloudigniter/theme.schema.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    defaultTheme: {
      type: "string",
    },
    storageKey: {
      type: "string",
    },
    enableSystem: {
      type: "boolean",
    },
    enableColorScheme: {
      type: "boolean",
    },
    disableTransitionOnChange: {
      type: "boolean",
    },
    themes: {
      type: "array",
      items: { type: "string" },
    },
    attribute: {
      type: "string",
    },
    value: {
      type: "object",
      description:
        'Map each theme name to the attribute value to set (e.g. `{ dark: "my-dark" }`)',
      additionalProperties: { type: "string" },
      default: {},
    },
    nonce: {
      type: "string",
    },
    scriptProps: {
      type: "object",
      description:
        "Any extra props to pass to the injected theme-initializer script",
      additionalProperties: {
        anyOf: [{ type: "string" }, { type: "boolean" }],
      },
      default: {},
    },
    forcedTheme: {
      type: "string",
    },
    resolvedTheme: {
      type: "string",
    },
    systemTheme: {
      type: "string",
    },
    themeDir: {
      type: "string",
    },
  },
  required: [],
  additionalProperties: false,
} as const;
