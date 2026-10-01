import type {
  CiSettingsGroup,
  CiSettingsUpdate,
  CiSmartFormSpec,
  CiSmartFormValues,
} from "@cloudigniter/core/types";

/** One form owns every section's draft, including sections currently out of view. */
export function ciSettingsForm(
  groups: readonly CiSettingsGroup[],
  editing: boolean,
  selected?: string,
) {
  const fieldName = (index: number, name: string) =>
    `group${index}Field${name}`;
  const specifications: CiSmartFormSpec = {
    id: "settings",
    groups: groups.map((group, index) => ({
      name: `group${index}`,
      className: group.id === selected ? undefined : "hidden",
    })),
    fields: groups.flatMap((group, index) =>
      group.fields.map((field) => ({
        ...field,
        name: fieldName(index, field.name),
        label: field.label ?? field.name,
        group: `group${index}`,
        readOnly:
          !editing ||
          field.readOnly ||
          group.lockedFields?.includes(field.name),
        description: group.lockedFields?.includes(field.name)
          ? "Enforced by System. Your saved local value is preserved."
          : field.description,
        visibleWhen: field.visibleWhen
          ? {
              ...field.visibleWhen,
              field: fieldName(index, field.visibleWhen.field),
            }
          : undefined,
      })),
    ),
  };
  const data: CiSmartFormValues = {};
  groups.forEach((group, index) =>
    group.fields.forEach((field) => {
      data[fieldName(index, field.name)] = group.value[field.name];
    }),
  );
  return {
    specifications,
    data,
    invalidGroup(errors: Readonly<Record<string, string>>) {
      return groups.find((group, index) =>
        group.fields.some((field) => errors[fieldName(index, field.name)]),
      )?.id;
    },
    updates(values: CiSmartFormValues): CiSettingsUpdate[] {
      return groups.map((group, index) => ({
        id: group.id,
        revision: group.revision,
        ...(group.systemRevision !== undefined
          ? { systemRevision: group.systemRevision }
          : {}),
        ...(group.enforcement !== undefined
          ? { enforcement: group.enforcement }
          : {}),
        value: {
          ...group.value,
          ...Object.fromEntries(
            group.fields.map((field) => [
              field.name,
              field.readOnly ||
              field.disabled ||
              group.lockedFields?.includes(field.name)
                ? group.value[field.name]
                : values[fieldName(index, field.name)],
            ]),
          ),
        },
      }));
    },
  };
}
