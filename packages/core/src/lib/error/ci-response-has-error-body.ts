import type { CiResponse } from "@ci-core/types";

export function ciResponseHasErrorBody(
  r: CiResponse,
): r is CiResponse & { body: { error: string } } {
  const body = r.body;
  return (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (body as { error?: unknown }).error === "string"
  );
}
