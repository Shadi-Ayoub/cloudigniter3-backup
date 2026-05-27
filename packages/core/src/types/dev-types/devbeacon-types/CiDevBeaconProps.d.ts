import type { CiEnvMode, CiLocaleDirection } from "@ci-core/types";
import type { CiCorePageConfig } from "@ci-core/client";
import type { CiDevBeaconExtraTabSpec, CiDevBeaconLogoSpec, CiDevBeaconPosition, CiDevBeaconTabValue } from "@ci-core/types";
/**
 * Server-side DevBeacon props.
 *
 * IMPORTANT:
 * - This component is a Server Component and MUST only pass serializable (plain) props to the Client wrapper.
 * - Do not pass React elements/functions here (e.g., icons, components, JSX). Use spec types instead.
 */
export interface CiDevBeaconProps {
    /**
     * CloudIgniter Page configurations passed by the application.
     */
    corePageConfig: CiCorePageConfig;
    /**
     * CloudIgniter Page configurations passed by the application.
     */
    /**
     * Layout direction for the DevBeacon UI surface.
     * Forwarded to the client wrapper and used to set `dir` on the content container.
     */
    dir?: CiLocaleDirection;
    /**
     * Floating button placement on the viewport (e.g. "bottom-right").
     * Implemented by `DevBeaconButton` positioning classes in the client layer.
     */
    position?: CiDevBeaconPosition;
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
    defaultTab?: CiDevBeaconTabValue | string;
    /**
     * SERVER-SAFE logo specification.
     * The client wrapper converts this spec into a React node (e.g. `next/image`),
     * because Server Components cannot pass React elements through a client boundary.
     */
    logo?: CiDevBeaconLogoSpec;
    /**
     * SERVER-SAFE additional tabs specification.
     * The client wrapper converts specs into concrete `ExtraTab[]` objects, including:
     * - icon component references
     * - JSX content nodes (Trace tab, etc.)
     */
    extraTabSpecs?: CiDevBeaconExtraTabSpec[];
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
//# sourceMappingURL=CiDevBeaconProps.d.ts.map