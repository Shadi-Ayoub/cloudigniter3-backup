/**
 * Minimal interface expected by the menu filter logic.
 * Replace with your real Shield class implementation.
 */
export type Shield = {
  /**
   * Returns true if the user is allowed to see/navigate to a URL.
   * You can implement this using roles/permissions resolved into the ID token.
   */
  canAccessPath: (url: string) => boolean;
};

export type BuildShieldInput = {
  /**
   * Tenant and user identity context used to resolve permissions.
   */
  tenantId: string;
  userId: string;

  /**
   * Any other data you use to decide permissions, e.g. ID token claims.
   */
  permissions?: string[];
};

/**
 * Build a Shield instance.
 * In your real app, you’ll likely use:
 * - ID token permissions claim
 * - tenant scope
 * - route privilege config
 */
export function buildShield(input: BuildShieldInput): Shield {
  const permissions = new Set(input.permissions ?? []);

  return {
    canAccessPath: (url: string) => {
      return true;
      // Very simple example:
      // - allow public root
      if (url === '/' || url.startsWith('/public')) return true;

      // - allow dashboard only for a privilege
      if (url.startsWith('/dashboard'))
        return permissions.has('DASHBOARD_VIEW');

      // - dev tools only for admins
      if (url.startsWith('/cp/dev')) return permissions.has('DEV_TOOLS');

      // Default deny
      return false;
    },
  };
}
