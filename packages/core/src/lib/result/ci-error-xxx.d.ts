import type { CiErrorBody, CiResult, CiJsonValue } from "@ci-core/types";
/**
 * Centralized error helpers to keep responses consistent.
 */
export declare function ciError400<Ok = never>(message: string, details?: CiJsonValue): CiResult<Ok, CiErrorBody, 200, 400>;
export declare function ciError401<Ok = never>(message: string, details?: CiJsonValue): CiResult<Ok, CiErrorBody, 200, 401>;
export declare function ciError403<Ok = never>(message: string, details?: CiJsonValue): CiResult<Ok, CiErrorBody, 200, 403>;
export declare function ciError404<Ok = never>(message: string, details?: CiJsonValue): CiResult<Ok, CiErrorBody, 200, 404>;
export declare function ciError500<Ok = never>(message: string, details?: CiJsonValue): CiResult<Ok, CiErrorBody, 200, 500>;
//# sourceMappingURL=ci-error-xxx.d.ts.map