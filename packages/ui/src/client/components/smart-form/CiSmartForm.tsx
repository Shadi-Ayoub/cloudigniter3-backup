"use client";

import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import {
  ciDefineSmartForm,
  ciIsSmartFormFieldVisible,
  ciSmartFormInitialValues,
} from "@cloudigniter/core/lib";
import type {
  CiSmartFormButtonSpec,
  CiSmartFormValues,
} from "@cloudigniter/core/types";
import type { CiSmartFormProps } from "@ci-ui/types";
import {
  ciSmartFormFieldLabel,
  ciValidateSmartForm,
} from "../../../lib/smart-form/ci-validate-smart-form";
import { CiAlert } from "../../feedback/CiAlert";
import { ciNormalizeClientThrownError } from "../../feedback/ci-normalize-client-thrown-error";
import { Button } from "../shadcn/button";
import { cn } from "../shadcn/lib/utils";
import { CiSmartFormWidget } from "./components/CiSmartFormWidget";
import { CiIcon } from "../../../common/icon/CiIcon";

const columns = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};
const isSubmit = (button: CiSmartFormButtonSpec) =>
  ["create", "update", "save"].includes(button.type);

export function CiSmartForm<T extends object = CiSmartFormValues>(
  props: CiSmartFormProps<T>,
) {
  const sourceSpecifications =
    props.specifications ?? props.coreForm?.specifications;
  const definition =
    props.coreForm?.specifications.category === "fixed"
      ? props.coreForm
      : (props.definition ??
        (sourceSpecifications && (props.specifications || props.template)
          ? ciDefineSmartForm(
              sourceSpecifications,
              props.template ?? props.coreForm?.template,
            )
          : props.coreForm));
  if (!definition || definition.version !== 1)
    throw new Error(
      "CiSmartForm needs a supported definition, coreForm, or specifications.",
    );
  const spec = {
    ...definition.specifications,
    fields: definition.specifications.fields
      .filter((field) => !props.fieldState?.[field.name]?.hidden)
      .map((field) => ({ ...field, ...props.fieldState?.[field.name] })),
  };
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const busyRef = useRef(false);
  const revision = useRef(0);
  const [values, setValues] = useState<T>(() =>
    ciSmartFormInitialValues(definition.specifications, props.data),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});
  const draftErrorsRef = useRef(draftErrors);
  const [pending, setPending] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const disabled = props.disabled || pending !== null;
  const fields = new Map(spec.fields.map((field) => [field.name, field]));
  const buttons = [
    ...(spec.buttons ?? [{ id: "save", label: "Save", type: "save" as const }]),
  ]
    .map((button) => ({ ...button, ...props.buttonState?.[button.id] }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const locale = props.locale ?? spec.locale ?? "en-US";

  const reset = () => {
    revision.current++;
    setValues(ciSmartFormInitialValues(definition.specifications, props.data));
    setResetKey((current) => current + 1);
    setErrors({});
    setDraftErrors({});
    draftErrorsRef.current = {};
    setFailure(null);
    setSuccess(false);
  };
  const validate = async (snapshot: T) => {
    const next = ciValidateSmartForm(spec, snapshot, props.options);
    // Honor native props such as step, date bounds, and maxLength even though
    // noValidate routes presentation through CloudIgniter's inline feedback.
    for (const control of formRef.current?.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >("input,select,textarea") ?? []) {
      const name =
        control.closest<HTMLElement>("[data-smart-field]")?.dataset.smartField;
      if (
        name &&
        control.willValidate &&
        !control.validity.valid &&
        !next[name]
      )
        next[name] = control.validationMessage;
    }
    for (const field of spec.fields) {
      if (
        !ciIsSmartFormFieldVisible(field, snapshot) ||
        field.disabled ||
        field.readOnly
      )
        continue;
      const draftError = draftErrorsRef.current[field.name];
      if (draftError) next[field.name] = draftError;
      const key = field.validation?.validator;
      if (key) {
        const validator = props.validators?.[key];
        if (!validator)
          throw new Error(`Missing Smart Form validator: ${key}.`);
        const message = await validator(snapshot[field.name], snapshot);
        if (message) next[field.name] = message;
      }
    }
    return next;
  };
  const focusInvalid = (next: Record<string, string>) => {
    if (spec.errors?.focusFirstInvalid === false) return;
    const nodes =
      formRef.current?.querySelectorAll<HTMLElement>("[data-smart-field]");
    for (const node of nodes ?? []) {
      if (!next[node.dataset.smartField ?? ""]) continue;
      let ancestor: HTMLElement | null = node.parentElement;
      while (ancestor) {
        if (ancestor instanceof HTMLDetailsElement) ancestor.open = true;
        ancestor = ancestor.parentElement;
      }
      node
        .querySelector<HTMLElement>(
          "input,select,textarea,button,summary,[tabindex]",
        )
        ?.focus();
      break;
    }
  };
  const run = async (button: CiSmartFormButtonSpec) => {
    if (disabled || busyRef.current || button.disabled) return;
    busyRef.current = true;
    revision.current++;
    setPending(button.id);
    setFailure(null);
    setSuccess(false);
    try {
      if (button.validate ?? isSubmit(button)) {
        const next = await validate(values);
        setErrors(next);
        if (Object.keys(next).length) {
          setFailure(
            spec.errors?.validationMessage ??
              "Please correct the highlighted fields.",
          );
          // Inputs are enabled again before focus is applied.
          setTimeout(() => focusInvalid(next), 0);
          return;
        }
      }
      const context = {
        values,
        button,
        reset,
        setFieldError: (name: Extract<keyof T, string>, message: string) =>
          setErrors((current) => ({ ...current, [name]: message })),
      };
      const callback = props.callbacks?.[button.callback ?? button.id];
      if (callback) await callback(context);
      else if (isSubmit(button) && props.onSubmit)
        await props.onSubmit(values, context);
      else if (button.type === "cancel" && !button.callback) reset();
      else
        throw new Error(
          `Missing Smart Form callback: ${button.callback ?? button.id}.`,
        );
      if (button.type !== "cancel") setSuccess(true);
    } catch (error) {
      const normalized = ciNormalizeClientThrownError(error);
      setFailure(normalized.message);
      props.onError?.(normalized);
    } finally {
      busyRef.current = false;
      setPending(null);
    }
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const requestedId = submitter?.getAttribute("data-smart-button");
    const button =
      buttons.find((item) => item.id === requestedId && isSubmit(item)) ??
      buttons.find((item) => isSubmit(item) && !item.disabled);
    if (button) void run(button);
  };
  const alert = failure && (
    <CiAlert
      variant="error"
      title={spec.errors?.title ?? "Unable to complete the form"}
      description={failure}
      dismissible={spec.errors?.dismissible ?? true}
      open
      onOpenChange={(open) => {
        if (!open) setFailure(null);
      }}
    />
  );

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={submit}
      dir={spec.direction}
      aria-busy={pending !== null}
      className={cn("relative grid gap-5", spec.className, props.className)}
    >
      {(spec.title || spec.subtitle || spec.introduction) && (
        <header className="grid gap-2">
          {spec.title && (
            <h2 className="text-xl font-semibold tracking-tight">
              {spec.title}
            </h2>
          )}
          {spec.subtitle && (
            <p className="text-sm text-muted-foreground">{spec.subtitle}</p>
          )}
          {spec.introduction && (
            <div className="whitespace-pre-line rounded-md bg-muted p-4 text-sm">
              {spec.introduction}
            </div>
          )}
        </header>
      )}
      {(spec.errors?.placement ?? "top") === "top" && alert}
      <div
        key={resetKey}
        className={cn("grid gap-5", definition.template.className)}
      >
        {definition.template.groups.map((group) => {
          const groupSpec = spec.groups?.find(
            (item) => item.name === group.name,
          );
          const content = group.rows.map((row) => (
            <div
              key={row.id}
              className={cn(
                "grid gap-4",
                columns[row.columns ?? 1],
                row.className,
              )}
            >
              {row.fields.map((name) => {
                const field = fields.get(name);
                if (!field || !ciIsSmartFormFieldVisible(field, values))
                  return null;
                const fieldId = `${id}-${name}`;
                const error = draftErrors[name] || errors[name];
                const label = ciSmartFormFieldLabel(field);
                const describedBy =
                  [
                    field.description && `${fieldId}-description`,
                    error && `${fieldId}-error`,
                  ]
                    .filter(Boolean)
                    .join(" ") || undefined;
                const onBlur = () => {
                  const at = revision.current;
                  void validate(values)
                    .then((next) => {
                      if (at === revision.current && !busyRef.current)
                        setErrors((current) => ({
                          ...current,
                          [name]: next[name] ?? "",
                        }));
                    })
                    .catch((error: unknown) => {
                      if (at === revision.current)
                        setFailure(ciNormalizeClientThrownError(error).message);
                    });
                };
                const renderProps = {
                  field,
                  id: fieldId,
                  value: values[name],
                  values,
                  disabled: Boolean(disabled || field.disabled),
                  readOnly: field.readOnly ?? false,
                  error,
                  describedBy,
                  onBlur,
                  onChange: (value: unknown) => {
                    if (disabled || field.disabled || field.readOnly) return;
                    revision.current++;
                    const next = { ...values, [name]: value };
                    setValues(next);
                    setSuccess(false);
                    props.onValuesChange?.(next);
                    setErrors((current) => ({ ...current, [name]: "" }));
                  },
                  onError: (message?: string) => {
                    const next = {
                      ...draftErrorsRef.current,
                      [name]: message ?? "",
                    };
                    draftErrorsRef.current = next;
                    setDraftErrors(next);
                  },
                };
                const custom =
                  field.type?.kind === "custom"
                    ? props.renderers?.[field.type.renderer]
                    : undefined;
                if (field.type?.kind === "custom" && !custom)
                  throw new Error(
                    `Missing Smart Form renderer: ${field.type.renderer}.`,
                  );
                const Custom = custom;
                const optionType =
                  (field.type && "options" in field.type) ||
                  (field.type && "optionsSource" in field.type)
                    ? field.type
                    : undefined;
                const unsortedOptions = optionType
                  ? optionType.optionsSource
                    ? (props.options?.[optionType.optionsSource] ?? [])
                    : (optionType.options ?? [])
                  : [];
                const options =
                  optionType?.sortOptions === false ||
                  (optionType &&
                    "display" in optionType &&
                    optionType.display === "slider")
                    ? unsortedOptions
                    : [...unsortedOptions].sort((a, b) =>
                        a.label.localeCompare(b.label, locale),
                      );
                if (field.type?.kind === "hidden")
                  return (
                    <CiSmartFormWidget
                      key={name}
                      {...renderProps}
                      options={[]}
                    />
                  );
                const side =
                  typeof field.label === "object" &&
                  field.label.position === "side";
                return (
                  <div
                    key={name}
                    data-smart-field={name}
                    className={cn(
                      "grid min-w-0 gap-1.5",
                      side &&
                        "sm:grid-cols-[minmax(8rem,1fr)_2fr] sm:items-start sm:gap-x-4",
                      field.className,
                    )}
                  >
                    <label
                      id={`${fieldId}-label`}
                      htmlFor={fieldId}
                      className={cn("text-sm font-medium", side && "sm:pt-3")}
                    >
                      {label}
                      {field.required && (
                        <span aria-hidden className="ms-1 text-destructive">
                          *
                        </span>
                      )}
                    </label>
                    <div className="grid min-w-0 gap-1.5">
                      {Custom ? (
                        <Custom {...renderProps} />
                      ) : (
                        <CiSmartFormWidget {...renderProps} options={options} />
                      )}
                      {field.description && (
                        <p
                          id={`${fieldId}-description`}
                          className="text-xs text-muted-foreground"
                        >
                          {field.description}
                        </p>
                      )}
                      {error && (
                        <p
                          id={`${fieldId}-error`}
                          role="alert"
                          className="text-sm text-destructive"
                        >
                          {error}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ));
          if (
            !group.rows.some((row) =>
              row.fields.some((name) => {
                const field = fields.get(name);
                return field && ciIsSmartFormFieldVisible(field, values);
              }),
            )
          )
            return null;
          if (groupSpec?.collapsible)
            return (
              <details
                key={group.name}
                open={groupSpec.defaultCollapsed ? undefined : true}
                className={cn(
                  "rounded-lg border border-border p-4",
                  groupSpec.className,
                )}
              >
                <summary className="min-h-11 cursor-pointer text-sm font-semibold focus-visible:ring-2 focus-visible:ring-ring">
                  {groupSpec.label ?? (
                    <span className="sr-only">Toggle {group.name} fields</span>
                  )}
                </summary>
                <div className="grid gap-4 pt-3">{content}</div>
              </details>
            );
          return (
            <section
              key={group.name}
              aria-labelledby={
                groupSpec?.label ? `${id}-group-${group.name}` : undefined
              }
              className={cn("grid gap-4", groupSpec?.className)}
            >
              {groupSpec?.label && (
                <h3
                  id={`${id}-group-${group.name}`}
                  className="text-sm font-semibold"
                >
                  {groupSpec.label}
                </h3>
              )}
              {content}
            </section>
          );
        })}
      </div>
      <fieldset disabled={disabled} className="min-w-0">
        {props.children}
      </fieldset>
      {spec.errors?.placement === "bottom" && alert}
      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        {buttons.map((button) => (
          <Button
            key={button.id}
            type={isSubmit(button) ? "submit" : "button"}
            data-smart-button={button.id}
            variant={
              button.type === "delete"
                ? "destructive"
                : button.type === "cancel"
                  ? "outline"
                  : "default"
            }
            disabled={disabled || button.disabled}
            aria-busy={pending === button.id}
            className={cn("min-h-11", button.className)}
            onClick={isSubmit(button) ? undefined : () => void run(button)}
          >
            {pending === button.id
              ? (props.animations?.[button.animation ?? "spinner"] ?? (
                  <LoaderCircle
                    aria-hidden
                    className="size-4 animate-spin motion-reduce:animate-none"
                  />
                ))
              : button.icon
                ? (props.icons?.[button.icon] ?? (
                    <span aria-hidden>
                      <CiIcon name={button.icon} className="size-4" />
                    </span>
                  ))
                : null}
            {pending === button.id
              ? (button.pendingLabel ?? "Working...")
              : button.label}
          </Button>
        ))}
      </div>
      <span role="status" className="sr-only">
        {pending
          ? "Processing form. Please wait..."
          : success
            ? "Form action completed."
            : ""}
      </span>
      {pending && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/70 backdrop-blur-[1px]"
          aria-hidden
        >
          <div className="flex items-center gap-2 rounded-md border border-border bg-background px-4 py-3 text-sm shadow-sm">
            <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
            Processing form. Please wait...
          </div>
        </div>
      )}
    </form>
  );
}
