import type { CiScopedSettingsScope } from "../../common/types/CiScopedSettingsScope";
import type { CiSettings } from "../../common/types/CiSettings";
import type { CiTargetTenantScope } from "../../common/types/CiTargetTenantScope";

/**
 * DynamoDB item shape used for persisted settings records.
 */
export type CiSettingsTableItem<TSettings extends CiSettings = CiSettings> = {
  /**
   * Partition key.
   */
  PK: string;

  /**
   * Sort key.
   */
  SK: string;

  /**
   * Registered settings identifier.
   */
  settingsId: string;

  /**
   * Persistence-supported scope.
   */
  scope: CiScopedSettingsScope;

  /**
   * Ownership boundary for the record.
   */
  targetTenantScope: CiTargetTenantScope;

  /**
   * Optional tenant identifier.
   */
  tenantId?: string;

  /**
   * Optional user identifier.
   */
  userId?: string;

  /**
   * Persisted override payload.
   */
  value: Partial<TSettings>;

  /**
   * Fixed logical type marker.
   */
  type: "settings";

  /**
   * Creation timestamp.
   */
  createdAt: string;

  /**
   * Last update timestamp.
   */
  updatedAt: string;
};
