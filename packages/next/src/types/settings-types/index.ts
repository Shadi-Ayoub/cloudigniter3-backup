import type {
  CiGraphQLResponse,
  CiSettingsManagerOptions,
  CiSettingsUpdate,
  CiSettingsTarget,
  CiSettingsTenantTarget,
  CiSettingsOverwriteSelection,
} from "@cloudigniter/core/types";
import type { CiSettingsManagerProps } from "@cloudigniter/ui/types";

export type CiNextSettingsManagerProps = Omit<
  CiSettingsManagerProps,
  "onClose"
> & {
  /** Enables Close. Only same-origin application paths are accepted. */
  closeHref?: string;
};
export type CiNextAwsSettingsManagerOptions = Omit<
  CiSettingsManagerOptions,
  "store"
> & {
  /** False only when the generated backend has no Settings operations yet. Reads use registry defaults; writes fail. */
  provisioned?: boolean;
  operations: {
    /** Sends all updates through an atomic, independently authorized backend operation. */
    setMany?: (input: {
      groups: readonly CiSettingsUpdate[];
      target?: CiSettingsTarget;
    }) => Promise<CiGraphQLResponse>;
    overwrite?: (input: {
      selection: readonly CiSettingsOverwriteSelection[];
      target: CiSettingsTenantTarget;
    }) => Promise<CiGraphQLResponse>;
    get: (
      input: { id: string; target?: CiSettingsTarget; manage?: boolean },
      authenticated: boolean,
    ) => Promise<CiGraphQLResponse>;
    set: (
      input: CiSettingsUpdate & { target?: CiSettingsTarget },
    ) => Promise<CiGraphQLResponse>;
  };
};
