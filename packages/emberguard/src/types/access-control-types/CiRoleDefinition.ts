import type { CiPrivilege } from "./CiPrivilege";

/** Runtime availability of a reusable authorization role. */
export type CiRoleStatus = "active" | "suspended";

/** Metadata for the latest deliberate role-status transition. */
export type CiRoleStatusChange = {
  changedAt: string;
  changedBy: string;
  reason: string;
};

/** Reusable role/group and its privilege set. */
export type CiRoleDefinition = {
  id: string;
  title: string;
  description?: string;

  /** Lower numbers have higher precedence, matching Amazon Cognito semantics. */
  precedence: number;

  /** Roles whose privileges this role inherits. */
  inherits?: readonly string[];
  privileges: readonly CiPrivilege[];

  /** Omitted catalogs remain backward compatible and are treated as active. */
  status?: CiRoleStatus;

  /** Actor, timestamp, and required reason for the latest status transition. */
  statusChange?: CiRoleStatusChange;
};
