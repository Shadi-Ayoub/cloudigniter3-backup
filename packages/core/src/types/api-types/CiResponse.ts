import type { CiErrorBody, CiErrorStatus, CiOkStatus } from "@/types";
import type { CiCoreResponseMeta } from "./CiCoreResponseMeta";

/**
 * Generic CloudIgniter response envelope.
 */
export type CiResponse<
  Ok = unknown,
  Err extends object = CiErrorBody,
  OkS extends CiOkStatus = 200,
  ErrS extends CiErrorStatus = CiErrorStatus,
  Meta extends object = CiCoreResponseMeta,
> = (
  | {
      ok: true;
      statusCode: OkS;
      body: Ok;
    }
  | {
      ok: false;
      statusCode: ErrS;
      body: Err;
    }
) &
  Meta;
