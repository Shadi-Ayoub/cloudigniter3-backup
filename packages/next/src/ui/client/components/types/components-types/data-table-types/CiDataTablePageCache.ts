import type { CiDataTableCursorPage } from "./CiDataTableCursorPage";

export type CiDataTablePageCache<T> = Map<string, CiDataTableCursorPage<T>>;
