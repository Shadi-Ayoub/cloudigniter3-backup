import type {
  CiCompiledSmartForm,
  CiSmartFormDataMap,
  CiSmartFormFieldSpec,
  CiSmartFormSpec,
  CiSmartFormSpecExtension,
  CiSmartFormTemplate,
  CiSmartFormTemplateExtension,
  CiSmartFormValues,
} from "../../types/smart-form-types";

const unsafeKeys = new Set(["__proto__", "prototype", "constructor"]);
const fieldKinds = new Set([
  "text",
  "password",
  "email",
  "tel",
  "url",
  "search",
  "number",
  "range",
  "date",
  "datetime-local",
  "time",
  "month",
  "week",
  "color",
  "hidden",
  "textarea",
  "boolean",
  "checkbox",
  "singleSelect",
  "select",
  "radio",
  "multiSelect",
  "jsonEditor",
  "custom",
]);
function assertName(name: string, context: string) {
  if (
    typeof name !== "string" ||
    !/^[A-Za-z][A-Za-z0-9]*$/.test(name) ||
    unsafeKeys.has(name)
  ) {
    throw new Error(
      `Invalid ${context} "${name}". Use a letter followed by letters/digits (camelCase recommended).`,
    );
  }
}
function assertUnique(names: readonly string[], context: string) {
  if (new Set(names).size !== names.length)
    throw new Error(`Duplicate ${context}.`);
}
/** Clone JSON without executing callbacks, invoking toJSON, or sharing mutable defaults. */
function clone<T>(value: T): T {
  if (
    value === undefined ||
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  )
    return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value))
    return value.map((item: unknown) => clone(item)) as T;
  if (
    typeof value !== "object" ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new Error(
      "Smart Form specifications must contain JSON values; bind callbacks and components by registry key.",
    );
  }
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (unsafeKeys.has(key))
      throw new Error(`Unsafe Smart Form property: ${key}.`);
    if (item !== undefined) result[key] = clone(item);
  }
  return result as T;
}
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
function mergeNamed<T extends object>(
  base: readonly T[],
  patches: readonly (Partial<T> & { remove?: boolean })[],
  key: keyof T,
): T[] {
  assertUnique(
    patches.map((item) => String(item[key])),
    `extension ${String(key)}`,
  );
  const result = base.map(clone);
  for (const patch of patches) {
    const index = result.findIndex((item) => item[key] === patch[key]);
    if (patch.remove) {
      if (index >= 0) result.splice(index, 1);
      continue;
    }
    const { remove: _, ...values } = clone(patch);
    const previous = index >= 0 ? result[index] : undefined;
    const merged = { ...previous, ...values } as T;
    // Only plain property bags merge deeply. A type change replaces its entire union member.
    for (const name of ["props", "validation", "errors"] as const) {
      if (previous && name in previous && name in values) {
        const before: unknown = Reflect.get(previous, name);
        const after: unknown = Reflect.get(values, name);
        if (
          before &&
          after &&
          typeof before === "object" &&
          typeof after === "object"
        ) {
          Object.assign(merged, { [name]: { ...before, ...after } });
        }
      }
    }
    if (index >= 0) result[index] = merged;
    else result.push(merged);
  }
  return result;
}

export function ciMergeSmartFormSpecifications<
  T extends object = CiSmartFormValues,
>(
  core: CiSmartFormSpec<T>,
  extension: CiSmartFormSpecExtension<T>,
): CiSmartFormSpec<T> {
  if (core.category === "fixed") return clone(core);
  if (extension.groups?.some((group) => group.name === "main"))
    throw new Error('The "main" group is reserved for CloudIgniter.');
  const { fields, groups, buttons, ...rest } = extension;
  const merged = {
    ...clone(core),
    ...clone(rest),
    id: core.id,
    category: core.category,
    errors: { ...core.errors, ...rest.errors },
    fields: mergeNamed(core.fields, fields ?? [], "name"),
    groups: mergeNamed(core.groups ?? [], groups ?? [], "name"),
    buttons: mergeNamed(core.buttons ?? [], buttons ?? [], "id"),
  };
  // Also validates newly added buttons and references without requiring a template.
  ciCompileSmartForm(merged);
  return merged;
}

