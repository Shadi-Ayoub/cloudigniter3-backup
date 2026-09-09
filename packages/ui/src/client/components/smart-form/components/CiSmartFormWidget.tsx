"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { CiSmartFormOption } from "@cloudigniter/core/types";
import type { CiSmartFormFieldRenderProps } from "@ci-ui/types";
import { Input } from "../../shadcn/input";
import { Textarea } from "../../shadcn/textarea";
import { Button } from "../../shadcn/button";
import { cn } from "../../shadcn/lib/utils";

const selectClass =
  "flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function JsonWidget<T extends object>(props: CiSmartFormFieldRenderProps<T>) {
  const reportError = useRef(props.onError);
  reportError.current = props.onError;
  // Hidden/unmounted editors discard drafts; do not leave a stale parse error behind.
  useEffect(() => () => reportError.current(undefined), []);
  const [draft, setDraft] = useState(() =>
    props.value === "" || props.value === undefined
      ? ""
      : JSON.stringify(props.value, null, 2),
  );
  return (
    <Textarea
      id={props.id}
      name={props.field.name}
      value={draft}
      rows={Number(props.field.props?.rows ?? 5)}
      className="font-mono"
      disabled={props.disabled}
      readOnly={props.readOnly}
      aria-invalid={!!props.error}
      aria-describedby={props.describedBy}
      onBlur={props.onBlur}
      onChange={(event) => {
        const text = event.target.value;
        setDraft(text);
        try {
          const value: unknown = text.trim() ? JSON.parse(text) : "";
          props.onError(undefined);
          props.onChange(value);
        } catch {
          props.onError("Enter valid JSON.");
        }
      }}
    />
  );
}

