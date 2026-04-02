import type { CiResult } from "./types";

export function ciOkResult<Ok>(body: Ok): CiResult<Ok> {
  return {
    ok: true,
    statusCode: 200,
    body,
  };
}
