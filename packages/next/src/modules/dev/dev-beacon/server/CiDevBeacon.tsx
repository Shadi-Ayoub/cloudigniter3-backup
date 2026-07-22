import { cookies, headers } from "next/headers";

import { ciResolveEnv } from "@cloudigniter/core/server";
import type { CiDevBeaconProps } from "@cloudigniter/core/types";
import { CiDevBeaconClient } from "@ci-next/client"; // Client boundary: DOM measurement + UI rendering
import type { CiNextContext } from "@ci-next/types";

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
  context,
  position = "bottom-right",
  visibleWhenEnv = "development",
  defaultTab = "status",
  logo = { kind: "default" },
  extraTabSpecs = [],
  viewportTopOffset = "120px",
  viewportBottomOffset = "0px",
}: CiDevBeaconProps<CiNextContext>) {
  const resolvedEnv = ciResolveEnv(context.env.mode);

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

  // Pass only plain (serializable) values into the Client boundary.
  return (
    <CiDevBeaconClient
      context={context}
      position={position}
      defaultTab={defaultTab}
      logo={logo}
      extraTabs={extraTabSpecs}
      viewportTopOffset={viewportTopOffset}
      viewportBottomOffset={viewportBottomOffset}
    />
  );
}