export function ciMergeSmartFormTemplates<T extends object = CiSmartFormValues>(
  core: CiSmartFormTemplate<T>,
  extension: CiSmartFormTemplateExtension<T>,
): CiSmartFormTemplate<T> {
  const result = clone(core);
  assertUnique(
    extension.groups.map((group) => group.name),
    "template extension group",
  );
  let groups = [...result.groups];
  for (const patch of extension.groups) {
    const previous = groups.find((group) => group.name === patch.name);
    if (patch.remove) {
      if (patch.name === "main")
        throw new Error('The "main" group cannot be removed.');
      groups = groups.filter((group) => group.name !== patch.name);
      continue;
    }
    const rows = mergeNamed(previous?.rows ?? [], patch.rows ?? [], "id");
    const next = { name: patch.name, rows };
    if (previous)
      groups = groups.map((group) => (group === previous ? next : group));
    else groups.push(next);
  }
  return {
    ...result,
    ...(extension.className !== undefined
      ? { className: extension.className }
      : {}),
    groups,
  };
}

export function ciCompileSmartForm<T extends object = CiSmartFormValues>(
  specifications: CiSmartFormSpec<T>,
  template?: CiSmartFormTemplate<T>,
): CiCompiledSmartForm<T> {
  const spec = clone(specifications);
  if (!spec.id?.trim()) throw new Error("A Smart Form id is required.");
  if (spec.category && !["fixed", "customizable"].includes(spec.category))
    throw new Error("Invalid form category.");
  assertUnique(
    spec.fields.map((field) => field.name),
    "field name",
  );
  assertUnique(
    (spec.groups ?? []).map((group) => group.name),
    "group name",
  );
  assertUnique(
    (spec.buttons ?? []).map((button) => button.id),
    "button id",
  );
  const groups = [
    { name: "main" },
    ...(spec.groups ?? []).filter((group) => group.name !== "main"),
  ];
  const main = spec.groups?.find((group) => group.name === "main");
  if (main) groups[0] = main;
  groups.forEach((group) => assertName(group.name, "group name"));
  const groupNames = new Set(groups.map((group) => group.name));
  const fieldByName = new Map(spec.fields.map((field) => [field.name, field]));
  for (const field of spec.fields) {
    assertName(field.name, "field name");
    if (!groupNames.has(field.group ?? "main"))
      throw new Error(`Unknown group for ${field.name}: ${field.group}.`);
    if (field.visibleWhen && !fieldByName.has(field.visibleWhen.field))
      throw new Error(`Unknown condition field: ${field.visibleWhen.field}.`);
    if (field.validation?.pattern) new RegExp(field.validation.pattern);
    const type = field.type;
    if (type && !fieldKinds.has(type.kind))
      throw new Error(`Unknown field type for ${field.name}.`);
    if (type && "display" in type && type.display) {
      const allowed =
        type.kind === "boolean" || type.kind === "checkbox"
          ? ["switch", "radio", "checkbox"]
          : type.kind === "multiSelect"
            ? ["dropdown", "checkbox", "chips"]
            : ["dropdown", "radio", "slider"];
      if (!allowed.includes(type.display))
        throw new Error(`Invalid field display for ${field.name}.`);
    }
    if (type && "options" in type && type.options) {
      assertUnique(
        type.options.map((option) => JSON.stringify(option.value)),
        `option value in ${field.name}`,
      );
      for (const option of type.options) {
        if (
          !["string", "number", "boolean"].includes(typeof option.value) ||
          typeof option.label !== "string"
        )
          throw new Error(`Invalid option for ${field.name}.`);
      }
    }
    if (
      type &&
      (type.kind === "boolean" || type.kind === "checkbox") &&
      (type.trueOption?.value ?? true) === (type.falseOption?.value ?? false)
    ) {
      throw new Error(
        `Boolean ${field.name} needs distinct true and false values.`,
      );
    }
    if (type?.kind === "custom" && !type.renderer)
      throw new Error(`Missing renderer for ${field.name}.`);
    for (const key of Object.keys(field.props ?? {})) {
      if (
        /^on/i.test(key) ||
        [
          "value",
          "checked",
          "defaultValue",
          "defaultChecked",
          "name",
          "id",
          "type",
          "required",
          "disabled",
          "readOnly",
          "children",
          "dangerouslySetInnerHTML",
          "form",
          "formAction",
        ].includes(key)
      ) {
        throw new Error(
          `Field ${field.name} cannot override managed prop ${key}.`,
        );
      }
    }
  }
  for (const button of spec.buttons ?? []) {
    if (
      !button.id ||
      !button.label ||
      !["create", "update", "save", "delete", "cancel", "custom"].includes(
        button.type,
      )
    )
      throw new Error("Buttons require id, label, and a valid type.");
  }
  assertUnique(
    (template?.groups ?? []).map((group) => group.name),
    "template group",
  );
  const placed = new Set<string>();
  for (const group of template?.groups ?? []) {
    if (!groupNames.has(group.name))
      throw new Error(`Unknown template group: ${group.name}.`);
    assertUnique(
      group.rows.map((row) => row.id),
      `row id in ${group.name}`,
    );
    for (const row of group.rows) {
      if (
        !row.id ||
        !Array.isArray(row.fields) ||
        (row.columns && ![1, 2, 3, 4].includes(row.columns))
      )
        throw new Error(`Invalid template row: ${row.id}.`);
      for (const name of row.fields) {
        const field = fieldByName.get(name);
        if (!field) throw new Error(`Unknown template field: ${name}.`);
        if (placed.has(name))
          throw new Error(`Duplicate template field: ${name}.`);
        if ((field.group ?? "main") !== group.name)
          throw new Error(
            `Template field ${name} belongs to group ${field.group ?? "main"}.`,
          );
        placed.add(name);
      }
    }
  }
  groups.sort((a, b) =>
    a.name === "main"
      ? -1
      : b.name === "main"
        ? 1
        : (a.order ?? 0) - (b.order ?? 0),
  );
  const resolvedTemplate: CiSmartFormTemplate<T> = {
    className: template?.className,
    groups: groups.map((group) => {
      const rows = [
        ...(template?.groups.find((item) => item.name === group.name)?.rows ??
          []),
      ].map(clone);
      const ids = new Set(rows.map((row) => row.id));
      for (const field of spec.fields) {
        if ((field.group ?? "main") === group.name && !placed.has(field.name)) {
          let id = `field${field.name}`;
          while (ids.has(id)) id += "Auto";
          ids.add(id);
          rows.push({ id, fields: [field.name], columns: 1 });
        }
      }
      return { name: group.name, rows };
    }),
  };
  return freeze(
    clone({
      version: 1 as const,
      specifications: { ...spec, groups },
      template: resolvedTemplate,
    }),
  );
}

