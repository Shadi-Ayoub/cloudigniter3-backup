import type {
  CiApiResultUnion,
  CiErrorBody,
  CiErrorStatus,
  CiResponse,
} from "@ci-core/types";

export function ciIsGraphqlError(
  result: CiApiResultUnion,
): result is CiResponse<never, CiErrorBody, 200, CiErrorStatus> & {
  ok: false;
} {
  return !result.ok;
}
