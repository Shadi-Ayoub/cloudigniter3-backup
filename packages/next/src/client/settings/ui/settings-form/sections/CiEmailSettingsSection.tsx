import { CiSmartFormField } from "@cloudigniter/ui/client";
import { CiSettingsFormSection } from "./CiSettingsFormSection";

export const CiEmailSettingsSection = () => {
  return (
    <CiSettingsFormSection title="Security Settings">
      <CiSmartFormField
        type="input"
        name="email.emailSender"
        label="Sender Email"
        iconType="warning"
      />
    </CiSettingsFormSection>
  );
};
