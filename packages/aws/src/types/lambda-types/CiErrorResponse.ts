import type { CiResponse } from "@cloudigniter/core/types";

/**
 * Error-only branch of CiResponse.
 */
export type CiErrorResponse = Extract<CiResponse, { ok: false }>;
