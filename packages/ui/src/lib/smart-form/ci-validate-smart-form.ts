import type {
  CiSmartFormFieldSpec,
  CiSmartFormOption,
  CiSmartFormSpec,
} from "@cloudigniter/core/types";
import { ciIsSmartFormFieldVisible } from "@cloudigniter/core/lib";

export function ciValidateSmartForm<T extends object>(
  spec: CiSmartFormSpec<T>,
  values: T,
  optionSources: Readonly<Record<string, readonly CiSmartFormOption[]>> = {},
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of spec.fields) {
    if (
      !ciIsSmartFormFieldVisible(field, values) ||
      field.disabled ||
      field.readOnly
    )
      continue;
    const value = values[field.name];
    const label =
      typeof field.label === "string"
        ? field.label
        : (field.label?.text ?? field.name);
    const type = field.type ?? { kind: "text" };
    const blank =
      value === undefined ||
      value === null ||
      value === "" ||
      (typeof value === "string" && !value.trim()) ||
      (type.kind === "multiSelect" &&
        Array.isArray(value) &&
        value.length === 0);
    let message: string | undefined;
    if (blank && field.required) message = `${label} is required.`;
    if (!blank) {
      if (type.kind === "boolean" || type.kind === "checkbox") {
        if (
          value !== (type.trueOption?.value ?? true) &&
          value !== (type.falseOption?.value ?? false)
        )
          message = `Choose a value for ${label}.`;
        if (
          field.required &&
          (type.display ??
            (type.kind === "checkbox" ? "checkbox" : "switch")) ===
            "checkbox" &&
          value !== (type.trueOption?.value ?? true)
        )
          message = `${label} is required.`;
      }
      if (
        type.kind === "email" &&
        (typeof value !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      )
        message = "Enter a valid email address.";
      if (type.kind === "url") {
        try {
          new URL(String(value));
        } catch {
          message = "Enter a valid URL.";
        }
      }
      if (type.kind === "number" || type.kind === "range") {
        if (typeof value !== "number" || !Number.isFinite(value))
          message = `${label} must be a number.`;
      }
      if (
        type.kind === "multiSelect" ||
        type.kind === "singleSelect" ||
        type.kind === "select" ||
        type.kind === "radio"
      ) {
        const options = type.optionsSource
          ? optionSources[type.optionsSource]
          : type.options;
        const selected: readonly unknown[] =
          type.kind === "multiSelect"
            ? Array.isArray(value)
              ? value
              : [undefined]
            : [value];
        if (
          !options ||
          selected.some(
            (item) => !options.some((option) => option.value === item),
          )
        )
          message = `Choose a valid option for ${label}.`;
      }
      if (
        type.kind === "jsonEditor" &&
        type.objectOnly &&
        (typeof value !== "object" || value === null || Array.isArray(value))
      )
        message = `${label} must be a JSON object.`;
      const rules = field.validation;
      if (rules) {
        if (
          typeof value === "number" &&
          ((rules.min !== undefined && value < rules.min) ||
            (rules.max !== undefined && value > rules.max))
        )
          message = `${label} is outside the allowed range.`;
        if (typeof value === "string" || Array.isArray(value)) {
          if (rules.minLength !== undefined && value.length < rules.minLength)
            message = `${label} needs at least ${rules.minLength} characters or items.`;
          if (rules.maxLength !== undefined && value.length > rules.maxLength)
            message = `${label} allows at most ${rules.maxLength} characters or items.`;
        }
        if (
          rules.pattern &&
          typeof value === "string" &&
          !new RegExp(rules.pattern).test(value)
        )
          message = `${label} has an invalid format.`;
        if (message && rules.message) message = rules.message;
      }
    }
    if (message) errors[field.name] = message;
  }
  return errors;
}

export function ciSmartFormFieldLabel<T extends object>(
  field: CiSmartFormFieldSpec<T>,
): string {
  return typeof field.label === "string"
    ? field.label
    : (field.label?.text ?? field.name.replace(/([a-z])([A-Z])/g, "$1 $2"));
}
