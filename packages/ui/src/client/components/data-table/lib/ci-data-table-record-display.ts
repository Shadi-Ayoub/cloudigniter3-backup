export type CiDataTableRecordField = {
  id: string;
  label: string;
  value?: string;
  children?: CiDataTableRecordField[];
};

const MAX_RECORD_DEPTH = 20;

function isContainer(
  value: unknown
): value is Record<string, unknown> | unknown[] {
  return (
    value !== null && typeof value === "object" && !(value instanceof Date)
  );
}

function formatScalar(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return `${value.toString()}n`;
  if (typeof value === "symbol") return value.toString();
  if (typeof value === "function")
    return `[Function${value.name ? ` ${value.name}` : ""}]`;
  return String(value);
}

function buildField(
  label: string,
  value: unknown,
  path: string,
  ancestors: ReadonlySet<object>,
  depth: number
): CiDataTableRecordField {
  if (!isContainer(value)) {
    return { id: path, label, value: formatScalar(value) };
  }

  if (ancestors.has(value)) {
    return { id: path, label, value: "[Circular]" };
  }

  if (depth >= MAX_RECORD_DEPTH) {
    return { id: path, label, value: "[Maximum depth reached]" };
  }

  const entries = Array.isArray(value)
    ? value.map((item, index) => [`[${index}]`, item] as const)
    : Object.entries(value);

  if (entries.length === 0) {
    return { id: path, label, value: Array.isArray(value) ? "[]" : "{}" };
  }

  const nextAncestors = new Set(ancestors);
  nextAncestors.add(value);

  return {
    id: path,
    label,
    children: entries.map(([childLabel, childValue]) =>
      buildField(
        childLabel,
        childValue,
        `${path}.${childLabel}`,
        nextAncestors,
        depth + 1
      )
    ),
  };
}

/** Builds the nested label/value representation used by the record details view. */
export function ciBuildDataTableRecordFields(
  record: unknown
): CiDataTableRecordField[] {
  if (!isContainer(record)) {
    return [buildField("value", record, "value", new Set(), 0)];
  }

  const entries = Array.isArray(record)
    ? record.map((item, index) => [`[${index}]`, item] as const)
    : Object.entries(record);

  if (entries.length === 0) {
    return [
      {
        id: "record",
        label: "record",
        value: Array.isArray(record) ? "[]" : "{}",
      },
    ];
  }

  const ancestors = new Set<object>([record]);
  return entries.map(([label, value]) =>
    buildField(label, value, label, ancestors, 0)
  );
}

function toJsonSafeValue(
  value: unknown,
  ancestors: ReadonlySet<object>,
  depth: number
): unknown {
  if (value === undefined) return "[undefined]";
  if (typeof value === "bigint") return `${value.toString()}n`;
  if (typeof value === "symbol") return value.toString();
  if (typeof value === "function") {
    return `[Function${value.name ? ` ${value.name}` : ""}]`;
  }
  if (value instanceof Date) return value.toISOString();
  if (!isContainer(value)) return value;
  if (ancestors.has(value)) return "[Circular]";
  if (depth >= MAX_RECORD_DEPTH) return "[Maximum depth reached]";

  const nextAncestors = new Set(ancestors);
  nextAncestors.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => toJsonSafeValue(item, nextAncestors, depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      toJsonSafeValue(item, nextAncestors, depth + 1),
    ])
  );
}

/** Produces stable readable JSON without failing on circular references or bigint values. */
export function ciFormatDataTableRecordJson(record: unknown): string {
  return JSON.stringify(toJsonSafeValue(record, new Set(), 0), null, 2);
}

/** Treats nullish, false, empty arrays, and whitespace-only text as absent descriptions. */
export function ciHasDataTableRecordDescription(description: unknown): boolean {
  if (
    description === null ||
    description === undefined ||
    description === false
  ) {
    return false;
  }
  if (typeof description === "string") return description.trim().length > 0;
  if (Array.isArray(description)) {
    return description.some(ciHasDataTableRecordDescription);
  }
  return true;
}
