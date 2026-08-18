import type { RowData } from "@tanstack/react-table";

import type { CiDataEntityEditorMode, CiDataEntityField } from "@ci-ui/types";

export type CiDataEntityFormDraft = Record<string, string>;

export type CiDataEntityFormParseResult<TRecord extends RowData> =
  | {
      ok: true;
      values: Partial<TRecord>;
      errors: Record<string, never>;
    }
  | {
      ok: false;
      values: Partial<TRecord>;
      errors: Record<string, string>;
    };

/** Produces the lossless string representation used by the dynamic editor. */
function serializeFieldValue<TRecord extends RowData>(
  field: CiDataEntityField<TRecord>,
  value: unknown,
): string {
  if (value === undefined || value === null) return "";
  if (field.array || field.valueKind === "json") {
    return JSON.stringify(value, null, 2) ?? "";
  }
  if (field.valueKind === "boolean") return value === true ? "true" : "false";
  return String(value);
}

/** Resolves a field default without sharing mutable values between sessions. */
function resolveDefaultValue<TRecord extends RowData>(
  field: CiDataEntityField<TRecord>,
): unknown {
  return typeof field.defaultValue === "function"
    ? field.defaultValue()
    : field.defaultValue;
}

/** Creates one editor draft from field defaults and optional record values. */
export function ciCreateDataEntityFormDraft<TRecord extends RowData>(
  fields: readonly CiDataEntityField<TRecord>[],
  values?: Partial<TRecord>,
): CiDataEntityFormDraft {
  const source = values as Record<string, unknown> | undefined;

  return Object.fromEntries(
    fields.map((field) => {
      const hasSourceValue = source
        ? Object.prototype.hasOwnProperty.call(source, field.name)
        : false;
      const value = hasSourceValue
        ? source?.[field.name]
        : resolveDefaultValue(field);
      return [field.name, serializeFieldValue(field, value)];
    }),
  );
}

/** Parses and validates one scalar value from its editor representation. */
function parseFieldValue<TRecord extends RowData>(
  field: CiDataEntityField<TRecord>,
  rawValue: string,
): { value?: unknown; error?: string } {
  const isEmpty = rawValue.trim().length === 0;
  if (isEmpty) {
    return field.required
      ? { error: `${field.label} is required.` }
      : { value: undefined };
  }

  if (field.array) {
    try {
      const value: unknown = JSON.parse(rawValue);
      if (!Array.isArray(value)) {
        return { error: `${field.label} must be a JSON array.` };
      }
      if (field.required && value.length === 0) {
        return { error: `${field.label} must contain at least one value.` };
      }
      const invalidItem = value.find((item) => {
        if (item === null) return field.itemsRequired === true;
        switch (field.valueKind) {
          case "string":
            return typeof item !== "string";
          case "number":
            return (
              typeof item !== "number" ||
              !Number.isFinite(item) ||
              (field.min !== undefined && item < field.min) ||
              (field.max !== undefined && item > field.max)
            );
          case "boolean":
            return typeof item !== "boolean";
          case "json":
            return false;
        }
      });

      if (field.itemsRequired && value.some((item) => item === null)) {
        return { error: `${field.label} cannot contain null values.` };
      }

      return invalidItem === undefined
        ? { value }
        : {
            error: `${field.label} contains a value that is not a valid ${field.valueKind}.`,
          };
    } catch {
      return { error: `${field.label} must be a valid JSON array.` };
    }
  }

  switch (field.valueKind) {
    case "string": {
      if (
        field.inputKind === "email" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawValue)
      ) {
        return { error: `${field.label} must be a valid email address.` };
      }
      if (field.inputKind === "url") {
        try {
          new URL(rawValue);
        } catch {
          return { error: `${field.label} must be a valid absolute URL.` };
        }
      }
      return { value: rawValue };
    }
    case "number": {
      const value = Number(rawValue);
      if (!Number.isFinite(value)) {
        return { error: `${field.label} must be a finite number.` };
      }
      if (field.min !== undefined && value < field.min) {
        return {
          error: `${field.label} must be greater than or equal to ${field.min}.`,
        };
      }
      if (field.max !== undefined && value > field.max) {
        return {
          error: `${field.label} must be less than or equal to ${field.max}.`,
        };
      }
      if (
        typeof field.step === "number" &&
        field.step > 0 &&
        Math.abs(
          (value - (field.min ?? 0)) / field.step -
            Math.round((value - (field.min ?? 0)) / field.step),
        ) > 1e-9
      ) {
        return {
          error: `${field.label} must use increments of ${field.step}.`,
        };
      }
      return { value };
    }
    case "boolean":
      return rawValue === "true" || rawValue === "false"
        ? { value: rawValue === "true" }
        : { error: `${field.label} must be true or false.` };
    case "json":
      try {
        return { value: JSON.parse(rawValue) as unknown };
      } catch {
        return { error: `${field.label} must contain valid JSON.` };
      }
  }
}

/** Parses field drafts into provider-neutral mutation values and field errors. */
export function ciParseDataEntityFormDraft<TRecord extends RowData>(
  fields: readonly CiDataEntityField<TRecord>[],
  draft: CiDataEntityFormDraft,
  mode: CiDataEntityEditorMode,
): CiDataEntityFormParseResult<TRecord> {
  const values: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const parsed = parseFieldValue(field, draft[field.name] ?? "");
    if (parsed.error) {
      errors[field.name] = parsed.error;
      continue;
    }
    values[field.name] =
      mode === "edit" && parsed.value === undefined ? null : parsed.value;
  }

  const typedValues = values as Partial<TRecord>;
  for (const field of fields) {
    if (errors[field.name] || !field.validate) continue;
    const message = field.validate(values[field.name], typedValues, mode);
    if (message) errors[field.name] = message;
  }

  return Object.keys(errors).length > 0
    ? { ok: false, values: typedValues, errors }
    : { ok: true, values: typedValues, errors: {} };
}
