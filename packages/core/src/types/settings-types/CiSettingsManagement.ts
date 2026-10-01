import type { CiSmartFormFieldSpec } from "../smart-form-types";
import type {
  CiSettings,
  CiSettingsRegistry,
  CiSettingsScope,
  CiSettingsStore,
} from "./index";

/** Only explicitly selected/always-loaded domains occur in this request snapshot. */
export type CiRequestSettings = Partial<
  Record<CiSettingsScope, Record<string, CiSettings>>
>;

export type CiSettingsGroup = {
  id: string;
  scope: CiSettingsScope;
  title: string;
  description?: string;
  fields: readonly CiSmartFormFieldSpec[];
  value: CiSettings;
  revision: number;
  alwaysLoad: boolean;
  /** System rules are returned only when managing System values. */
  enforcement?: readonly CiSettingsEnforcementRule[];
  /** Effective fields locked to System; local values remain stored separately. */
  lockedFields?: readonly string[];
  systemRevision?: number;
};

export type CiSettingsTarget =
  | { scope: "system" }
  | { scope: "global" }
  | { scope: "tenant"; tenantId: string };
export type CiSettingsTenantTarget = Exclude<
  CiSettingsTarget,
  { scope: "system" }
>;
export type CiSettingsEnforcementRule = {
  fields: "*" | readonly string[];
  /** All includes GLOBAL, existing tenants, and future tenants. */
  targets: "*" | readonly CiSettingsTenantTarget[];
};
export type CiSettingsManagementAction =
  "read" | "update" | "enforce" | "overwrite";
export type CiSettingsOverwriteSelection = {
  id: string;
  fields: "*" | readonly string[];
  systemRevision: number;
};
export type CiSettingsTargetOption = {
  target: CiSettingsTenantTarget;
  label: string;
};
export type CiSettingsTargetPage = {
  items: CiSettingsTargetOption[];
  nextToken?: string;
};

export type CiSettingsActor = { id: string | null; authenticated: boolean };

export type CiSettingsUpdate = {
  id: string;
  value: unknown;
  revision: number;
  systemRevision?: number;
  enforcement?: readonly CiSettingsEnforcementRule[];
};

export type CiSettingsManagerOptions = {
  registry: CiSettingsRegistry;
  store: CiSettingsStore;
  actor: CiSettingsActor;
  target?: CiSettingsTarget;
  /** Resolve tenant existence/status at a trusted provider boundary. */
  validateTarget?: (target: CiSettingsTarget) => Promise<void>;
  canManage: (
    action: CiSettingsManagementAction,
    target?: CiSettingsTarget,
  ) => boolean | Promise<boolean>;
};

export type CiSettingsManager = {
  read: (id: string) => Promise<CiSettingsGroup>;
  list: (scope: CiSettingsScope) => Promise<CiSettingsGroup[]>;
  save: (
    id: string,
    value: unknown,
    revision: number,
    options?: Pick<CiSettingsUpdate, "systemRevision" | "enforcement">,
  ) => Promise<CiSettingsGroup>;
  /** Validate and atomically save groups belonging to one category and owner. */
  saveAll: (updates: readonly CiSettingsUpdate[]) => Promise<CiSettingsGroup[]>;
  /** One target per atomic overwrite; requires System overwrite permission. */
  overwrite: (
    selection: readonly CiSettingsOverwriteSelection[],
  ) => Promise<CiSettingsGroup[]>;
  loadRequest: (
    ids?: readonly string[],
    cookies?: Readonly<Record<string, string>>,
  ) => Promise<CiRequestSettings>;
};
