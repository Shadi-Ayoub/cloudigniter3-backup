import { ciGeneratedSmartForms } from "../forms/smart-forms.generated";
import { appUserExtensionFields } from "./smart-form";

export const appUserForms = {
  create: ciGeneratedSmartForms.userCreate,
  edit: ciGeneratedSmartForms.userEdit,
  extensionFields: appUserExtensionFields,
};
