import type { CiDataTableSortSpec } from "../../../../types";

const CREATION_DATE_COLUMN_IDS = new Set([
  "created",
  "createdat",
  "creationdate",
]);

/** Resolves explicit sorting or the default newest-created-resource ordering. */
export function ciResolveDataTableInitialSorting(
  columnIds: readonly (string | undefined)[],
  explicitInitial: readonly CiDataTableSortSpec[] | undefined,
  enabled = true,
): CiDataTableSortSpec[] {
  if (!enabled) return [];
  if (explicitInitial !== undefined) return [...explicitInitial];

  const creationDateColumnId = columnIds.find((columnId) =>
    columnId
      ? CREATION_DATE_COLUMN_IDS.has(
          columnId.toLocaleLowerCase().replaceAll(/[-_\s.]/g, ""),
        )
      : false,
  );
  return creationDateColumnId
    ? [{ id: creationDateColumnId, desc: true }]
    : [];
}
