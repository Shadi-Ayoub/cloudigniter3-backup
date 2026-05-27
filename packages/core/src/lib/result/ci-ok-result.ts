import type { CiResult } from "@ci-core/types";

export function ciOkResult<Ok>(body: Ok): CiResult<Ok> {
  return {
    ok: true,
    statusCode: 200,
    body,
  };
}
