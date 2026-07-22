import { CiSettingsFormSection } from "./CiSettingsFormSection";
import { CiSmartFormField } from "@cloudigniter/ui/client";

export const CiSecuritySettingsSection = () => {
  return (
    <CiSettingsFormSection title="Security Settings">
      <CiSmartFormField
        type="checkbox"
        name="security.enable2FA"
        label="Enable Two-Factor Authentication"
      />
    </CiSettingsFormSection>
  );
};
