import type { CiResponse } from "@ci-core/types";

export function ciIsGraphqlResponse<Ok, Err extends object>(
  x: unknown,
): x is CiResponse<Ok, Err> {
  return !!x && typeof x === "object" && "statusCode" in x && "body" in x;
}
