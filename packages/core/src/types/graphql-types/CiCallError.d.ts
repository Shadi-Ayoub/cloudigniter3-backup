import type { CiResponse } from "@ci-core/types";
import type { CiCallErrorKind } from "./CiCallErrorKind";
export interface CiCallError {
    ok: false;
    kind: CiCallErrorKind;
    httpStatus: number | null;
    message: string;
    response?: CiResponse | null;
    cause?: unknown;
}
//# sourceMappingURL=CiCallError.d.ts.map