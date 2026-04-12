import type { CiResponse, CiErrorBody, CiErrorStatus } from "../../";

export function ciIsResponseOk<Ok>(
  r: CiResponse<Ok, CiErrorBody, 200, CiErrorStatus>,
): r is Extract<CiResponse<Ok, CiErrorBody, 200, CiErrorStatus>, { ok: true }> {
  return r.ok === true;
}
