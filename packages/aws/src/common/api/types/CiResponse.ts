import type {
  CiErrorBody,
  CiErrorStatus,
  CiOkStatus,
} from "@cloudigniter/core";
import type { CiResponseMeta } from "./CiResponseMeta";

// All CI Client queries should receive results as a CiResponse object across all the application
export type CiResponse<
  Ok = unknown,
  Err extends object = CiErrorBody,
  OkS extends CiOkStatus = 200,
  ErrS extends CiErrorStatus = CiErrorStatus,
  Meta extends object = CiResponseMeta,
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
