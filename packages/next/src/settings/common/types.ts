/**
 * Recursive JSON-like value used across the settings domain.
 */
export type CiSettingsValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | CiSettingsValue[]
  | { [key: string]: CiSettingsValue };

/**
 * Generic settings object shape.
 */
export type CiSettings = {
  [key: string]: CiSettingsValue;
};

/**
 * Full domain scope model.
 *
 * `route` exists at the resolution level, but low-level persistence is
 * intentionally limited to the scoped subset defined by
 * {@link CiScopedSettingsScope}.
 */
export type CiSettingsScope = 'public' | 'private' | 'user' | 'route';

/**
 * Persistence-supported scopes.
 */
export type CiScopedSettingsScope = Exclude<CiSettingsScope, 'route'>;

/**
 * Describes the ownership boundary for persisted settings.
 */
export type CiTargetTenantScope = 'system' | 'global' | 'tenant';

/**
 * Layer names used during resolved settings composition.
 */
export type CiSettingsLayerName = 'defaults' | 'system' | 'global' | 'tenant' | 'user';

/**
 * Context values used while resolving settings.
 */
export type CiSettingsContext = {
  /** Tenant identifier of the current request context. */
  tenantId?: string;
  /** User identifier of the current request context. */
  userId?: string;
  /** Current request pathname, used mainly for route-aware resolution. */
  pathname?: string;
  /** Optional normalized route key, if you prefer a route registry abstraction. */
  routeKey?: string;
  /** Whether resolution should treat the request as globally scoped. */
  global?: boolean;
};

/**
 * Minimal schema-like contract used by the settings registry.
 *
 * This keeps the package implementation independent from a specific validation
 * library while still supporting Zod-like APIs.
 */
export type CiSettingsSchema<TSettings extends CiSettings = CiSettings> = {
  /**
   * Parse and return a validated value.
   *
   * Implementations may throw if validation fails.
   */
  parse: (value: unknown) => TSettings;
};

/**
 * Metadata carried by a settings definition.
 */
export type CiSettingsDefinitionMeta = {
  /** Human-friendly title. */
  title?: string;
  /** Longer description intended for docs or admin UIs. */
  description?: string;
  /** Optional category grouping. */
  category?: string;
  /** Optional tag set. */
  tags?: string[];
};

/**
 * Registry definition for a settings domain.
 */
export type CiSettingsDefinition<TSettings extends CiSettings = CiSettings> = {
  /** Domain scope of the settings definition. */
  scope: CiSettingsScope;
  /** Default resolved settings for the domain. */
  defaults?: TSettings;
  /** Optional schema used to validate the final resolved settings. */
  schema?: CiSettingsSchema<TSettings>;
  /**
   * Whether this settings definition should be conceptually merged with a core
   * settings definition of the same scope.
   */
  mergeWithCore?: boolean;
  /** Whether a client-facing projection may read this settings definition. */
  allowClientRead?: boolean;
  /** Whether a client-facing projection may write this settings definition. */
  allowClientWrite?: boolean;
  /** Optional metadata intended for docs and administrative tooling. */
  meta?: CiSettingsDefinitionMeta;
};

/**
 * Settings registry keyed by settings identifier.
 */
export type CiSettingsRegistry = Record<string, CiSettingsDefinition>;

/**
 * Persisted settings record.
 */
export type CiSettingsRecord<TSettings extends CiSettings = CiSettings> = {
  /** Registered settings identifier. */
  settingsId: string;
  /** Persistence-supported scope. */
  scope: CiScopedSettingsScope;
  /** Ownership boundary for the record. */
  targetTenantScope: CiTargetTenantScope;
  /** Optional tenant identifier. */
  tenantId?: string;
  /** Optional user identifier. Required for `user` records. */
  userId?: string;
  /** Persisted override values for the record. */
  value: Partial<TSettings>;
  /** ISO timestamp for creation. */
  createdAt?: string;
  /** ISO timestamp for last update. */
  updatedAt?: string;
};

/**
 * Loaded settings layers used while building a resolved settings object.
 */
export type CiLoadedSettingsLayers<TSettings extends CiSettings = CiSettings> = {
  /** Registry defaults. */
  defaults: TSettings;
  /** Optional system layer. */
  system?: Partial<TSettings>;
  /** Optional global layer. */
  global?: Partial<TSettings>;
  /** Optional tenant layer. */
  tenant?: Partial<TSettings>;
  /** Optional user layer. */
  user?: Partial<TSettings>;
};

/**
 * Input delivered to the override policy callback.
 */
export type CiCanOverrideSettingsValueInput = {
  /** Settings identifier currently being merged. */
  settingsId: string;
  /** Dot-path of the value currently being merged. */
  path: string;
  /** Existing winning layer. */
  fromLayer: CiSettingsLayerName;
  /** Incoming candidate layer. */
  toLayer: CiSettingsLayerName;
  /** Optional tenant identifier. */
  tenantId?: string;
  /** Optional user identifier. */
  userId?: string;
  /** Current winning value, if any. */
  currentValue?: CiSettingsValue;
  /** Incoming value candidate. */
  nextValue: CiSettingsValue;
};

/**
 * Override policy callback.
 */
export type CiCanOverrideSettingsValue = (
  input: CiCanOverrideSettingsValueInput,
) => boolean | Promise<boolean>;

/**
 * Successful resolved settings payload.
 */
export type CiResolvedSettingsResult<TSettings extends CiSettings = CiSettings> = {
  /** Settings identifier that was resolved. */
  settingsId: string;
  /** Requested domain scope. */
  scope: CiSettingsScope;
  /** Persistence-supported scope used internally by the store. */
  scopedScope: CiScopedSettingsScope;
  /** Defaults used during resolution. */
  defaults: TSettings;
  /** Final resolved value. */
  value: TSettings;
  /** Loaded layers that participated in resolution. */
  layers: CiLoadedSettingsLayers<TSettings>;
};
