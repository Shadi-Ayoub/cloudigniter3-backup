import type {
  CiErrorBody,
  CiErrorStatus,
  CiJsonValue,
  CiResponse,
} from "@/types";

type CiApiRawPayload = {
  raw: {
    rawByKey: Record<string, unknown>;
    tenantId: string;
    keys: string[];
    visibility: CiJsonValue;
  };
};

type CiApiResultUnion = CiResponse<
  CiApiRawPayload,
  CiErrorBody,
  200,
  CiErrorStatus
>;

export function ciIsGraphqlError(
  result: CiApiResultUnion,
): result is CiResponse<never, CiErrorBody, 200, CiErrorStatus> & {
  ok: false;
} {
  return !result.ok;
}
