import type {
  CiAuthorizer,
  CiAuthorizationSubject,
  CiSettingsManagementAction,
  CiSettingsTarget,
} from "@ci-core/types";

/** System administration is an explicit settings capability, not scope inheritance. */
export function ciCanManageSettings(
  authorizer: CiAuthorizer,
  subject: CiAuthorizationSubject,
  action: CiSettingsManagementAction,
  target: CiSettingsTarget = { scope: "system" },
): boolean {
  const system = authorizer.authorize({
    subject,
    resource: "platform.settings",
    action,
    scope: { kind: "system" },
  });
  if (target.scope === "system") return system.allowed;
  if (action === "enforce") return false;
  const local = authorizer.authorize({
    subject,
    resource: "platform.settings",
    action,
    scope:
      target.scope === "tenant"
        ? { kind: "tenant", tenantId: target.tenantId }
        : { kind: "global" },
  });
  const implicit =
    local.reason === "no-role-assignment" ||
    local.reason === "no-matching-privilege";
  // Explicit denies, read-only, suspension and unsupported catalogs never fall back to System.
  if (action === "overwrite")
    return system.allowed && (local.allowed || implicit);
  return local.allowed || (implicit && system.allowed);
}
