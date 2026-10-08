import { ciCreateAppAccessControl, ciExtensionAccessControl } from "@cloudigniter/core/lib";
import { extensionManifests } from "../modules/.generated/manifests";
import type { CiAccessControlLayer } from "@cloudigniter/core/types";

/**
 * Application-owned access-control additions.
 *
 * Add application domains, resources, actions, and roles here. Core entries
 * are protected: add custom actions beneath a core resource or create a custom
 * role that inherits a core role instead of redefining the core entry.
 *
 * For audit roles, set `readOnly: true` on a privilege. Its resource and scope
 * restrict every write, even if another role grants it; its action still controls
 * what can be read. Custom non-mutating actions must declare `accessMode: "read"`.
 */
export const appAccessControlExtension = {
  domains: [],
  resources: [],
  roles: [],
} as const satisfies CiAccessControlLayer;

/** Default resolved access-control catalog used by the application. */
export const appAccessControl = ciCreateAppAccessControl(
  ciExtensionAccessControl(extensionManifests),
  appAccessControlExtension,
);