const cache = new WeakMap<
  object,
  {
    defaultForm?: CiCompiledSmartForm;
    templates: WeakMap<object, CiCompiledSmartForm>;
  }
>();
/** Identity cache for module-level definitions. Replace objects to invalidate in development. */
export function ciDefineSmartForm<T extends object = CiSmartFormValues>(
  specifications: CiSmartFormSpec<T>,
  template?: CiSmartFormTemplate<T>,
): CiCompiledSmartForm<T> {
  let entries = cache.get(specifications);
  if (!entries) {
    entries = { templates: new WeakMap() };
    cache.set(specifications, entries);
  }
  const cached = template
    ? entries.templates.get(template)
    : entries.defaultForm;
  if (cached) return cached as CiCompiledSmartForm<T>;
  const compiled = ciCompileSmartForm(specifications, template);
  if (template)
    entries.templates.set(template, compiled as CiCompiledSmartForm);
  else entries.defaultForm = compiled as CiCompiledSmartForm;
  return compiled;
}

/** Accepts an API/lambda/store record. Only mapped own properties are read. */
export function ciMapSmartFormData<
  TSource,
  TValues extends object = CiSmartFormValues,
>(
  source: TSource,
  mapping: CiSmartFormDataMap<TSource, TValues>,
): Partial<TValues> {
  const result: Record<string, unknown> = {};
  for (const [name, rule] of Object.entries(mapping)) {
    assertName(name, "mapped field name");
    if (typeof rule === "function") {
      result[name] = rule(source);
      continue;
    }
    if (rule === undefined) continue;
    if (
      typeof rule !== "string" &&
      (rule === null ||
        typeof rule !== "object" ||
        !("path" in rule) ||
        typeof rule.path !== "string")
    )
      throw new Error(`Invalid data mapping for ${name}.`);
    const path = typeof rule === "string" ? rule : rule.path;
    if (typeof path !== "string")
      throw new Error(`Invalid data path for ${name}.`);
    let value: unknown = source;
    for (const segment of path.split(".")) {
      if (!segment || unsafeKeys.has(segment))
        throw new Error(`Unsafe data path: ${path}.`);
      value =
        value !== null &&
        typeof value === "object" &&
        Object.hasOwn(value, segment)
          ? Reflect.get(value, segment)
          : undefined;
    }
    const fallback =
      typeof rule === "object" && "defaultValue" in rule
        ? rule.defaultValue
        : undefined;
    if (value !== undefined || fallback !== undefined)
      result[name] = value === undefined ? fallback : value;
  }
  return result as Partial<TValues>;
}

