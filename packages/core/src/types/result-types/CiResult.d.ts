import type { CiErrorBody, CiErrorStatus, CiOkStatus } from './';
export type CiResult<Ok = unknown, Err extends object = CiErrorBody, OkS extends CiOkStatus = 200, ErrS extends CiErrorStatus = CiErrorStatus> = {
    ok: true;
    statusCode: OkS;
    body: Ok;
} | {
    ok: false;
    statusCode: ErrS;
    body: Err;
};
//# sourceMappingURL=CiResult.d.ts.map