import type {
  BeaconPosition,
  BeaconTabValue,
  CiPageConfig,
  CiEnvMode,
  DevBeaconTenantInfo,
  Direction,
  CiTenantScope,
} from '@CI/types';

import { DevBeaconWrapper } from '../dev-beacon-wrapper'; // Client boundary: DOM measurement + UI rendering
import type { DevBeaconExtraTabSpec, DevBeaconLogoSpec } from '../types';

/**
 * Server-side DevBeacon props.
 *
 * IMPORTANT:
 * - This component is a Server Component and MUST only pass serializable (plain) props to the Client wrapper.
 * - Do not pass React elements/functions here (e.g., icons, components, JSX). Use spec types instead.
 */
export interface DevBeaconProps {
  /**
   * CloudIgniter Page configurations passed by the application.
   */
  ciPageConfig: CiPageConfig;

  /**
   * Layout direction for the DevBeacon UI surface.
   * Forwarded to the client wrapper and used to set `dir` on the content container.
   */
  dir?: Direction;

  /**
   * Floating button placement on the viewport (e.g. "bottom-right").
   * Implemented by `DevBeaconButton` positioning classes in the client layer.
   */
  position?: BeaconPosition;

  /**
   * Controls when the DevBeacon renders based on runtime environment.
   * - `null` means "always visible".
   * - Otherwise, DevBeacon renders only when `visibleWhenEnv` matches the resolved `env`.
   */
  visibleWhenEnv?: CiEnvMode | null;

  /**
   * Explicit runtime environment override.
   * If omitted, env is resolved from `NEXT_PUBLIC_RUNTIME_ENV` (preferred) or `NODE_ENV`.
   */
  env?: CiEnvMode;

  /**
   * Default selected tab id when DevBeacon opens.
   * Supports built-in tabs ("status" | "config" | "tools") and custom tab ids (e.g. "trace").
   */
  defaultTab?: BeaconTabValue | string;

  /**
   * SERVER-SAFE logo specification.
   * The client wrapper converts this spec into a React node (e.g. `next/image`),
   * because Server Components cannot pass React elements through a client boundary.
   */
  logo?: DevBeaconLogoSpec;

  /**
   * SERVER-SAFE additional tabs specification.
   * The client wrapper converts specs into concrete `ExtraTab[]` objects, including:
   * - icon component references
   * - JSX content nodes (Trace tab, etc.)
   */
  extraTabSpecs?: DevBeaconExtraTabSpec[];

  /**
   * Default top viewport offset (e.g., fixed header height).
   * The client wrapper may measure actual header/nav heights and override this value.
   */
  viewportTopOffset?: string;

  /**
   * Default bottom viewport offset (e.g., fixed footer height).
   * The client wrapper may measure actual footer height and override this value.
   */
  viewportBottomOffset?: string;
}

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

  const raw = (process.env.NEXT_PUBLIC_RUNTIME_ENV ?? process.env.NODE_ENV ?? 'prod').toLowerCase();

  if (raw === 'dev' || raw === 'development') return 'sandbox';
  if (raw === 'stage' || raw === 'staging' || raw === 'test') return 'test';

  return 'prod';
}

/**
 * Read tenant context emitted by middleware.
 * IMPORTANT: `headers()` is async in recent Next.js versions.
 * Adjust header names to match your middleware conventions.
 */
async function readTenantFromHeaders(headers: Record<string, string>): Promise<DevBeaconTenantInfo> {
  return {
    id: headers['x-ci-tenant-id'] ?? undefined,
    slug: headers['x-ci-tenant-slug'] ?? undefined,
    name: headers['x-ci-tenant-name'] ?? undefined,
    status: headers['x-ci-tenant-status'] ?? undefined,
    type: headers['x-ci-tenant-type'] ?? undefined,
    source: 'headers',
    scope: (headers['x-ci-tenant-scope'] as CiTenantScope) ?? undefined,
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
export async function DevBeacon({
  ciPageConfig,
  dir = 'ltr',
  position = 'bottom-right',
  visibleWhenEnv = 'sandbox',
  env,
  defaultTab = 'status',
  logo = { kind: 'default' },
  extraTabSpecs = [],
  viewportTopOffset = '120px',
  viewportBottomOffset = '0px',
}: DevBeaconProps) {
  const resolvedEnv = resolveEnv(env);

  // Visibility gate: keep DevBeacon completely out of the tree when disabled.
  const isVisible =
    visibleWhenEnv === null || String(visibleWhenEnv).toLowerCase() === String(resolvedEnv).toLowerCase();

  if (!isVisible) return null;

  const tenant = await readTenantFromHeaders(ciPageConfig.headers ?? {});

  // Pass only plain (serializable) values into the Client boundary.
  return (
    <>
      <DevBeaconWrapper
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
