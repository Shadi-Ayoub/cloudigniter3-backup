import type { CiErrorBody, CiErrorStatus, CiOkStatus } from "@/types";
import type { CiResponse } from "./CiResponse";
import type { CiResponseMeta } from "./CiResponseMeta";

export type CiResponseWithMeta<
  Ok = unknown,
  Err extends object = CiErrorBody,
  OkS extends CiOkStatus = 200,
  ErrS extends CiErrorStatus = CiErrorStatus,
> = CiResponse<Ok, Err, OkS, ErrS, CiResponseMeta>;
