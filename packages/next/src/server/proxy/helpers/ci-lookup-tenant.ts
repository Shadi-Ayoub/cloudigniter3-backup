import { ciCall } from "@cloudigniter/core";

import type {
  CiEnvMode,
  CiErrorBody,
  CiGetTenantBySlugInterface,
  CiRequest,
  CiTenantLookupBySlugOkBody,
  CiTenantLookupBySlugNotFoundBody,
  CiTenantRoutingOptions,
} from "@cloudigniter/core/types";

/**
 * Body shape that may leak from validation-oriented endpoints/utilities.
 *
 * If this shape is ever returned from the tenant lookup endpoint,
 * the lookup is treated as a fail-safe "not found" result.
 */
type CiValidationErrorBody = {
  error: string;
  fieldErrors?: Record<string, string>;
};

/**
 * Allowed successful lookup body shapes returned by the tenant lookup endpoint.
 */
type CiTenantLookupBody =
  | CiTenantLookupBySlugOkBody
  | CiTenantLookupBySlugNotFoundBody;

/**
 * Resolves tenant existence and status through an internal server endpoint.
 *
 * This helper is proxy-safe because it delegates tenant validation
 * to a server endpoint instead of performing direct data access inside proxy.
 *
 * Fail-safe behavior:
 * - Never throws
 * - Returns `{ exists: false, slug }` on any error or invalid response
 *
 * @param req - The active runtime request object (Fetch API `Request` or compatible).
 * @param tenant - Raw tenant identifier extracted from host/path resolution.
 * @param opts - Fully resolved tenant routing options.
 * @returns A normalized tenant lookup result.
 */
export async function ciLookupTenant(
  req: Request,
  tenant: string,
  opts: Required<CiTenantRoutingOptions>,
): Promise<CiTenantLookupBySlugOkBody | CiTenantLookupBySlugNotFoundBody> {
  const slug = (tenant ?? "").trim().toLowerCase();

  if (!slug) {
    return { exists: false, slug: "" };
  }

  if (!opts.lookupPath) {
    return { exists: false, slug };
  }

  const url = new URL(req.url);
  url.pathname = opts.lookupPath;
  url.search = "";

  const envMode = (process.env.NEXT_PUBLIC_CI_ENV_MODE ?? "test") as CiEnvMode;

  try {
    const ciReq: CiRequest<CiGetTenantBySlugInterface> = {
      input: { slug },
      envMode,
    };

    const result = await ciCall<
      CiGetTenantBySlugInterface,
      CiTenantLookupBody | CiValidationErrorBody
    >(url.toString(), ciReq, {
      headers: {
        cookie: req.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    if (!result.ok) {
      return { exists: false, slug };
    }

    const body: CiTenantLookupBody | CiValidationErrorBody | CiErrorBody =
      result.response.body;

    if (ciIsValidationErrorBody(body)) {
      return { exists: false, slug };
    }

    if (ciIsErrorBody(body)) {
      return { exists: false, slug };
    }

    if (body.exists === false) {
      return {
        exists: false,
        slug: body.slug ?? slug,
      };
    }

    return body;
  } catch {
    return { exists: false, slug };
  }
}

/**
 * Returns true when the payload matches a validation-style error body.
 */
function ciIsValidationErrorBody(
  value: unknown,
): value is CiValidationErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error?: unknown }).error === "string" &&
    (!("fieldErrors" in value) ||
      typeof (value as { fieldErrors?: unknown }).fieldErrors === "object")
  );
}

/**
 * Returns true when the payload matches the standard CloudIgniter error body shape.
 */
function ciIsErrorBody(value: unknown): value is CiErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error?: unknown }).error === "string"
  );
}
