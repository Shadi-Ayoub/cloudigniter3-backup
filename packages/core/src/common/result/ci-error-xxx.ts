import type { CiErrorBody, CiResult, CiJsonValue } from "./types";

/**
 * Centralized error helpers to keep responses consistent.
 */
export function ciError400<Ok = never>(
  message: string,
  details?: CiJsonValue,
): CiResult<Ok, CiErrorBody, 200, 400> {
  return {
    ok: false,
    statusCode: 400,
    body: { error: message, details },
  };
}

export function ciError401<Ok = never>(
  message: string,
  details?: CiJsonValue,
): CiResult<Ok, CiErrorBody, 200, 401> {
  return {
    ok: false,
    statusCode: 401,
    body: { error: message, details },
  };
}

export function ciError403<Ok = never>(
  message: string,
  details?: CiJsonValue,
): CiResult<Ok, CiErrorBody, 200, 403> {
  return {
    ok: false,
    statusCode: 403,
    body: { error: message, details },
  };
}

export function ciError404<Ok = never>(
  message: string,
  details?: CiJsonValue,
): CiResult<Ok, CiErrorBody, 200, 404> {
  return {
    ok: false,
    statusCode: 404,
    body: { error: message, details },
  };
}

export function ciError500<Ok = never>(
  message: string,
  details?: CiJsonValue,
): CiResult<Ok, CiErrorBody, 200, 500> {
  return {
    ok: false,
    statusCode: 500,
    body: { error: message, details },
  };
}
