import { cookies, headers } from "next/headers";

import {
  ciReadTenantFromHeaders,
  ciResolveEnv,
} from "@cloudigniter/core/server";
import type { CiDevBeaconProps } from "@cloudigniter/core/types";
import { CiDevBeaconClient } from "@ci-next/ui/client"; // Client boundary: DOM measurement + UI rendering
import type { CiNextPageConfig } from "@ci-next/types";

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
  locale,
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
  const resolvedEnv = ciResolveEnv(env);

  // Visibility gate: keep DevBeacon completely out of the tree when disabled.
  const isVisible =
    visibleWhenEnv === null ||
    String(visibleWhenEnv).toLowerCase() === String(resolvedEnv).toLowerCase();

  if (!isVisible) return null;

  // IMPORTANT: `headers()` and `cookies()` are async in recent Next.js versions.
  const [requestHeaders, requestCookies] = await Promise.all([
    headers(),
    cookies(),
  ]);

  const tenant = ciReadTenantFromHeaders(requestHeaders, requestCookies);
  // const tenant = await readTenantFromHeaders(appPageConfig.headers ?? {});

  // Pass only plain (serializable) values into the Client boundary.
  return (
    <CiDevBeaconClient
      locale={locale}
      dir={dir}
      languageDiagnosticsEndpoint={"/ci-internal/language"}
      position={position}
      env={resolvedEnv}
      defaultTab={defaultTab}
      logo={logo}
      extraTabSpecs={extraTabSpecs}
      viewportTopOffset={viewportTopOffset}
      viewportBottomOffset={viewportBottomOffset}
      tenant={tenant}
    />
  );
}
