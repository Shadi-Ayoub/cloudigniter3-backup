import { cookies, headers } from "next/headers";
import {
  CI_DEFAULT_FEATURE_PATHNAME_HEADER_NAME,
  CI_DEFAULT_ORG_UNIT_PATH_HEADER_NAME,
  CI_DEFAULT_TENANT_ID_HEADER_NAME,
  CI_DEFAULT_TENANT_MODE_HEADER_NAME,
  CI_DEFAULT_TENANT_NAME_HEADER_NAME,
  CI_DEFAULT_TENANT_SCOPE_HEADER_NAME,
  CI_DEFAULT_TENANT_SLUG_HEADER_NAME,
  CI_DEFAULT_TENANT_STATUS_HEADER_NAME,
  CI_DEFAULT_TENANT_TYPE_HEADER_NAME,
} from "@cloudigniter/core/lib";
import type {
  CiDevBeaconProps,
  CiDevBeaconTenantInfo,
  CiEnvMode,
  CiTenantMode,
  CiTenantScope,
} from "@cloudigniter/core/types";
import { CiDevBeaconWrapper } from "@ci-next/ui/client"; // Client boundary: DOM measurement + UI rendering
import type { CiNextPageConfig } from "@ci-next/types";
/**
 * Resolve a normalized DevEnv value for gating DevBeacon visibility.
 *
 * Priority:
 * 1) Explicit `input` (caller provided)
 * 2) `NEXT_PUBLIC_RUNTIME_ENV` (CloudIgniter convention; better semantic mapping than NODE_ENV)
 * 3) `NODE_ENV`
 *
 * Notes:
 * - Mapping "test" => "staging" is intentional (common CI pipeline semantics). Adjust if needed.
 */
function resolveEnv(input?: CiEnvMode): CiEnvMode {
  if (input) return input;

  // const raw = (
  //   process.env.NEXT_PUBLIC_RUNTIME_ENV ??
  //   process.env.NODE_ENV ??
  //   "prod"
  // ).toLowerCase();

  // if (raw === "dev" || raw === "development") return "sandbox";
  // if (raw === "stage" || raw === "staging" || raw === "test") return "test";

  return "production";
}

/**
 * Reads diagnostic headers forwarded by proxy/middleware.
 *
 * Only CloudIgniter and application-scoped headers are exposed to the
 * Dev Beacon. Cookies and unrelated request headers are intentionally omitted.
 */
function readForwardedHeaders(requestHeaders: Headers): Record<string, string> {
  const forwardedHeaders: Record<string, string> = {};

  requestHeaders.forEach((value, name) => {
    const normalizedName = name.toLowerCase();

    if (
      normalizedName.startsWith("x-ci-") ||
      normalizedName.startsWith("x-app-")
    ) {
      forwardedHeaders[normalizedName] = value;
    }
  });

  return Object.fromEntries(
    Object.entries(forwardedHeaders).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
}

/**
 * Reads CloudIgniter and application-scoped request cookies for diagnostics.
 */
function readForwardedCookies(requestCookies: {
  getAll(): Array<{
    name: string;
    value: string;
  }>;
}): Record<string, string> {
  const values: Record<string, string> = {};

  for (const { name, value } of requestCookies.getAll()) {
    const normalizedName = name.toLowerCase();

    if (normalizedName.startsWith("ci-") || normalizedName.startsWith("app-")) {
      values[name] = value;
    }
  }

  return Object.fromEntries(
    Object.entries(values).sort(([left], [right]) => left.localeCompare(right)),
  );
}

/**
 * Reads the resolved routing context emitted by proxy/middleware.
 * Adjust header names to match your middleware conventions.
 */
function readTenantFromHeaders(
  requestHeaders: Headers,
  requestCookies: {
    getAll(): Array<{
      name: string;
      value: string;
    }>;
  },
): CiDevBeaconTenantInfo {
  return {
    id: requestHeaders.get(CI_DEFAULT_TENANT_ID_HEADER_NAME) ?? undefined,
    slug: requestHeaders.get(CI_DEFAULT_TENANT_SLUG_HEADER_NAME) ?? undefined,
    name: requestHeaders.get(CI_DEFAULT_TENANT_NAME_HEADER_NAME) ?? undefined,
    status:
      requestHeaders.get(CI_DEFAULT_TENANT_STATUS_HEADER_NAME) ?? undefined,
    type: requestHeaders.get(CI_DEFAULT_TENANT_TYPE_HEADER_NAME) ?? undefined,
    scope: readTenantScope(
      requestHeaders.get(CI_DEFAULT_TENANT_SCOPE_HEADER_NAME),
    ),
    mode: requestHeaders.get(CI_DEFAULT_TENANT_MODE_HEADER_NAME) as
      | CiTenantMode
      | undefined,
    orgUnitPath:
      requestHeaders.get(CI_DEFAULT_ORG_UNIT_PATH_HEADER_NAME) ?? undefined,
    featurePathname:
      requestHeaders.get(CI_DEFAULT_FEATURE_PATHNAME_HEADER_NAME) ?? undefined,
    forwardedHeaders: readForwardedHeaders(requestHeaders),
    forwardedCookies: readForwardedCookies(requestCookies),
    source: "headers",
  };
}

/**
 * DevBeacon (Server Component).
 *
 * Responsibilities:
 * - Apply server-side visibility gating (avoid shipping client UI when not needed).
 * - Normalize and pass only serializable props to the Client wrapper.
 *
 * The Client wrapper (`DevBeaconWrapper`) is responsible for:
 * - DOM measurement (header/footer offsets)
 * - interactive state (open/close, loaded state)
 * - rendering tabs and client-only content (Trace, Monaco, etc.)
 */
export async function CiDevBeacon({
  // appPageConfig,
  dir = "ltr",
  position = "bottom-right",
  visibleWhenEnv = "development",
  env,
  defaultTab = "status",
  logo = { kind: "default" },
  extraTabSpecs = [],
  viewportTopOffset = "120px",
  viewportBottomOffset = "0px",
}: CiDevBeaconProps<CiNextPageConfig>) {
  const resolvedEnv = resolveEnv(env);

  // Visibility gate: keep DevBeacon completely out of the tree when disabled.
  const isVisible =
    visibleWhenEnv === null ||
    String(visibleWhenEnv).toLowerCase() === String(resolvedEnv).toLowerCase();

  // if (!isVisible) return null;

  // IMPORTANT: `headers()` and `cookies()` are async in recent Next.js versions.
  const [requestHeaders, requestCookies] = await Promise.all([
    headers(),
    cookies(),
  ]);

  const tenant = readTenantFromHeaders(requestHeaders, requestCookies);
  // const tenant = await readTenantFromHeaders(appPageConfig.headers ?? {});

  // Pass only plain (serializable) values into the Client boundary.
  return (
    <>
      <CiDevBeaconWrapper
        dir={dir}
        position={position}
        env={resolvedEnv}
        defaultTab={defaultTab}
        logo={logo}
        extraTabSpecs={extraTabSpecs}
        viewportTopOffset={viewportTopOffset}
        viewportBottomOffset={viewportBottomOffset}
        tenant={tenant}
      />
    </>
  );
}

/**
 * Normalizes the tenant scope received from forwarded request headers.
 *
 * Falls back to system scope when the header is absent or invalid.
 */
function readTenantScope(value: string | null): CiTenantScope {
  switch (value) {
    case "global":
    case "tenant":
      return value;

    case "system":
    default:
      return "system";
  }
}