export function CiSmartFormWidget<T extends object>(
  props: CiSmartFormFieldRenderProps<T> & {
    options: readonly CiSmartFormOption[];
  },
) {
  const {
    field,
    id,
    value,
    onChange,
    onBlur,
    disabled,
    readOnly,
    options,
    describedBy,
    error,
  } = props;
  const type = field.type ?? { kind: "text" };
  const min = field.validation?.min ?? field.props?.min;
  const max = field.validation?.max ?? field.props?.max;
  const common = {
    ...field.props,
    id,
    name: field.name,
    disabled,
    readOnly,
    onBlur,
    min: typeof min === "number" || typeof min === "string" ? min : undefined,
    max: typeof max === "number" || typeof max === "string" ? max : undefined,
    minLength: field.validation?.minLength,
    maxLength:
      field.validation?.maxLength ??
      (typeof field.props?.maxLength === "number"
        ? field.props.maxLength
        : undefined),
    pattern: field.validation?.pattern,
    "aria-invalid": !!error,
    "aria-describedby": describedBy,
    "aria-required": field.required,
  };
  if (type.kind === "custom") return null;
  if (type.kind === "jsonEditor") return <JsonWidget {...props} />;
  if (type.kind === "boolean" || type.kind === "checkbox") {
    const yes = type.trueOption ?? { value: true, label: "Yes" };
    const no = type.falseOption ?? { value: false, label: "No" };
    const display =
      type.display ?? (type.kind === "checkbox" ? "checkbox" : "switch");
    if (display === "radio")
      return (
        <div
          id={id}
          role="radiogroup"
          aria-labelledby={`${id}-label`}
          aria-describedby={describedBy}
          aria-invalid={!!error}
          className={cn("flex gap-3", type.orientation !== "row" && "flex-col")}
        >
          {[yes, no].map((option, index) => (
            <label
              key={index}
              className="flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm"
            >
              <input
                type="radio"
                name={field.name + id}
                checked={value === option.value}
                disabled={disabled || readOnly || option.disabled}
                onBlur={onBlur}
                onChange={() => onChange(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      );
    if (display === "checkbox")
      return (
        <label
          htmlFor={id}
          className="flex min-h-11 items-center gap-3 text-sm"
        >
          <input
            {...common}
            type="checkbox"
            className="size-5 accent-primary"
            checked={value === yes.value}
            disabled={disabled || readOnly}
            onChange={(event) =>
              onChange(event.target.checked ? yes.value : no.value)
            }
          />
          <span>{value === yes.value ? yes.label : no.label}</span>
        </label>
      );
    return (
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={value === yes.value}
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy}
        aria-invalid={!!error}
        disabled={disabled || readOnly}
        onBlur={onBlur}
        onClick={() => onChange(value === yes.value ? no.value : yes.value)}
        className="flex min-h-11 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        <span
          className={cn(
            "inline-flex h-6 w-11 items-center rounded-full p-0.5 transition-colors",
            value === yes.value ? "bg-primary" : "bg-muted-foreground",
          )}
        >
          <span
            className={cn(
              "size-5 rounded-full bg-background transition-transform motion-reduce:transition-none",
              value === yes.value && "translate-x-5 rtl:-translate-x-5",
            )}
          />
        </span>
        <span className="text-sm">
          {value === yes.value ? yes.label : no.label}
        </span>
      </button>
    );
  }
  if (
    type.kind === "singleSelect" ||
    type.kind === "select" ||
    type.kind === "radio" ||
    type.kind === "multiSelect"
  ) {
    const multi = type.kind === "multiSelect";
    const selected: readonly unknown[] = multi
      ? Array.isArray(value)
        ? value
        : []
      : [value];
    const display =
      type.display ?? (type.kind === "radio" ? "radio" : "dropdown");
    const changeOption = (option: CiSmartFormOption, checked: boolean) =>
      onChange(
        multi
          ? checked
            ? [...selected, option.value]
            : selected.filter((item) => item !== option.value)
          : option.value,
      );
    if (display === "radio" || display === "checkbox")
      return (
        <div
          id={id}
          role={multi ? "group" : "radiogroup"}
          aria-labelledby={`${id}-label`}
          aria-describedby={describedBy}
          aria-invalid={!!error}
          className={cn("flex gap-2", type.orientation !== "row" && "flex-col")}
        >
          {options.map((option, index) => (
            <label
              key={index}
              className="flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm"
            >
              <input
                type={multi ? "checkbox" : "radio"}
                name={field.name + id}
                checked={selected.includes(option.value)}
                disabled={disabled || readOnly || option.disabled}
                onBlur={onBlur}
                onChange={(event) => changeOption(option, event.target.checked)}
              />
              {option.label}
            </label>
          ))}
        </div>
      );
    if (display === "slider") {
      const index = options.findIndex((option) => option.value === value);
      return (
        <div className="grid gap-1">
          <Input
            {...common}
            type="range"
            min={0}
            max={Math.max(0, options.length - 1)}
            step={1}
            value={Math.max(0, index)}
            aria-valuetext={options[index]?.label ?? "No selection"}
            disabled={disabled || readOnly || !options.length}
            onChange={(event) => {
              const option = options[Number(event.target.value)];
              if (option && !option.disabled) onChange(option.value);
            }}
          />
          <output htmlFor={id} className="text-sm text-muted-foreground">
            {options[index]?.label ?? "No selection"}
          </output>
          {index < 0 && options.some((option) => !option.disabled) && (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 justify-self-start"
              disabled={disabled || readOnly}
              onClick={() => {
                const first = options.find((option) => !option.disabled);
                if (first) onChange(first.value);
              }}
            >
              Select {options.find((option) => !option.disabled)?.label}
            </Button>
          )}
        </div>
      );
    }
    if (multi && display === "dropdown")
      return (
        <details className="rounded-md border border-input">
          <summary
            id={id}
            className="min-h-11 cursor-pointer px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
            aria-labelledby={`${id}-label`}
            aria-describedby={describedBy}
          >
            {selected.length ? `${selected.length} selected` : "Select options"}
          </summary>
          <div className="grid max-h-60 gap-1 overflow-y-auto border-t border-border p-2">
            {options.map((option, index) => (
              <label
                key={index}
                className="flex min-h-11 items-center gap-2 px-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  disabled={disabled || readOnly || option.disabled}
                  onBlur={onBlur}
                  onChange={(event) =>
                    changeOption(option, event.target.checked)
                  }
                />
                {option.label}
              </label>
            ))}
          </div>
        </details>
      );
    const selection = options.findIndex((option) => option.value === value);
    return (
      <div className="grid gap-2">
        <select
          {...common}
          className={cn(
            selectClass,
            typeof field.props?.className === "string" && field.props.className,
          )}
          value={multi ? "" : selection < 0 ? "" : String(selection)}
          disabled={disabled || readOnly}
          onChange={(event) => {
            const option = options[Number(event.target.value)];
            if (event.target.value === "") {
              if (!multi) onChange("");
            } else if (option) changeOption(option, true);
          }}
        >
          <option value="">
            {String(field.props?.placeholder ?? "Select an option")}
          </option>
          {options.map((option, index) => (
            <option
              key={index}
              value={index}
              disabled={
                option.disabled || (multi && selected.includes(option.value))
              }
            >
              {option.label}
            </option>
          ))}
        </select>
        {multi && (
          <div className="flex flex-wrap gap-2">
            {options
              .filter((option) => selected.includes(option.value))
              .map((option, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="secondary"
                  className="min-h-11 rounded-full"
                  disabled={disabled || readOnly || option.disabled}
                  aria-label={`Remove ${option.label}`}
                  onClick={() => changeOption(option, false)}
                >
                  {option.label}
                  <X aria-hidden className="size-4" />
                </Button>
              ))}
          </div>
        )}
      </div>
    );
  }
  if (type.kind === "textarea")
    return (
      <Textarea
        {...common}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  return (
    <Input
      {...common}
      type={type.kind}
      className={cn(
        "min-h-11",
        typeof field.props?.className === "string" && field.props.className,
      )}
      value={
        typeof value === "string" || typeof value === "number" ? value : ""
      }
      onChange={(event) =>
        onChange(
          (type.kind === "number" || type.kind === "range") &&
            event.target.value !== ""
            ? event.target.valueAsNumber
            : event.target.value,
        )
      }
    />
  );
}
