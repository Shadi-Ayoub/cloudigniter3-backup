import type {
  CiDevBeaconProps,
  CiDevBeaconTenantInfo,
  CiEnvMode,
  CiTenantScope,
} from "@cloudigniter/core/types";
import { CiDevBeaconWrapper } from "@ci-next/ui/client"; // Client boundary: DOM measurement + UI rendering
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
 * Read tenant context emitted by middleware.
 * IMPORTANT: `headers()` is async in recent Next.js versions.
 * Adjust header names to match your middleware conventions.
 */
async function readTenantFromHeaders(
  headers: Record<string, string>,
): Promise<CiDevBeaconTenantInfo> {
  return {
    id: headers["x-ci-tenant-id"] ?? undefined,
    slug: headers["x-ci-tenant-slug"] ?? undefined,
    name: headers["x-ci-tenant-name"] ?? undefined,
    status: headers["x-ci-tenant-status"] ?? undefined,
    type: headers["x-ci-tenant-type"] ?? undefined,
    source: "headers",
    scope: (headers["x-ci-tenant-scope"] as CiTenantScope) ?? undefined,
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
  corePageConfig,
  dir = "ltr",
  position = "bottom-right",
  visibleWhenEnv = "development",
  env,
  defaultTab = "status",
  logo = { kind: "default" },
  extraTabSpecs = [],
  viewportTopOffset = "120px",
  viewportBottomOffset = "0px",
}: CiDevBeaconProps) {
  const resolvedEnv = resolveEnv(env);

  // Visibility gate: keep DevBeacon completely out of the tree when disabled.
  const isVisible =
    visibleWhenEnv === null ||
    String(visibleWhenEnv).toLowerCase() === String(resolvedEnv).toLowerCase();

  if (!isVisible) return null;

  const tenant = await readTenantFromHeaders(corePageConfig.headers ?? {});

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
