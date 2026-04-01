import type { CiScopedSettingsScope, CiSettingsScope } from '../common/types';

/**
 * Resolve the persistence-supported scope for a requested settings scope.
 *
 * Route settings are a domain-level concept, but low-level persistence remains
 * limited to `public`, `private`, and `user`.
 *
 * @param scope - Requested domain scope.
 * @returns Persistence-supported scope.
 */
export function ciResolveScopedSettingsScope(scope: CiSettingsScope): CiScopedSettingsScope {
  if (scope === 'route') {
    return 'public';
  }

  return scope;
}
