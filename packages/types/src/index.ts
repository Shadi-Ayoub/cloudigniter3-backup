export type CiJsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: CiJsonValue }
  | CiJsonValue[];

export type CiResult<TData = unknown> =
  | { ok: true; statusCode: 200; data: TData }
  | { ok: false; statusCode: 400 | 401 | 403 | 404 | 500; error: string; raw?: unknown };
