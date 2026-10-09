import policy from "../hosting-policy.json" with { type: "json" };

/** Server integration for the CloudIgniter website's Docs callback. These
 * callbacks close over the verified template request context and EmberGuard
 * authorizer. Never construct them from request JSON, role headers or browser
 * storage. This module is not included in either static browser bundle.
 *
 * @param {{
 *   resolveUser: () => Promise<{id: string|null, authenticated: boolean, roles: readonly string[], sessionExpiresAt: string}>,
 *   authorize: (request: {resource: string, action: string}) => Promise<{allowed: boolean, evaluatedRoleIds: readonly string[]}>,
 *   issueAccess: (grant: {resource: string, expiresAt: number, cookiePath: string}) => Promise<void>
 * }} runtime
 * @param {number} [now] Current Unix time in seconds.
 */
export async function authorizeDocsSession(
  runtime,
  now = Math.floor(Date.now() / 1000),
) {
  const user = await runtime.resolveUser();
  if (!user.authenticated || !user.id) return { status: 401, allowed: false };
  if (!user.roles.includes(policy.requiredRole))
    return { status: 403, allowed: false };
  const decision = await runtime.authorize({
    resource: policy.resource,
    action: policy.action,
  });
  if (
    !decision.allowed ||
    !decision.evaluatedRoleIds.includes(policy.requiredRole)
  ) {
    return { status: 403, allowed: false };
  }
  const sessionEnd = Math.floor(Date.parse(user.sessionExpiresAt) / 1000);
  if (
    !Number.isFinite(now) ||
    !Number.isFinite(sessionEnd) ||
    sessionEnd <= now
  )
    return { status: 401, allowed: false };
  const expiresAt = Math.min(now + policy.sessionMaxAgeSeconds, sessionEnd);
  await runtime.issueAccess({
    resource: `${policy.url}${policy.developerBaseUrl}*`,
    expiresAt,
    cookiePath: policy.developerBaseUrl,
  });
  return { status: 204, allowed: true, expiresAt };
}
