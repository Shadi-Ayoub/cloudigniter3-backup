import type { CiResponse, CiErrorBody, CiErrorStatus } from "../../";

export function ciIsResponseError<Ok>(
  r: CiResponse<Ok, CiErrorBody, 200, CiErrorStatus>,
): r is Extract<
  CiResponse<Ok, CiErrorBody, 200, CiErrorStatus>,
  { ok: false }
> {
  return r.ok === false;
}
