/**
 * <SmartFormField
 *   name="email"
 *   label="Email"
 *   inputType="email"
 *   placeholder="Enter your email"
 *   required
 * />
 *
 * <SmartFormField
 *   name="bio"
 *   label="Bio"
 *   type="textarea"
 *   rows={4}
 *   placeholder="Write something..."
 *   maxLength={250}
 * />
 *
 * <SmartFormField
 *   name="acceptTerms"
 *   label="I agree to the terms"
 *   type="checkbox"
 *   aria-label="Accept Terms"
 *   className="mt-2"
 * />
 */

"use client";

import { CiSmartInputField } from "./CiSmartInputField";
import { CiSmartTextareaField } from "./CiSmartTextareaField";
import { CiSmartCheckboxField } from "./CiSmartCheckboxField";
import { CiSmartJsonEditorField } from "./CiSmartJsonEditorField";
import type { CiFormFieldProps } from "@ci-next/ui/client";

export function CiSmartFormField(props: CiFormFieldProps) {
  const { type = "input" } = props;

  if (type === "checkbox") {
    return <CiSmartCheckboxField {...props} />;
  }

  if (type === "textarea") {
    return <CiSmartTextareaField {...props} />;
  }

  if (type === "jsonEditor") {
    return <CiSmartJsonEditorField {...props} />;
  }

  return <CiSmartInputField {...props} />;
}
