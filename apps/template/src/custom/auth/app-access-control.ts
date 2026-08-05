import { ciCreateAppAccessControl } from "@cloudigniter/core/lib";
import type { CiAccessControlLayer } from "@cloudigniter/core/types";

/**
 * Application-owned access-control additions.
 *
 * Add application domains, resources, actions, and roles here. Core entries
 * are protected: add custom actions beneath a core resource or create a custom
 * role that inherits a core role instead of redefining the core entry.
 */
export const appAccessControlExtension = {
  domains: [],
  resources: [],
  roles: [],
} as const satisfies CiAccessControlLayer;

/** Default resolved access-control catalog used by the application. */
export const appAccessControl = ciCreateAppAccessControl(appAccessControlExtension);
