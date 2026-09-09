import type { ComponentType, ReactNode } from "react";
import type {
  CiCompiledSmartForm,
  CiErrorPayload,
  CiSmartFormButtonSpec,
  CiSmartFormFieldSpec,
  CiSmartFormOption,
  CiSmartFormSpec,
  CiSmartFormTemplate,
  CiSmartFormValues,
} from "@cloudigniter/core/types";

export type CiSmartFormFieldRenderProps<T extends object = CiSmartFormValues> =
  {
    field: CiSmartFormFieldSpec<T>;
    id: string;
    value: unknown;
    values: T;
    disabled: boolean;
    readOnly: boolean;
    error?: string;
    describedBy?: string;
    onChange: (value: unknown) => void;
    onBlur: () => void;
    /** Report draft/parse failures that must block submission. */
    onError: (message?: string) => void;
  };
export type CiSmartFormActionContext<T extends object = CiSmartFormValues> = {
  values: T;
  button: CiSmartFormButtonSpec;
  reset: () => void;
  setFieldError: (name: Extract<keyof T, string>, message: string) => void;
};
export type CiSmartFormProps<T extends object = CiSmartFormValues> = {
  /** Authoritative platform definition. A fixed core ignores all override inputs. */
  coreForm?: CiCompiledSmartForm<T>;
  /** Precompiled build artifact. No specification/layout compilation on this path. */
  definition?: CiCompiledSmartForm<T>;
  specifications?: CiSmartFormSpec<T>;
  template?: CiSmartFormTemplate<T>;
  /** Initial record. Change the component key to load another record or discard edits. */
  data?: Partial<T>;
  disabled?: boolean;
  /** Per-instance action labels and availability, such as administrator wording. */
  buttonState?: Readonly<
    Record<
      string,
      { label?: string; pendingLabel?: string; disabled?: boolean }
    >
  >;
  /** Per-record presentation/capability state; never an authorization boundary. */
  fieldState?: Partial<
    Record<
      Extract<keyof T, string>,
      { disabled?: boolean; readOnly?: boolean; hidden?: boolean }
    >
  >;
  className?: string;
  locale?: string;
  callbacks?: Readonly<
    Record<
      string,
      (context: CiSmartFormActionContext<T>) => void | Promise<void>
    >
  >;
  onSubmit?: (
    values: T,
    context: CiSmartFormActionContext<T>,
  ) => void | Promise<void>;
  onValuesChange?: (values: T) => void;
  onError?: (error: CiErrorPayload) => void;
  renderers?: Readonly<
    Record<string, ComponentType<CiSmartFormFieldRenderProps<T>>>
  >;
  validators?: Readonly<
    Record<
      string,
      (
        value: unknown,
        values: T,
      ) => string | undefined | Promise<string | undefined>
    >
  >;
  options?: Readonly<Record<string, readonly CiSmartFormOption[]>>;
  icons?: Readonly<Record<string, ReactNode>>;
  animations?: Readonly<Record<string, ReactNode>>;
  /** Domain controls (for example scoped assignments), inside the form before its buttons. */
  children?: ReactNode;
};
