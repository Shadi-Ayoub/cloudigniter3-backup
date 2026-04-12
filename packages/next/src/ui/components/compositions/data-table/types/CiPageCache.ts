import type { CiCursorPage } from './CiCursorPage';

export type CiPageCache<T> = Map<string, CiCursorPage<T>>;
