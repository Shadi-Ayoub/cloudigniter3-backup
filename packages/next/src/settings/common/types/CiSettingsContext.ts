/**
 * Context values used while resolving settings.
 */
export type CiSettingsContext = {
  tenantId?: string;
  userId?: string;
  pathname?: string;
  routeKey?: string;
  global?: boolean;
};