export function ciSmartFormInitialValues<T extends object = CiSmartFormValues>(
  spec: CiSmartFormSpec<T>,
  data: Partial<T> = {},
): T {
  const values: Record<string, unknown> = {};
  for (const field of spec.fields) {
    const type = field.type;
    values[field.name] =
      Object.hasOwn(data, field.name) && data[field.name] !== undefined
        ? data[field.name]
        : field.defaultValue !== undefined
          ? clone(field.defaultValue)
          : type?.kind === "boolean" || type?.kind === "checkbox"
            ? (type.falseOption?.value ?? false)
            : type?.kind === "multiSelect"
              ? []
              : "";
  }
  return values as T;
}

export function ciIsSmartFormFieldVisible<T extends object>(
  field: CiSmartFormFieldSpec<T>,
  values: T,
): boolean {
  const condition = field.visibleWhen;
  if (!condition) return true;
  return (
    (condition.equals === undefined ||
      JSON.stringify(values[condition.field]) ===
        JSON.stringify(condition.equals)) &&
    (condition.notEquals === undefined ||
      JSON.stringify(values[condition.field]) !==
        JSON.stringify(condition.notEquals))
  );
}

/** Generate a static module at build time. Never pass record data or runtime registries. */
export function ciGenerateSmartFormModule(
  forms: Readonly<Record<string, CiCompiledSmartForm>>,
): string {
  for (const [key, form] of Object.entries(forms)) {
    assertName(key, "form export name");
    ciCompileSmartForm(form.specifications, form.template);
  }
  const members = Object.keys(forms)
    .map((key) => `${key}: CiCompiledSmartForm`)
    .join("; ");
  return `// Generated by CloudIgniter Smart Forms. Do not edit.\nimport type { CiCompiledSmartForm } from "@cloudigniter/core/types";\nfunction freeze<T>(value: T): T {\n  if (value !== null && typeof value === "object") {\n    Object.values(value).forEach(freeze);\n    Object.freeze(value);\n  }\n  return value;\n}\nexport const ciGeneratedSmartForms = freeze<{ ${members} }>(${JSON.stringify(clone(forms), null, 2)});\n`;
}
