import { useTranslations } from "next-intl";
import { CiGeneralSettingsSchema } from "@cloudigniter/core/lib";
import type { CiLocaleDirection } from "@cloudigniter/core/types";
import { CiSmartFormField } from "@cloudigniter/ui/client";
import { CiSettingsFormSection } from "./CiSettingsFormSection";

interface GeneralSectionInterface {
  direction?: CiLocaleDirection;
}

export const CiGeneralSettingsSection = ({
  direction,
}: GeneralSectionInterface) => {
  const t = useTranslations("systemSettings");

  return (
    <CiSettingsFormSection title={`${t("sections.general.title")}`}>
      {/* <SmartFormField
        type='input'
        name='general.appName'
        label='Application Name'
      /> */}
      <CiSmartFormField
        type="jsonEditor"
        name="general"
        label=""
        iconType="warning"
        description={`${t("sections.general.description")}`}
        schema={CiGeneralSettingsSchema} // optional: Zod shape validation
        height="300px"
        jsonSchema={{
          uri: "http://cloudigniter/routes.schema.json",
          fileMatch: ["*"],
          schema: GeneralSettingsJsonSchema,
        }}
        readOnly={true}
        direction={direction}
      />
    </CiSettingsFormSection>
  );
};

export const GeneralSettingsJsonSchema = {
  $id: "http://cloudigniter/general.schema.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    applicationName: {
      type: "string",
    },
  },
  required: ["applicationName"],
  additionalProperties: false,
} as const;
