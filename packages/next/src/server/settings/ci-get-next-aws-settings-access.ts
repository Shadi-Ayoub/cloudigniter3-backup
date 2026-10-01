import { ciErrorResult, ciParseGraphqlResponse } from "@cloudigniter/core/lib";
import type {
  CiGraphQLResponse,
  CiResult,
  CiSettingsManagementAction,
} from "@cloudigniter/core/types";

function failure(
  status: 401 | 403 | 500,
): CiResult<Record<CiSettingsManagementAction, boolean>> {
  if (status === 401)
    return ciErrorResult(401, {
      code: "SETTINGS_SIGN_IN_REQUIRED",
      title: "Please sign in again",
      message:
        "Your session could not be verified. Sign in again to manage your settings.",
      severity: "warning",
      showRetry: false,
    });
  if (status === 403)
    return ciErrorResult(403, {
      code: "SETTINGS_ACCESS_DENIED",
      title: "Settings access restricted",
      message:
        "You don't have permission to manage these settings. Ask a system administrator for access.",
      severity: "warning",
      showRetry: false,
    });
  return ciErrorResult(500, {
    code: "SETTINGS_ACCESS_UNAVAILABLE",
    title: "Settings temporarily unavailable",
    message:
      "We couldn't check your access to Settings. Please try again. If this continues, contact your administrator.",
    severity: "warning",
    showRetry: true,
  });
}

/** Expected access failures are safe results, not server-render exceptions. */
export async function ciGetNextAwsSettingsAccess(
  getAccess: () => Promise<CiGraphQLResponse>,
): Promise<CiResult<Record<CiSettingsManagementAction, boolean>>> {
  let response: CiGraphQLResponse;
  try {
    response = await getAccess();
  } catch {
    return failure(500);
  }
  if (!response || typeof response !== "object" || Array.isArray(response))
    return failure(500);

  // AppSync reports authorization outside its resolver envelope. Do not infer denial
  // from arbitrary backend error messages, which may describe an infrastructure fault.
  if (Array.isArray(response.errors) && response.errors.length) {
    const codes = response.errors.map(
      (error) => error?.errorType ?? error?.extensions?.code,
    );
    if (codes.every((code) => code === "UNAUTHENTICATED")) return failure(401);
    if (
      codes.every((code) =>
        ["Unauthorized", "UnauthorizedException", "FORBIDDEN"].includes(code),
      )
    )
      return failure(403);
    return failure(500);
  }
  const result = ciParseGraphqlResponse(response);
  if (!result.ok)
    return failure(
      result.statusCode === 401 || result.statusCode === 403
        ? result.statusCode
        : 500,
    );
  const body = result.body;
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    !("read" in body) ||
    typeof body.read !== "boolean" ||
    !("update" in body) ||
    typeof body.update !== "boolean" ||
    ("enforce" in body && typeof body.enforce !== "boolean") ||
    ("overwrite" in body && typeof body.overwrite !== "boolean")
  )
    return failure(500);
  if (!body.read) return failure(403);
  return {
    ok: true,
    statusCode: 200,
    body: {
      read: body.read,
      update: body.update,
      enforce: "enforce" in body && body.enforce === true,
      overwrite: "overwrite" in body && body.overwrite === true,
    },
  };
}
