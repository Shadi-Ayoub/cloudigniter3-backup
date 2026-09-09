export {
  ciCompileSmartForm,
  ciDefineSmartForm,
  ciGenerateSmartFormModule,
  ciIsSmartFormFieldVisible,
  ciMapSmartFormData,
  ciMergeSmartFormSpecifications,
  ciMergeSmartFormTemplates,
  ciSmartFormInitialValues,
} from "./ci-smart-form";
export {
  CI_USER_CREATE_FORM_SPEC,
  CI_USER_EDIT_FORM_SPEC,
  CI_USER_FORM_TEMPLATE,
  CI_USER_EDIT_FORM_TEMPLATE,
} from "./ci-user-form-definitions";
import { ciGeneratedSmartForms } from "./ci-core-forms.generated";
export const CI_USER_CREATE_FORM = ciGeneratedSmartForms.userCreate;
export const CI_USER_EDIT_FORM = ciGeneratedSmartForms.userEdit;
