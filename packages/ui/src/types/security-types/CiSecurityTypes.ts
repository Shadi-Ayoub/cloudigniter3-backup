import type {
  CiSecurityCapabilities,
  CiSecurityMutationResult,
  CiSecurityRecord,
  CiSecurityRecordKind,
} from "@cloudigniter/core/types";

export type CiSecurityDataPageProps = {
  kind: CiSecurityRecordKind;
  title: string;
  description: string;
  records: CiSecurityRecord[];
  capabilities: CiSecurityCapabilities;
  providerLabel?: string;
  roleOptions?: Array<{ id: string; label: string }>;
  resourceOptions?: Array<{ id: string; label: string; actions: string[] }>;
  onSave?: (
    record: CiSecurityRecord,
    reason?: string
  ) => Promise<CiSecurityMutationResult>;
  onDelete?: (
    record: CiSecurityRecord,
    reason?: string
  ) => Promise<CiSecurityMutationResult>;
};
