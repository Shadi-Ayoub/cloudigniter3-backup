import type {
  CiResult,
  CiErrorBody,
  CiErrorStatus,
  CiOkStatus,
} from "@ci-core/types";

export function ciIsOkResult<
  Ok,
  Err extends object = CiErrorBody,
  OkS extends CiOkStatus = 200,
  ErrS extends CiErrorStatus = CiErrorStatus,
>(
  result: CiResult<Ok, Err, OkS, ErrS>,
): result is Extract<CiResult<Ok, Err, OkS, ErrS>, { ok: true }> {
  return result.ok === true;
}
