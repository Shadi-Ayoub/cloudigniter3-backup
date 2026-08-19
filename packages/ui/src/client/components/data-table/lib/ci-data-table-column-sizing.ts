const DEFAULT_MIN_COLUMN_SIZE = 72;
const DEFAULT_MAX_COLUMN_SIZE = 480;
const CELL_CHROME_WIDTH = 40;

/** Converts scalar accessor values into useful sizing text without serializing records. */
function getSizingText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(getSizingText).join(", ");
  if (typeof value === "object" || typeof value === "function") return "";
  return String(value);
}

/** Estimates rendered text width closely enough to weight fluid table columns. */
function estimateTextWidth(value: unknown): number {
  let width = 0;
  for (const character of getSizingText(value)) {
    if (/\s/.test(character)) width += 4;
    else if (/[ilI1.,'`|:;]/.test(character)) width += 4.5;
    else if (/[MW@#%&]/.test(character)) width += 10;
    else if (character.codePointAt(0)! > 0x7f) width += 12;
    else width += 7.5;
  }
  return width;
}

export type CiEstimateDataTableColumnSizeInput = {
  header?: unknown;
  values: readonly unknown[];
  minSize?: number;
  maxSize?: number;
};

/**
 * Produces a deterministic content-weighted initial width for a data column.
 * Explicit and persisted TanStack widths remain authoritative in CiDataTable.
 */
export function ciEstimateDataTableColumnSize({
  header,
  values,
  minSize = DEFAULT_MIN_COLUMN_SIZE,
  maxSize = DEFAULT_MAX_COLUMN_SIZE,
}: CiEstimateDataTableColumnSizeInput): number {
  const lowerBound = Math.max(0, minSize);
  const upperBound = Math.max(lowerBound, maxSize);
  const contentWidth = Math.max(
    estimateTextWidth(header),
    ...values.map(estimateTextWidth),
  );

  return Math.min(
    upperBound,
    Math.max(lowerBound, Math.ceil(contentWidth + CELL_CHROME_WIDTH)),
  );
}
