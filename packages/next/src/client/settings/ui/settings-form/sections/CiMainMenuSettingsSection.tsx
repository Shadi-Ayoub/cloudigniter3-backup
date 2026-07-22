import { useTranslations } from "next-intl";
import { CiMainMenuSettingsSchema } from "@cloudigniter/core/lib";
import type { CiLocaleDirection } from "@cloudigniter/core/types";
import { CiSmartFormField } from "@cloudigniter/ui/client";
import { CiSettingsFormSection } from "./CiSettingsFormSection";

interface CiMainMenuSettingsSectionProps {
  direction?: CiLocaleDirection;
}

export const CiMainMenuSettingsSection = ({
  direction,
}: CiMainMenuSettingsSectionProps) => {
  const t = useTranslations("systemSettings");

  return (
    <CiSettingsFormSection title={`${t("sections.mainMenu.title")}`}>
      <CiSmartFormField
        type="jsonEditor"
        name="mainMenu"
        label=""
        iconType="warning"
        description={`${t("sections.mainMenu.description")}`}
        schema={CiMainMenuSettingsSchema} // optional: Zod shape validation
        height="300px"
        jsonSchema={{
          uri: "http://cloudigniter/mainMenu.schema.json",
          fileMatch: ["*"],
          schema: mainMenuSchema,
        }}
        readOnly={true}
        direction={direction}
      />
    </CiSettingsFormSection>
  );
};

export const mainMenuSchema = {
  $id: "http://cloudigniter/mainMenu.schema.json",
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "array",
  items: { $ref: "#/$defs/menuItem" },

  $defs: {
    menuItem: {
      type: "object",
      required: ["id", "label"],
      properties: {
        id: {
          type: "string",
          description: "Unique identifier for the menu item.",
        },
        label: {
          type: "string",
          description: "The visible name of the menu item.",
        },
        url: {
          type: "string",
          description: "The path this menu item should navigate to.",
        },
        icon: {
          type: "string",
          description:
            "The name of the icon (Lucide icon) to display beside the label.",
        },
        hidden: {
          type: "boolean",
          description: "Whether the menu item is hidden in the UI.",
        },
        target: {
          type: "string",
          enum: ["_self", "_blank"],
          description:
            "Specifies how to open the linked document (e.g., new tab or same tab).",
        },
        subMenu: {
          type: "object",
          description:
            "Nested submenu items as a map of menu keys to menuItem objects.",
          additionalProperties: { $ref: "#/$defs/menuItem" },
        },
      },
    },
  },
};
