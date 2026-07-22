import { useTranslations } from "next-intl";
import { CiI18nSettingsSchema } from "@cloudigniter/core/lib";
import type { CiLocaleDirection } from "@cloudigniter/core/types";
import { CiSmartFormField } from "@cloudigniter/ui/client";
import { CiSettingsFormSection } from "./CiSettingsFormSection";

interface CiI18nSettingsSectionProps {
  direction?: CiLocaleDirection;
}

export const CiI18nSettingsSection = ({
  direction,
}: CiI18nSettingsSectionProps) => {
  const t = useTranslations("systemSettings");

  return (
    <CiSettingsFormSection title={`${t("sections.i18n.title")}`}>
      {/* <SmartFormField
        type='textarea'
        name='i18n'
        label='Configurations'
        iconType='warning'
      /> */}
      <CiSmartFormField
        type="jsonEditor"
        name="i18n"
        label=""
        iconType="warning"
        description={`${t("sections.i18n.description")}`}
        schema={CiI18nSettingsSchema} // optional: Zod shape validation
        height="300px"
        jsonSchema={{
          uri: "http://cloudigniter/locale.schema.json",
          fileMatch: ["*"],
          schema: LocaleSettingsJsonSchema,
        }}
        readOnly={true}
        direction={direction}
      />
    </CiSettingsFormSection>
  );
};

export const LocaleSettingsJsonSchema = {
  $id: "http://cloudigniter/locale.schema.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    locale: {
      type: "array",
      items: { $ref: "#/$defs/locale" },
    },
    defaultLocale: {
      type: "string",
    },
    localeCookieName: {
      type: "string",
    },
  },
  required: ["locale", "defaultLocale", "localeCookieName"],
  additionalProperties: false,
  $defs: {
    locale: {
      type: "object",
      properties: {
        code: { type: "string" },
        name: { type: "string" },
      },
      required: ["code", "name"],
      additionalProperties: false,
    },
  },
} as const;
