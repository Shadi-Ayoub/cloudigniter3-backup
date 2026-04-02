import type { CiErrorBody, CiErrorStatus, CiOkStatus } from './';

// “Internal function result” (same union, no meta by default)
// * CiResult: internal/service layer, no meta, no metrics/logs side effects.
// * CiResponse: handler/wire layer, optional CiResponseMeta, metrics/log enrichment.
export type CiResult<
  Ok = unknown,
  Err extends object = CiErrorBody,
  OkS extends CiOkStatus = 200,
  ErrS extends CiErrorStatus = CiErrorStatus,
> =
  | {
      ok: true;
      statusCode: OkS;
      body: Ok;
    }
  | {
      ok: false;
      statusCode: ErrS;
      body: Err;
    };
