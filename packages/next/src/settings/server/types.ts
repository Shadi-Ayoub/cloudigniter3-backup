import type {
  CiCanOverrideSettingsValue,
  CiLoadedSettingsLayers,
  CiResolvedSettingsResult,
  CiSettings,
  CiSettingsContext,
  CiSettingsRecord,
  CiSettingsRegistry,
  CiSettingsScope,
  CiScopedSettingsScope,
  CiTargetTenantScope,
} from '../common/types';

/**
 * Low-level key object used by the server store.
 */
export type CiSettingsKeys = {
  /** Partition key. */
  PK: string;
  /** Sort key. */
  SK: string;
};

/**
 * Input used to build low-level settings keys.
 */
export type CiBuildSettingsKeysInput = {
  /** Registered settings identifier. */
  settingsId: string;
  /** Persistence-supported scope. */
  scope: CiScopedSettingsScope;
  /** Ownership boundary for the record. */
  targetTenantScope: CiTargetTenantScope;
  /** Optional tenant identifier. */
  tenantId?: string;
  /** Optional user identifier. Required for `user` scope. */
  userId?: string;
};

/**
 * Input for direct record lookup.
 */
export type CiGetSettingsRecordInput = {
  /** Settings identifier. */
  settingsId: string;
  /** Persistence-supported scope. */
  scope: CiScopedSettingsScope;
  /** Ownership boundary for the record. */
  targetTenantScope: CiTargetTenantScope;
  /** Optional tenant identifier. */
  tenantId?: string;
  /** Optional user identifier. */
  userId?: string;
};

/**
 * Input for persisted record writes.
 */
export type CiSetSettingsInput<TSettings extends CiSettings = CiSettings> = {
  /** Settings identifier. */
  settingsId: string;
  /** Persistence-supported scope. */
  scope: CiScopedSettingsScope;
  /** Ownership boundary for the record. */
  targetTenantScope: CiTargetTenantScope;
  /** Optional tenant identifier. */
  tenantId?: string;
  /** Optional user identifier. */
  userId?: string;
  /** Partial settings payload to persist. */
  value: Partial<TSettings>;
};

/**
 * Input for persisted record deletion.
 */
export type CiDeleteSettingsInput = CiGetSettingsRecordInput;

/**
 * Input for resolved settings reads.
 */
export type CiGetResolvedSettingsInput = {
  /** Settings registry. */
  registry: CiSettingsRegistry;
  /** Registered settings identifier. */
  settingsId: string;
  /** Domain scope requested by the caller. */
  scope: CiSettingsScope;
  /** Request-time resolution context. */
  context?: CiSettingsContext;
  /** Optional override control policy. */
  canOverride?: CiCanOverrideSettingsValue;
};

/**
 * Result returned by the low-level store loader.
 */
export type CiLoadSettingsLayersResult<TSettings extends CiSettings = CiSettings> = {
  /** Layers that were loaded. */
  layers: CiLoadedSettingsLayers<TSettings>;
};

/**
 * Low-level server store contract.
 */
export type CiSettingsStore = {
  /**
   * Fetch a single persisted settings record.
   */
  getRecord: <TSettings extends CiSettings = CiSettings>(
    input: CiGetSettingsRecordInput,
  ) => Promise<CiSettingsRecord<TSettings> | null>;

  /**
   * Save a single persisted settings record.
   */
  setRecord: <TSettings extends CiSettings = CiSettings>(
    input: CiSetSettingsInput<TSettings>,
  ) => Promise<CiSettingsRecord<TSettings>>;

  /**
   * Delete a single persisted settings record.
   */
  deleteRecord: (input: CiDeleteSettingsInput) => Promise<boolean>;
};

/**
 * Settings service contract.
 */
export type CiSettingsService = {
  /**
   * Resolve a final merged settings object.
   */
  getResolved: <TSettings extends CiSettings = CiSettings>(
    input: CiGetResolvedSettingsInput,
  ) => Promise<CiResolvedSettingsResult<TSettings>>;

  /**
   * Read a single persisted record.
   */
  getRecord: <TSettings extends CiSettings = CiSettings>(
    input: CiGetSettingsRecordInput,
  ) => Promise<CiSettingsRecord<TSettings> | null>;

  /**
   * Persist a single record.
   */
  setRecord: <TSettings extends CiSettings = CiSettings>(
    input: CiSetSettingsInput<TSettings>,
  ) => Promise<CiSettingsRecord<TSettings>>;

  /**
   * Delete a single record.
   */
  deleteRecord: (input: CiDeleteSettingsInput) => Promise<boolean>;
};
