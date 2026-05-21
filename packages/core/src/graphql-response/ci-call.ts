"use client";

import type { CiEnvMode, CiRequest, CiResponse } from "@/types";

export type CiCallErrorKind =
  | "NETWORK_ERROR"
  | "NON_JSON_RESPONSE"
  | "HTTP_ERROR"
  | "CI_ERROR";

export interface CiCallOk<TBody = unknown> {
  ok: true;
  kind: "OK";
  httpStatus: number;
  response: CiResponse<TBody>;
}

export interface CiCallError {
  ok: false;
  kind: CiCallErrorKind;
  httpStatus: number | null;
  message: string;
  response?: CiResponse | null;
  cause?: unknown;
}

export type CiCallResult<TBody = unknown> = CiCallOk<TBody> | CiCallError;

/**
 * CiCallOptions
 *
 * Optional fetch controls and request customization.
 * First-class scenario: pass correlation/trace headers for end-to-end diagnostics.
 */
export type CiCallOptions = {
  /**
   * HTTP method override.
   * Defaults to 'POST' (to preserve current behavior).
   */
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

  /**
   * Additional headers merged with the default headers.
   * Example: { 'x-ci-correlation-id': crypto.randomUUID() }
   */
  headers?: Record<string, string>;

  /**
   * Abort controller support for long-running calls.
   */
  signal?: AbortSignal;

  /**
   * Common fetch options used with Next.js route handlers.
   */
  cache?: RequestCache;
  credentials?: RequestCredentials;
  mode?: RequestMode;
  redirect?: RequestRedirect;
  referrerPolicy?: ReferrerPolicy;
};

/**
 * call()
 *
 * Standard CloudIgniter client helper:
 * - POSTs a CiRequest<TInput> as JSON by default (method can be overridden).
 * - Expects a CiResponse<TBody> from the route handler.
 * - Distinguishes between:
 *   - NETWORK_ERROR         (fetch threw)
 *   - NON_JSON_RESPONSE     (no/invalid JSON from route)
 *   - HTTP_ERROR            (res.ok === false)
 *   - CI_ERROR              (response.statusCode >= 400)
 */
export async function ciCall<TInput, TBody = unknown>(
  url: string,
  request: CiRequest<TInput>,
  options?: CiCallOptions,
): Promise<CiCallResult<TBody>> {
  let httpStatus: number | null = null;

  // Configured EnvMode (or default) will be injected if not passed with request
  const envMode = (process.env.NEXT_PUBLIC_CI_ENV_MODE ?? "test") as CiEnvMode;

  // Preserve current behavior: default to POST
  const method = options?.method ?? "POST";

  // Merge headers (caller headers win)
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers ?? {}),
  };

  try {
    const httpRes = await fetch(url, {
      method,
      // Keep existing behavior: always send request as JSON.
      // (If you later want GET without body, we can add a conditional safely.)
      body: JSON.stringify({ ...request, envMode: request.envMode ?? envMode }),
      headers,
      signal: options?.signal,
      cache: options?.cache, // ex. cache: 'no-store',
      credentials: options?.credentials,
      mode: options?.mode,
      redirect: options?.redirect,
      referrerPolicy: options?.referrerPolicy,
    });

    httpStatus = httpRes.status;

    // 1) Ensure JSON response
    const contentType = httpRes.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return {
        ok: false,
        kind: "NON_JSON_RESPONSE",
        httpStatus,
        message: `Non-JSON response from ${url}. Content-Type: ${
          contentType || "unknown"
        }`,
        response: null,
      };
    }

    let ciResponse: CiResponse<TBody>;
    try {
      ciResponse = (await httpRes.json()) as CiResponse<TBody>;
    } catch (err) {
      return {
        ok: false,
        kind: "NON_JSON_RESPONSE",
        httpStatus,
        message: `Failed to parse JSON response from ${url}.`,
        response: null,
        cause: err,
      };
    }

    // 2) HTTP-level error (e.g., 500 from route handler, 404, etc.)
    if (!httpRes.ok) {
      const bodyError =
        (ciResponse.body as any)?.error?.toString?.() ??
        `HTTP error while calling ${url}. Status ${httpStatus}`;
      return {
        ok: false,
        kind: "HTTP_ERROR",
        httpStatus,
        message: bodyError,
        response: ciResponse,
      };
    }

    // 3) CI-level error (statusCode >= 400 inside the CiResponse)
    if (ciResponse.statusCode >= 400) {
      const bodyError =
        (ciResponse.body as any)?.error?.toString?.() ??
        `CI error while calling ${url}. statusCode ${ciResponse.statusCode}`;
      return {
        ok: false,
        kind: "CI_ERROR",
        httpStatus,
        message: bodyError,
        response: ciResponse,
      };
    }

    // 4) Everything is OK
    return {
      ok: true,
      kind: "OK",
      httpStatus,
      response: ciResponse,
    };
  } catch (err) {
    // Network / fetch-level failure
    return {
      ok: false,
      kind: "NETWORK_ERROR",
      httpStatus,
      message: `Network or fetch error while calling ${url}.`,
      response: null,
      cause: err,
    };
  }
}
