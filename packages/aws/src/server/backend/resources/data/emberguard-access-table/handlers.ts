export const EMBERGUARD_ACCESS_TABLE_HANDLERS = [
  "ciGetEmberguardDefinitionHandler",
  "ciSetEmberguardDefinitionHandler",
  "ciListEmberguardRoleAssignmentsHandler",
  "ciPutEmberguardRoleAssignmentHandler",
  "ciDeleteEmberguardRoleAssignmentHandler",
  "ciListEmberguardResourceInventoryHandler",
  "ciPutEmberguardResourceInventoryHandler",
  "ciListEmberguardCustomDomainsHandler",
  "ciPutEmberguardCustomDomainHandler",
  "ciDeleteEmberguardCustomDomainHandler",
] as const;

export type CiEmberguardAccessTableHandlers =
  (typeof EMBERGUARD_ACCESS_TABLE_HANDLERS)[number];
