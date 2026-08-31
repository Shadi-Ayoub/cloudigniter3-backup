import type {
  CiSecurityMutationResult,
  CiSecurityResourceRecord,
} from "@cloudigniter/core/types";
import type { CiSecurityDataPageProps } from "../security-types";

/** Props for the reusable CloudIgniter resources catalog surface. */
export type CiResourceCatalogPageProps = Omit<
  CiSecurityDataPageProps,
  | "kind"
  | "records"
  | "providerLabel"
  | "roleOptions"
  | "privilegeOptions"
  | "resourceOptions"
  | "onSetRoleStatus"
  | "onSave"
  | "onDelete"
> & {
  records: CiSecurityResourceRecord[];
  onSave?: (
    record: CiSecurityResourceRecord,
    reason?: string,
  ) => Promise<CiSecurityMutationResult>;
  onDelete?: (
    record: CiSecurityResourceRecord,
    reason?: string,
  ) => Promise<CiSecurityMutationResult>;
};
