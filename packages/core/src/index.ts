import type { CiResult } from '@cloudigniter/types';

export function ciOk200<TData>(data: TData): CiResult<TData> {
  return { ok: true, statusCode: 200, data };
}

export function ciError500(error: string, raw?: unknown): CiResult<never> {
  return { ok: false, statusCode: 500, error, raw };
}
