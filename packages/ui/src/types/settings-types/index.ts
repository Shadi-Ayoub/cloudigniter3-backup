import type {
  CiSettingsGroup,
  CiSettingsUpdate,
  CiSettingsTarget,
  CiSettingsTenantTarget,
  CiSettingsOverwriteSelection,
  CiSettingsTargetPage,
} from "@cloudigniter/core/types";
export type CiSettingsManagementView = {
  groups: CiSettingsGroup[];
  canUpdate: boolean;
  canEnforce: boolean;
  canOverwrite: boolean;
};
export type CiSettingsTenancyProps = {
  target: CiSettingsTarget;
  canEnforce: boolean;
  canOverwrite: boolean;
  onLoad: (target: CiSettingsTarget) => Promise<CiSettingsManagementView>;
  onListTargets: (nextToken?: string) => Promise<CiSettingsTargetPage>;
  onOverwrite: (
    target: CiSettingsTenantTarget,
    selection: readonly CiSettingsOverwriteSelection[],
  ) => Promise<void>;
};
export type CiSettingsManagerProps = {
  title: string;
  description?: string;
  groups: readonly CiSettingsGroup[];
  canUpdate: boolean;
  /** Storage/setup failure, independent of editing permission. Keeps Save visible but disabled. */
  saveUnavailableReason?: string;
  notice?: string;
  tenancy?: CiSettingsTenancyProps;
  /** Optional navigation action; rendered beside Save for owner preferences. */
  onClose?: () => void;
  onSave: (
    updates: readonly CiSettingsUpdate[],
    target?: CiSettingsTarget,
  ) => Promise<
    { ok: true; groups: CiSettingsGroup[] } | { ok: false; message: string }
  >;
};
