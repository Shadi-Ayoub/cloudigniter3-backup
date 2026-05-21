import type { CiErrorBody, CiErrorStatus, CiResponse } from "@/types";
export function ciIsResponseOk<Ok>(
  r: CiResponse<Ok, CiErrorBody, 200, CiErrorStatus>,
): r is Extract<CiResponse<Ok, CiErrorBody, 200, CiErrorStatus>, { ok: true }> {
  return r.ok === true;
}
