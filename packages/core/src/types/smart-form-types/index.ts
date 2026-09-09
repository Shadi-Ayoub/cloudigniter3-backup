/** Serializable form definitions; bind executable behavior at the client boundary. */
export type CiSmartFormJson =
  | string
  | number
  | boolean
  | null
  | readonly CiSmartFormJson[]
  | { readonly [key: string]: CiSmartFormJson };
export type CiSmartFormScalar = string | number | boolean;
export type CiSmartFormValues = Record<string, unknown>;
export type CiSmartFormFieldName<T extends object = CiSmartFormValues> =
  Extract<keyof T, string>;

export type CiSmartFormOption = {
  value: CiSmartFormScalar;
  label: string;
  disabled?: boolean;
};
export type CiSmartFormOptions = {
  options?: readonly CiSmartFormOption[];
  /** Key in the per-instance options registry, for permissions/locale/remote data. */
  optionsSource?: string;
  sortOptions?: boolean;
};
export type CiSmartFormFieldType =
  | {
      kind:
        | "text"
        | "password"
        | "email"
        | "tel"
        | "url"
        | "search"
        | "number"
        | "range"
        | "date"
        | "datetime-local"
        | "time"
        | "month"
        | "week"
        | "color"
        | "hidden"
        | "textarea";
    }
  | {
      kind: "boolean" | "checkbox";
      display?: "switch" | "radio" | "checkbox";
      orientation?: "row" | "column";
      trueOption?: CiSmartFormOption;
      falseOption?: CiSmartFormOption;
    }
  | (CiSmartFormOptions & {
      kind: "singleSelect" | "select" | "radio";
      display?: "dropdown" | "radio" | "slider";
      orientation?: "row" | "column";
    })
  | (CiSmartFormOptions & {
      kind: "multiSelect";
      display?: "dropdown" | "checkbox" | "chips";
      orientation?: "row" | "column";
    })
  | { kind: "jsonEditor"; objectOnly?: boolean }
  | { kind: "custom"; renderer: string };

export type CiSmartFormCondition<T extends object = CiSmartFormValues> = {
  field: CiSmartFormFieldName<T>;
  equals?: CiSmartFormJson;
  notEquals?: CiSmartFormJson;
};
export type CiSmartFormFieldSpec<T extends object = CiSmartFormValues> = {
  /** ASCII letter first, then letters/digits only. Prefer camelCase. */
  name: CiSmartFormFieldName<T>;
  group?: string;
  required?: boolean;
  label?: string | { text: string; position?: "top" | "side" };
  type?: CiSmartFormFieldType;
  props?: Readonly<Record<string, CiSmartFormJson>>;
  className?: string;
  description?: string;
  defaultValue?: CiSmartFormJson;
  disabled?: boolean;
  readOnly?: boolean;
  visibleWhen?: CiSmartFormCondition<T>;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    message?: string;
    validator?: string;
  };
};
export type CiSmartFormGroupSpec = {
  name: string;
  label?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
  order?: number;
};
export type CiSmartFormButtonSpec = {
  id: string;
  label: string;
  type: "create" | "update" | "save" | "delete" | "cancel" | "custom";
  /** Key in the callbacks registry; defaults to the button id. */
  callback?: string;
  icon?: string;
  animation?: string;
  className?: string;
  order?: number;
  validate?: boolean;
  pendingLabel?: string;
  disabled?: boolean;
};
export type CiSmartFormSpec<T extends object = CiSmartFormValues> = {
  id: string;
  category?: "customizable" | "fixed";
  title?: string;
  subtitle?: string;
  introduction?: string;
  className?: string;
  direction?: "ltr" | "rtl" | "auto";
  locale?: string;
  fields: readonly CiSmartFormFieldSpec<T>[];
  groups?: readonly CiSmartFormGroupSpec[];
  buttons?: readonly CiSmartFormButtonSpec[];
  errors?: {
    placement?: "top" | "bottom" | "none";
    dismissible?: boolean;
    title?: string;
    validationMessage?: string;
    focusFirstInvalid?: boolean;
  };
};
export type CiSmartFormTemplateRow<T extends object = CiSmartFormValues> = {
  id: string;
  fields: readonly CiSmartFormFieldName<T>[];
  columns?: 1 | 2 | 3 | 4;
  className?: string;
};
export type CiSmartFormTemplate<T extends object = CiSmartFormValues> = {
  className?: string;
  groups: readonly {
    name: string;
    rows: readonly CiSmartFormTemplateRow<T>[];
  }[];
};
export type CiSmartFormSpecExtension<T extends object = CiSmartFormValues> =
  Partial<
    Omit<
      CiSmartFormSpec<T>,
      "id" | "category" | "fields" | "groups" | "buttons"
    >
  > & {
    fields?: readonly (Partial<CiSmartFormFieldSpec<T>> &
      Pick<CiSmartFormFieldSpec<T>, "name"> & { remove?: boolean })[];
    groups?: readonly (Partial<CiSmartFormGroupSpec> &
      Pick<CiSmartFormGroupSpec, "name"> & { remove?: boolean })[];
    buttons?: readonly (Partial<CiSmartFormButtonSpec> &
      Pick<CiSmartFormButtonSpec, "id"> & { remove?: boolean })[];
  };
export type CiSmartFormTemplateExtension<T extends object = CiSmartFormValues> =
  {
    className?: string;
    groups: readonly {
      name: string;
      remove?: boolean;
      rows?: readonly (Partial<CiSmartFormTemplateRow<T>> &
        Pick<CiSmartFormTemplateRow<T>, "id"> & { remove?: boolean })[];
    }[];
  };
export type CiCompiledSmartForm<T extends object = CiSmartFormValues> = {
  readonly version: 1;
  readonly specifications: CiSmartFormSpec<T>;
  readonly template: CiSmartFormTemplate<T>;
};
export type CiSmartFormDataMap<
  TSource,
  TValues extends object = CiSmartFormValues,
> = {
  [K in keyof TValues]?:
    | string
    | { path: string; defaultValue?: TValues[K] }
    | ((source: TSource) => TValues[K]);
};
