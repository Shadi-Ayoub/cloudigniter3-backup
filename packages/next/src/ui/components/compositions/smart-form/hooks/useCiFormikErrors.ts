"use client";

import { useFormikContext } from "formik";

export type FormErrorEntry = {
  field: string;
  label: string;
  message: string;
  section: string;
};

export type UseFormikErrorsOptions = {
  fieldLabels?: Record<string, string>;
  fieldSectionMap: Record<string, string>;
  translate?: (key: string) => string;
  onTabChange?: (section: string) => void;
};

export const useCiFormikErrors = ({
  fieldLabels = {},
  fieldSectionMap,
  translate = (key) => key,
  onTabChange,
}: UseFormikErrorsOptions) => {
  const { errors } = useFormikContext<Record<string, unknown>>();

  const flattenErrors = (
    errObj: Record<string, unknown>,
    prefix = "",
  ): FormErrorEntry[] => {
    const result: FormErrorEntry[] = [];

    for (const key in errObj) {
      const path = prefix ? `${prefix}.${key}` : key;
      const val = errObj[key];

      if (typeof val === "string") {
        const section =
          fieldSectionMap[path] ?? path.split(".")[0] ?? "general";
        result.push({
          field: path,
          label: translate(fieldLabels[path] ?? path),
          message: val,
          section,
        });
      } else if (typeof val === "object" && val !== null) {
        result.push(...flattenErrors(val as Record<string, unknown>, path));
      }
    }

    return result;
  };

  const formErrors = flattenErrors(errors);

  const handleFormError = () => {
    const first = formErrors[0];
    if (!first) return;

    const el = document.querySelector(
      `[name="${first.field}"]`,
    ) as HTMLElement | null;

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus();
    }

    onTabChange?.(first.section);
  };

  const hasErrorInSection = (sectionId: string) =>
    formErrors.some((e) => e.section === sectionId);

  const clearFormErrors = () => {
    // No-op; errors are managed by Formik
  };

  return {
    formErrors,
    handleFormError,
    hasErrorInSection,
    clearFormErrors,
  };
};
